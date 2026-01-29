import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import prisma from '../prismaClient';
import fs from 'fs';
import path from 'path';
import { decryptName, encryptName } from '../utils/crypto';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
export const uploadQueue = new Queue('uploads', { connection });

// Worker: process uploaded files, call OCR service, parse result, store Test
const worker = new Worker('uploads', async job => {
  const { filePath, body } = job.data as any;

  try {
    // Read file and send to OCR service
    const fileStream = fs.createReadStream(filePath);
    // use form-data via axios
    const formData = new (require('form-data'))();
    formData.append('file', fileStream);
    const res = await axios.post((process.env.OCR_URL || 'http://ocr:8000') + '/extract', formData, { headers: formData.getHeaders() });
    const text: string = res.data.text || '';

    // Simple parsing heuristic: find lines like "TestName: value"
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed: any = {};
    for (const l of lines) {
      const m = l.match(/^([A-Za-z0-9 ]+):\s*(.+)$/);
      if (m) parsed[m[1].trim()] = m[2].trim();
    }

    const patientName = body.patientName || parsed['Patient'] || parsed['Name'] || '';
    const testName = body.testName || parsed['Test'] || parsed['Test Name'] || 'Unknown Test';
    const result = body.result || parsed['Result'] || '';
    const referenceRange = body.referenceRange || parsed['Reference Range'] || '';
    const dateOfTest = body.dateOfTest ? new Date(body.dateOfTest) : (parsed['Date'] ? new Date(parsed['Date']) : new Date());

    // encrypt patient name and create/find patient
    const encName = encryptName(patientName || '');
    let patient = await prisma.patient.findFirst({ where: { name: encName } });
    if (!patient) patient = await prisma.patient.create({ data: { name: encName } });

    await prisma.test.create({ data: {
      testName,
      result,
      referenceRange,
      dateOfTest,
      patientId: patient.id
    }});

    // create audit log
    await prisma.auditLog.create({ data: { action: 'processed_upload', details: `Processed file ${path.basename(filePath)}` } });

    // cleanup file
    try { fs.unlinkSync(filePath); } catch (e) {}

    return { ok: true };
  } catch (err: any) {
    console.error('upload worker error', err.message);
    return { ok: false, error: err.message };
  }
}, { connection });

worker.on('failed', (job, err) => console.error('job failed', job.id, err));

export default worker;
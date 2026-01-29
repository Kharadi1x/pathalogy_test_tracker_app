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

    // Use specialized parser to extract structured fields from OCR text
    const { parseTextToFields } = await import('../ocr/parser');
    const parsedReport = parseTextToFields(text);

    const patientName = body.patientName || parsedReport.patientName || '';
    const primaryTest = parsedReport.tests?.[0] || {};
    const testName = body.testName || primaryTest.testName || 'Unknown Test';
    const result = body.result || primaryTest.result || '';
    const referenceRange = body.referenceRange || primaryTest.referenceRange || '';
    const dateOfTest = body.dateOfTest ? new Date(body.dateOfTest) : (parsedReport.dateOfTest ? new Date(parsedReport.dateOfTest) : new Date());

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
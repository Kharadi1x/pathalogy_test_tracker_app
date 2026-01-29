import axios from 'axios';
import prisma from '../prismaClient';
import fs from 'fs';
import path from 'path';
import { encryptName } from '../utils/crypto';
import { parseTextToFields } from '../ocr/parser';

export async function processUpload(filePath: string, body: any) {
  // Read file and send to OCR service
  const fileStream = fs.createReadStream(filePath);
  const formData = new (require('form-data'))();
  formData.append('file', fileStream);
  const res = await axios.post((process.env.OCR_URL || 'http://ocr:8000') + '/extract', formData, { headers: formData.getHeaders() });
  const text: string = res.data.text || '';

  // Parse OCR text
  const parsedReport = parseTextToFields(text);

  const patientName = body.patientName || parsedReport.patientName || '';
  const primaryTest: any = parsedReport.tests?.[0] || {};
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
}

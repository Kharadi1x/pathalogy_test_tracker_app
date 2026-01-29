import express from 'express';
import multer from 'multer';
import prisma from '../prismaClient';
import axios from 'axios';
import { encryptName } from '../utils/crypto';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { testType, testName, result, referenceRange, dateOfTest, patientName } = req.body;

    // encrypt patient name before storing
    const encryptedName = encryptName(patientName);

    // create or find patient
    let patient = await prisma.patient.findFirst({ where: { name: encryptedName } });
    if (!patient) {
      patient = await prisma.patient.create({ data: { name: encryptedName } });
    }

    // create test
    const test = await prisma.test.create({
      data: {
        testName: testName || testType,
        result: result || '',
        referenceRange: referenceRange || '',
        dateOfTest: dateOfTest ? new Date(dateOfTest) : new Date(),
        patientId: patient.id
      }
    });

    // if file uploaded, forward to OCR service asynchronously
    if (req.file) {
      axios.post('http://ocr:8000/extract', null, {
        headers: { 'content-type': 'multipart/form-data' }
      }).catch(err => console.error('OCR proxy error', err.message));
    }

    res.json({ ok: true, testId: test.id });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
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

    // if file uploaded, enqueue background job to process it
    if (req.file) {
      const filePath = req.file.path;
      const job = await (await import('../queue')).uploadQueue.add('process', { filePath, body: req.body });
      console.log('enqueued job', job.id);
    }

    res.json({ ok: true, testId: test.id });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
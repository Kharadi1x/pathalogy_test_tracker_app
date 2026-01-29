import express from 'express';
import prisma from '../prismaClient';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { decryptName, encryptName } from '../utils/crypto';

const router = express.Router();

// Get patient info (masked name)
router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return res.status(404).json({ error: 'not found' });
    // do not reveal full name here;
    res.json({ id: patient.id, name: patient.name ? '****' : null, createdAt: patient.createdAt });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get tests for patient
router.get('/:id/tests', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const patient = await prisma.patient.findUnique({ where: { id }, include: { tests: true } });
    if (!patient) return res.status(404).json({ error: 'not found' });

    // allow admin
    if (req.user.role === 'ADMIN') {
      // decrypt name for response
      let decryptedName = 'REDACTED';
      try { decryptedName = decryptName(patient.name); } catch (e) { /* keep redacted */ }
      return res.json(patient.tests.map(t => ({ ...t, patientName: decryptedName })));
    }

    // if patient role, ensure ownership by matching encrypted name
    if (req.user.role === 'PATIENT') {
      const enc = encryptName(req.user.name);
      if (enc !== patient.name) return res.status(403).json({ error: 'forbidden' });
      const decryptedName = decryptName(patient.name);
      return res.json(patient.tests.map(t => ({ ...t, patientName: decryptedName })));
    }

    res.status(403).json({ error: 'forbidden' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reveal patient name (admin or owner only)
router.post('/:id/reveal', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return res.status(404).json({ error: 'not found' });

    if (req.user.role === 'ADMIN') {
      return res.json({ name: decryptName(patient.name) });
    }

    if (req.user.role === 'PATIENT') {
      const enc = encryptName(req.user.name);
      if (enc !== patient.name) return res.status(403).json({ error: 'forbidden' });
      return res.json({ name: decryptName(patient.name) });
    }

    res.status(403).json({ error: 'forbidden' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
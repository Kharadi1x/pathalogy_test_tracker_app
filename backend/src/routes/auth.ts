import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'user already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, name, password: hashed, role: role || 'PATIENT' } });
    res.json({ id: user.id, email: user.email });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'change_me', { expiresIn: '7d' });
    res.json({ token });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req: any, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).json({ error: 'unauthorized' });
    const decoded: any = jwt.verify(auth, process.env.JWT_SECRET || 'change_me');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    res.json({ id: user?.id, email: user?.email, name: user?.name, role: user?.role });
  } catch (err: any) {
    console.error(err);
    res.status(401).json({ error: 'unauthorized' });
  }
});

export default router;
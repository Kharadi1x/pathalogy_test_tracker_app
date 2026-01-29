import express from 'express';
import dotenv from 'dotenv';
import prismaClient from './prismaClient';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import ocrRouter from './routes/ocr';
import { requireAuth } from './middleware/auth';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.send({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ocr', ocrRouter);
import patientsRouter from './routes/patients';
app.use('/api/patients', patientsRouter);
import jobsRouter from './routes/jobs';
app.use('/api/jobs', jobsRouter);

// example protected route
app.get('/api/profile', requireAuth, async (req: any, res) => {
  res.json({ id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role });
});

app.listen(process.env.PORT || 4000, () => {
  console.log('Backend running on port', process.env.PORT || 4000);
});

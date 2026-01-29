import express from 'express';
import { uploadQueue } from '../queue';

const router = express.Router();

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const job: any = await uploadQueue.getJob(id as any);
  if (!job) return res.status(404).json({ error: 'not found' });
  const state = await job.getState();
  const progress = job.progress;
  const result = job.returnvalue;
  res.json({ id: job.id, state, progress, result });
});

export default router;
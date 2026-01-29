import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processUpload } from './processor';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
export const uploadQueue = new Queue('uploads', { connection });

// Worker: delegate processing to processUpload for testability
const worker = new Worker('uploads', async job => {
  const { filePath, body } = job.data as any;
  return await processUpload(filePath, body);
}, { connection });

worker.on('failed', (job, err) => console.error('job failed', job.id, err));

export default worker;
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';

// Ensure AES key exists for encryptName in upload route
process.env.AES_KEY = require('crypto').randomBytes(32).toString('base64');

// Start a small OCR stub server that accepts a file and returns fixture text
function startOcrStub(fixtureText: string) {
  const app = express();
  // simple stub: accept any POST to /extract and return fixture text
  app.post('/extract', (_req, res) => {
    res.json({ text: fixtureText });
  });
  const server = app.listen(0);
  return server;
}

// Mock prisma client module so we don't need a generated Prisma client in tests
jest.mock('../../src/prismaClient', () => ({
  __esModule: true,
  default: {
    patient: { findFirst: jest.fn(), create: jest.fn() },
    test: { create: jest.fn() },
    auditLog: { create: jest.fn() }
  }
}));

// bcrypt uses native bindings which may not be available in the test environment
jest.mock('bcrypt', () => ({
  hash: jest.fn(async (s: string) => `hashed:${s}`),
  compare: jest.fn(async () => true)
}));

// Mock the queue module: uploadQueue.add will be spied on and we will call processUpload
jest.mock('../../src/queue', () => ({
  uploadQueue: { add: jest.fn() }
}));

import prisma from '../../src/prismaClient';
const uploadQueue = require('../../src/queue').uploadQueue;
const { processUpload } = require('../../src/queue/processor');
import app from '../../src/index';

const fixtureText = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample_report_6.txt'), 'utf-8');

let ocrServer: any;

beforeAll(() => {
  // start OCR stub
  ocrServer = startOcrStub(fixtureText);
  const port = (ocrServer.address() as any).port;
  process.env.OCR_URL = `http://localhost:${port}`;
});

afterAll(() => {
  if (ocrServer) ocrServer.close();
  // cleanup any uploaded files (portable)
  try {
    const upl = path.join(__dirname, '..', '..', 'uploads');
    if (fs.existsSync(upl)) {
      fs.readdirSync(upl).forEach(f => {
        try { fs.unlinkSync(path.join(upl, f)); } catch (e) {}
      });
      try { fs.rmdirSync(upl); } catch (e) {}
    }
  } catch (e) {}
});

beforeEach(() => {
  // reset mocks
  jest.clearAllMocks();
  // prisma mocks
  (prisma.patient.findFirst as jest.Mock).mockResolvedValue(null);
  (prisma.patient.create as jest.Mock).mockResolvedValue({ id: 999, name: 'enc' });
  (prisma.test.create as jest.Mock).mockResolvedValue({ id: 4321 });
  (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 1 });

  // make uploadQueue.add call processUpload synchronously to emulate worker
  (uploadQueue.add as jest.Mock).mockImplementation(async (_name: string, payload: any) => {
    // call processUpload immediately with file path
    await processUpload(payload.filePath, payload.body || {});
    return { id: 'mock-job' };
  });
});

test('full upload flow: POST /api/upload with file enqueues job and triggers processing', async () => {
  const res = await request(app)
    .post('/api/upload')
    .field('patientName', 'Integration User')
    .attach('file', path.join(__dirname, '..', 'fixtures', 'sample_report_6.txt'))
    .expect(200);

  expect(res.body.ok).toBe(true);
  // uploadQueue.add should have been called
  expect(uploadQueue.add).toHaveBeenCalled();
  // prisma.test.create should have been called at least once (route create + worker create)
  expect(prisma.test.create).toHaveBeenCalled();
  // audit log created by worker
  expect(prisma.auditLog.create).toHaveBeenCalled();
});

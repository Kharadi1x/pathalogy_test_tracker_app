import fs from 'fs';
import path from 'path';

// Mock prisma client to avoid requiring a generated @prisma/client during unit tests
jest.mock('../src/prismaClient', () => ({
  __esModule: true,
  default: {
    patient: { findFirst: jest.fn(), create: jest.fn() },
    test: { create: jest.fn() },
    auditLog: { create: jest.fn() }
  }
}));

jest.mock('axios');
const axios = require('axios');
const prisma = require('../src/prismaClient').default;
const { processUpload } = require('../src/queue/processor');

describe('processUpload integration (mocked OCR + prisma)', () => {
  const tmpFile = path.join(__dirname, 'tmp-upload.txt');
  const sampleText = `Patient: Integration Test\nLab: Mock Labs\nDate: 2026-01-01\nGlucose: 7.2 mmol/L (4.0-6.0)`;

  beforeAll(() => {
    // ensure AES_KEY exists for encryptName during tests
    process.env.AES_KEY = require('crypto').randomBytes(32).toString('base64');
  });

  beforeEach(() => {
    fs.writeFileSync(tmpFile, 'dummy');
    // mock OCR response
    (axios.post as jest.Mock).mockResolvedValue({ data: { text: sampleText } });

    // mock prisma methods
    jest.spyOn(prisma.patient, 'findFirst').mockResolvedValue(null as any);
    jest.spyOn(prisma.patient, 'create').mockResolvedValue({ id: 4242, name: 'enc' } as any);
    jest.spyOn(prisma.test, 'create').mockResolvedValue({} as any);
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
  });

  afterEach(() => {
    try { fs.unlinkSync(tmpFile); } catch (e) {}
    jest.restoreAllMocks();
  });

  test('processUpload should call OCR, parse and create test + audit log', async () => {
    const res = await processUpload(tmpFile, {});
    expect(res.ok).toBe(true);
    expect(axios.post).toHaveBeenCalled();
    expect(prisma.test.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ testName: expect.any(String), result: expect.stringMatching(/[0-9.]/) }) }));
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalledWith(tmpFile);
  });
});

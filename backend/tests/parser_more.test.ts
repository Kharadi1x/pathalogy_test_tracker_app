import { parseTextToFields } from '../src/ocr/parser';
import fs from 'fs';
import path from 'path';

test('parses table-like and inequalities (sample_report_3)', () => {
  const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_report_3.txt'), 'utf8');
  const parsed = parseTextToFields(txt);
  expect(parsed.patientName).toBe('Alice');
  expect(parsed.dateOfTest).toBe('2025-11-20');
  expect(parsed.tests.length).toBe(3);
  expect(parsed.tests[0].testName).toMatch(/WBC/i);
  expect(parsed.tests[0].result).toBe('5.6');
  expect(parsed.tests[0].unit).toBe('10^9/L');
  expect(parsed.tests[2].testName).toMatch(/CRP/i);
  expect(parsed.tests[2].result).toBe('<2.0');
});

test('parses non-numeric results (sample_report_4)', () => {
  const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_report_4.txt'), 'utf8');
  const parsed = parseTextToFields(txt);
  expect(parsed.patientName).toBe('Bob');
  expect(parsed.tests.length).toBe(2);
  expect(parsed.tests[0].testName).toMatch(/COVID PCR/i);
  expect(parsed.tests[0].result).toBe('Positive');
  expect(parsed.tests[1].result).toBe('Negative');
});

test('parses headered table (sample_report_5)', () => {
  const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_report_5.txt'), 'utf8');
  const parsed = parseTextToFields(txt);
  expect(parsed.patientName).toBe('Carl');
  expect(parsed.tests.length).toBe(2);
  expect(parsed.tests[0].testName).toMatch(/Glucose/i);
  expect(parsed.tests[0].result).toBe('5.9');
  expect(parsed.tests[1].result).toBe('180');
});
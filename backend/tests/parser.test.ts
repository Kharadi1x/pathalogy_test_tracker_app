import { parseTextToFields } from '../src/ocr/parser';
import fs from 'fs';
import path from 'path';

test('parses sample_report_1', () => {
  const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_report_1.txt'), 'utf8');
  const parsed = parseTextToFields(txt);
  console.log('parsed1', JSON.stringify(parsed, null, 2));
  expect(parsed.patientName).toBe('John Doe');
  expect(parsed.labName).toBe('Acme Labs');
  expect(parsed.dateOfTest).toBe('2025-12-01');
  expect(parsed.tests.length).toBe(2);
  expect(parsed.tests[0].testName).toMatch(/Glucose/i);
  expect(parsed.tests[0].result).toBe('5.6');
  expect(parsed.tests[0].referenceRange).toContain('4.0-6.0');
});

test('parses sample_report_2', () => {
  const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_report_2.txt'), 'utf8');
  const parsed = parseTextToFields(txt);
  console.log('parsed2', JSON.stringify(parsed, null, 2));
  expect(parsed.patientName).toBe('Jane Smith');
  expect(parsed.labName).toBe('Central Path');
  expect(parsed.dateOfTest).toBe('01/06/2025');
  expect(parsed.tests.length).toBe(2);
  expect(parsed.tests[1].testName).toMatch(/HbA1c/i);
  expect(parsed.tests[1].result).toBe('6.5');
});
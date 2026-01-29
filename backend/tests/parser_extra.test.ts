import fs from 'fs';
import path from 'path';
import { parseTextToFields } from '../src/ocr/parser';

const fixture = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_report_6.txt'), 'utf-8');

test('parses varied formats and indented table rows (sample_report_6)', () => {
  const parsed = parseTextToFields(fixture);
  expect(parsed.patientName).toBe('Daisy');
  expect(parsed.labName).toMatch(/Specialty/i);
  expect(parsed.tests.length).toBeGreaterThanOrEqual(6);
  expect(parsed.tests.find(t => /WBC/i.test(t.testName ?? ''))?.result).toBe('7.2');
  expect(parsed.tests.find(t => /Creatinine/i.test(t.testName ?? ''))?.result).toBe('0.9');
  expect(parsed.tests.find(t => /LDL/i.test(t.testName ?? ''))?.result).toBe('110');
});

export interface ParsedTest {
  testName: string;
  result?: string;
  unit?: string;
  referenceRange?: string;
}

export interface ParsedReport {
  patientName?: string;
  labName?: string;
  dateOfTest?: string;
  tests: ParsedTest[];
}

// Heuristic-based parser for OCR'd text. Not perfect but covers common lab report formats.
export function parseTextToFields(text: string): ParsedReport {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsed: ParsedReport = { tests: [] };

  const dateRegex = /(?:(?:Date|Dated)[:\s]+)?(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s?\d{4})/i;
  const patientRegex = /^(?:Patient Name|Patient|Name)[:\s]+(.+)$/i;
  const labRegex = /^(?:Lab|Laboratory|Lab Name)[:\s]+(.+)$/i;

  for (const line of lines) {
    // Patient
    const pm = line.match(patientRegex);
    if (pm) {
      parsed.patientName = pm[1].trim();
      continue;
    }
    // Lab
    const lm = line.match(labRegex);
    if (lm) {
      parsed.labName = lm[1].trim();
      continue;
    }
    // Date
    const dm = line.match(dateRegex);
    if (dm && !parsed.dateOfTest) {
      parsed.dateOfTest = dm[1] || dm[0];
      continue;
    }

    // Test line heuristics: "TestName 5.6 unit (4.0-6.0)" or "TestName: 5.6"
    // Try colon-separated first
    const colonMatch = line.match(/^([^:\-]{2,60})[:\-]\s*([0-9]+(?:\.[0-9]+)?)(?:\s*([^\(]+))?(?:\s*\(([^\)]+)\))?$/);
    if (colonMatch) {
      parsed.tests.push({ testName: colonMatch[1].trim(), result: colonMatch[2].trim(), unit: (colonMatch[3] || '').trim() || undefined, referenceRange: (colonMatch[4] || '').trim() || undefined });
      continue;
    }

    // Space-separated number match
    const spacedMatch = line.match(/^(.{2,60}?)\s+([0-9]+(?:\.[0-9]+)?)(?:\s*([a-zA-Z%\/]+))?(?:\s*\(([^\)]+)\))?$/);
    if (spacedMatch) {
      parsed.tests.push({ testName: spacedMatch[1].trim(), result: spacedMatch[2].trim(), unit: spacedMatch[3]?.trim(), referenceRange: spacedMatch[4]?.trim() });
      continue;
    }

    // Result-like lines: "Result: 5.6"
    const resultMatch = line.match(/^Result[:\s]+([0-9]+(?:\.[0-9]+)?)/i);
    if (resultMatch && parsed.tests.length) {
      parsed.tests[parsed.tests.length - 1].result = parsed.tests[parsed.tests.length - 1].result || resultMatch[1];
      continue;
    }
  }

  return parsed;
}
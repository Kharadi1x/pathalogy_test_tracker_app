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
    // skip lines that start with a number (likely ranges or stray values)
    if (/^[0-9]/.test(line)) continue;

    // DEBUG: log line and basic matches when running tests (helps debugging)
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line no-console
      console.log('PARSE LINE:', JSON.stringify(line));
    }

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
    // Try colon-separated first (require name to start with letter)
    // General numeric-first parsing: find first numeric token and treat preceding text as test name
    // Attempt colon-based non-numeric results first (e.g., "COVID PCR: Positive")
    // match either colon separator or a spaced hyphen (" - "), but avoid matching range hyphens like "4.0-6.0"
    const colonAnyMatch = line.match(/^(.+?)(?::|\s-\s)\s*(.+?)(?:\s*\(([^\)]+)\))?$/);
    if (colonAnyMatch) {
      const name = colonAnyMatch[1].trim();
      const rest = colonAnyMatch[2].trim();
      const parenMatch = colonAnyMatch[3] ? colonAnyMatch[3].trim() : undefined;

      // find all numeric tokens with indices
      const numRegex = /([<>]?\s*[0-9]+(?:\.[0-9]+)?)/g;
      const nums: Array<{ val: string; idx: number }> = [];
      let mm;
      while ((mm = numRegex.exec(rest)) !== null) {
        const numberText = mm[1].replace(/\s+/g, '');
        const idx = mm.index + mm[0].indexOf(mm[1]);
        nums.push({ val: numberText, idx });
      }

      if (nums.length) {
        // prefer numeric token occurring before any '(' in rest (if present)
        const parenIdxRest = rest.indexOf('(');
        let chosen = nums[0];
        if (parenIdxRest >= 0) {
          const cand = nums.find(n => n.idx < parenIdxRest);
          if (cand) chosen = cand;
        }
        if (process.env.NODE_ENV === 'test') {
          // eslint-disable-next-line no-console
          console.log('colon nums', nums, 'chosen', chosen, 'rest', rest);
        }
        const result = chosen.val;
        const after = rest.slice(chosen.idx + result.length).trim();
        const unit = after.split('(')[0].trim() || undefined;
        parsed.tests.push({ testName: name, result, unit, referenceRange: parenMatch });
      } else {
        parsed.tests.push({ testName: name, result: rest, unit: undefined, referenceRange: parenMatch });
      }
      continue;
    }

    // General numeric-first parsing: find all standalone numeric tokens (accept inequalities)
    const numRegex = /(?:^|\s)([<>]?\s*[0-9]+(?:\.[0-9]+)?)/g;
    const numsAll: Array<{ val: string; idx: number }> = [];
    let mm2;
    while ((mm2 = numRegex.exec(line)) !== null) {
      const val = mm2[1].replace(/\s+/g, '');
      const idx = mm2.index + mm2[0].indexOf(mm2[1]);
      numsAll.push({ val, idx });
    }
    if (numsAll.length) {
      const parenIdx = line.indexOf('(');
      let chosen = numsAll[0];
      if (parenIdx >= 0) {
        const cand = numsAll.find(n => n.idx < parenIdx);
        if (cand) chosen = cand;
        else chosen = numsAll[0];
      }
      const result = chosen.val;
      const idx = chosen.idx;
      let namePart = line.slice(0, idx).replace(/[:\-\s]*$/g, '').trim();
      namePart = namePart.replace(/[:\-]$/g, '').trim();
      const after = line.slice(idx + result.length).trim();
      const unit = after.split('(')[0].trim() || undefined;
      const parenMatch = line.match(/\(([^\)]+)\)/);
      const referenceRange = parenMatch ? parenMatch[1].trim() : undefined;
      parsed.tests.push({ testName: namePart, result, unit, referenceRange });
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
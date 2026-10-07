import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/dates.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { formatDateTime, getCentralDate, formatDate, getEntryDate, formatEntryDateTime, parseDisplayDate } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

for (const zone of ['Asia/Kolkata', 'America/Chicago', 'America/Los_Angeles', 'UTC']) {
  test(`timestamp sources are respected with browser timezone ${zone}`, () => {
    const previousZone = process.env.TZ;
    process.env.TZ = zone;
    try {
      assert.equal(formatDateTime('2026-09-29T16:29:00', 'UTC'), '09/29/2026, 11:29 CDT');
      assert.equal(formatDateTime('2026-09-29T16:28:00', 'UTC'), '09/29/2026, 11:28 CDT');
      assert.equal(formatDateTime('2026-01-29T16:29:00', 'UTC'), '01/29/2026, 10:29 CST');
      assert.equal(formatDateTime('2026-09-29T02:00:00', 'UTC'), '09/28/2026, 21:00 CDT');
      assert.equal(formatDateTime('2026-09-29T16:29:00Z', 'UTC'), '09/29/2026, 11:29 CDT');
      assert.equal(formatDateTime('2026-09-29T21:59:00+05:30', 'UTC'), '09/29/2026, 11:29 CDT');
      assert.equal(formatDateTime('2026-09-29T11:29:00'), '09/29/2026, 11:29 CDT');
      assert.equal(formatDateTime('2026-01-29T11:29:00'), '01/29/2026, 11:29 CST');
      assert.equal(formatDateTime('2026-03-08T01:59:00'), '03/08/2026, 01:59 CST');
      assert.equal(formatDateTime('2026-03-08T03:00:00'), '03/08/2026, 03:00 CDT');
      assert.equal(formatDateTime('2026-11-01T01:30:00'), '11/01/2026, 01:30 CT');
      assert.equal(formatDateTime('2026-11-01T01:30:00-05:00'), '11/01/2026, 01:30 CDT');
      assert.equal(formatDateTime('2026-11-01T01:30:00-06:00'), '11/01/2026, 01:30 CST');
      const legacy = { submitted_at: null, created_at: '2026-09-29T02:00:00' };
      assert.equal(getEntryDate(legacy), '2026-09-28');
      assert.equal(formatEntryDateTime(legacy), '09/28/2026, 21:00 CDT');
      const submitted = { ...legacy, submitted_at: '2026-09-29T00:30:00' };
      assert.equal(getEntryDate(submitted), '2026-09-29');
      assert.equal(formatEntryDateTime(submitted), '09/29/2026, 00:30 CDT');
      assert.equal(formatDateTime(null, 'UTC'), '');
      assert.equal(getCentralDate(new Date('2026-09-29T02:00:00Z')), '2026-09-28');
      assert.equal(formatDate('2026-09-29'), '09/29/2026');
      assert.equal(formatDate('2026-09-29T02:00:00', 'UTC'), '09/28/2026');
    } finally {
      if (previousZone === undefined) delete process.env.TZ;
      else process.env.TZ = previousZone;
    }
  });
}

test('MM/DD/YYYY input validates calendar dates without changing API format', () => {
  assert.equal(parseDisplayDate('09/29/2026'), '2026-09-29');
  assert.equal(parseDisplayDate('02/29/2024'), '2024-02-29');
  for (const invalid of ['', '29/09/2026', '02/29/2026', '02/30/2024', '00/01/2026', '09/29/0000', '2026-09-29']) {
    assert.equal(parseDisplayDate(invalid), '');
  }
});

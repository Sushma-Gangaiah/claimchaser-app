import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import ExcelJS from 'exceljs';
const compiled = ts.transpileModule(fs.readFileSync('src/utils/reportWorkbook.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
fs.writeFileSync('tests/.report-workbook.mjs', compiled);
try {
  const { createReportWorkbook } = await import('./.report-workbook.mjs');
  const rows = Array.from({length: 1621}, (_, i) => ({'Claims#': '001234', 'Date of Service': '10/01/2026', 'Charges': '123.45', 'Claim Due': '0', 'Comments': i === 0 ? '=1+1\nFull comment preserved' : 'Example'}));
  const buffer = await createReportWorkbook(rows);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet('User Entries');
  assert.equal(sheet.rowCount, 1622);
  assert.equal(sheet.views[0].ySplit, 1);
  assert.equal(sheet.getCell('A2').value, '001234');
  assert.equal(sheet.getCell('B2').value, '10/01/2026');
  assert.equal(sheet.getCell('C2').value, 123.45);
  assert.equal(sheet.getCell('D2').value, 0);
  assert.equal(sheet.getCell('E2').value, '=1+1\nFull comment preserved');
  assert.equal(sheet.getColumn(2).width, 18);
  assert.equal(sheet.getColumn(5).width, 60);
  assert.equal(sheet.getCell('E2').alignment.wrapText, true);
  console.log('Excel export round-trip passed: 1,621 rows, widths, freeze, amounts, identifiers, and comments');
} finally { fs.unlinkSync('tests/.report-workbook.mjs'); }

import ExcelJS from 'exceljs';

export async function createReportWorkbook(rows: Record<string, string | number>[]) {
  if (!rows.length) throw new Error('No data to export');
  const headers = Object.keys(rows[0]);
  if (!headers.length) throw new Error('Select at least one column to export');
  const money = new Set(['Charges', 'Paid by Payer', 'Claim Due']);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('User Entries', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = headers.map(header => ({
    header, key: header,
    width: header === 'Comments' ? 60 : header === 'Submitted' ? 30 :
      header.includes('Date') ? Math.max(18, header.length + 2) :
      money.has(header) ? 20 : Math.min(40, Math.max(18, header.length + 2,
        rows.reduce((width, row) => Math.max(width, Math.min(38, String(row[header] ?? '').length + 2)), 18))),
  }));
  for (const source of rows) {
    const values = headers.map(header => {
      const value = source[header] ?? '';
      if (money.has(header) && value !== '' && Number.isFinite(Number(value))) return Number(value);
      // Text stays text: preserve claim identifiers, date labels, and formula-like comments.
      return String(value);
    });
    const row = sheet.addRow(values);
    row.alignment = { vertical: 'top', wrapText: true };
    let lines = 1;
    headers.forEach((header, i) => {
      const cell = row.getCell(i + 1);
      if (money.has(header)) cell.numFmt = '$#,##0.00;[Red]($#,##0.00)';
      else cell.numFmt = '@';
      const width = sheet.getColumn(i + 1).width || 18;
      lines = Math.max(lines, ...String(values[i]).split(/\r?\n/).map(text => Math.ceil(text.length / (width - 2)) || 1));
    });
    row.height = Math.min(409, Math.max(20, lines * 15));
  }
  const header = sheet.getRow(1);
  header.height = 30;
  header.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF663399' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: headers.length } };
  return workbook.xlsx.writeBuffer();
}

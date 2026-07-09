/**
 * Download an ExcelJS workbook as an .xlsx file in the browser.
 */
export async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function loadExcelJS() {
  const ExcelJS = (await import('exceljs')).default;
  return ExcelJS;
}

/**
 * Export rows of objects to a single worksheet (keys = headers).
 * @param {Array<Object>} rows
 * @param {string} sheetName
 * @param {string} filename
 * @param {number[]} [colWidths] - character widths per column
 */
export async function exportJsonToExcel(rows, sheetName, filename, colWidths = []) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31));

  if (!rows.length) {
    await downloadWorkbook(workbook, filename);
    return;
  }

  const headers = Object.keys(rows[0]);
  worksheet.addRow(headers);
  rows.forEach((row) => {
    worksheet.addRow(headers.map((key) => row[key] ?? ''));
  });

  headers.forEach((_, index) => {
    const width = colWidths[index];
    if (width) {
      worksheet.getColumn(index + 1).width = width;
    }
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  await downloadWorkbook(workbook, filename);
}

/**
 * Export programmes list with title header + optional stats sheet.
 */
export async function exportProgrammesWorkbook({
  titleRows,
  headers,
  dataRows,
  colWidths,
  statsRows,
  filename,
}) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Programmes');
  const lastCol = headers.length;

  titleRows.forEach((text, index) => {
    const row = worksheet.addRow([text]);
    worksheet.mergeCells(index + 1, 1, index + 1, lastCol);
    if (index === 0) {
      row.font = { bold: true, size: 14 };
    }
  });

  // Empty spacer row
  worksheet.addRow([]);

  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };

  dataRows.forEach((row) => worksheet.addRow(row));

  colWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  if (statsRows?.length) {
    const statsSheet = workbook.addWorksheet('Statistiques');
    const statsHeader = statsSheet.addRow(['Statistique', 'Valeur']);
    statsHeader.font = { bold: true };
    statsRows.forEach((row) => {
      statsSheet.addRow([row.Statistique, row.Valeur]);
    });
    statsSheet.getColumn(1).width = 25;
    statsSheet.getColumn(2).width = 30;
  }

  await downloadWorkbook(workbook, filename);
}

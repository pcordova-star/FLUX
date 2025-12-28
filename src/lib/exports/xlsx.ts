import ExcelJS from 'exceljs';

interface XlsxHeader {
    header: string;
    key: string;
    width?: number;
}

/**
 * Builds an Excel workbook buffer from an array of data objects.
 * @param data The array of data objects.
 * @param headers The configuration for column headers, keys, and widths.
 * @param sheetName The name of the worksheet.
 * @returns A Promise that resolves to a Buffer containing the XLSX file.
 */
export async function buildExcel(data: Record<string, any>[], headers: XlsxHeader[], sheetName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set columns and header style
  worksheet.columns = headers.map(h => ({ ...h, width: h.width || 20 }));
  
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern:'solid',
      fgColor:{ argb:'FFD3D3D3' }
    };
    cell.border = {
        bottom: { style: 'thin' }
    };
  });
  
  // Freeze the header row
  worksheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];

  // Add data rows
  worksheet.addRows(data);
  
  // Convert to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

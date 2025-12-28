/**
 * Escapes a single value for CSV format. If the value contains a comma,
 * double quote, or newline, it will be enclosed in double quotes.
 * Existing double quotes are escaped by doubling them.
 * @param value The value to escape.
 * @returns The escaped string value.
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface CsvHeader {
    header: string;
    key: string;
}

/**
 * Builds a CSV string from an array of objects and a header configuration.
 * @param data The array of data objects.
 * @param headers The configuration for headers and keys.
 * @returns A string representing the data in CSV format.
 */
export function buildCsv(data: Record<string, any>[], headers: CsvHeader[]): string {
  const headerRow = headers.map(h => escapeCsvValue(h.header)).join(',');
  
  const dataRows = data.map(row => {
    return headers.map(header => {
      return escapeCsvValue(row[header.key]);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

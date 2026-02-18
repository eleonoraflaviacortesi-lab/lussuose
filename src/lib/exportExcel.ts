/**
 * Minimal Excel (XLSX) export utility - no external library required.
 * Generates a valid .xlsx file using the Open XML format.
 */

function escapeXml(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isNumeric(val: unknown): boolean {
  if (val === null || val === undefined || val === '') return false;
  return !isNaN(Number(val));
}

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Export rows to a .xlsx file and trigger a browser download.
 */
export async function exportToExcel(
  filename: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[]
): Promise<void> {
  // Dynamic import for the XLSX library (using a CDN-safe approach with pure JS)
  // We'll generate a proper XLSX using the xml structure manually

  const colLetters = columns.map((_, i) => String.fromCharCode(65 + i));

  // Build shared strings
  const strings: string[] = [];
  const strMap = new Map<string, number>();
  const si = (s: string) => {
    if (!strMap.has(s)) { strMap.set(s, strings.length); strings.push(s); }
    return strMap.get(s)!;
  };

  // Header row
  const headerCells = columns.map((col, ci) => {
    const idx = si(col.header);
    return `<c r="${colLetters[ci]}1" t="s"><v>${idx}</v></c>`;
  }).join('');

  // Data rows
  const dataRows = rows.map((row, ri) => {
    const rowNum = ri + 2;
    const cells = columns.map((col, ci) => {
      const val = row[col.key];
      const ref = `${colLetters[ci]}${rowNum}`;
      if (val === null || val === undefined || val === '') {
        return `<c r="${ref}"/>`;
      }
      if (isNumeric(val) && typeof val !== 'boolean') {
        return `<c r="${ref}"><v>${Number(val)}</v></c>`;
      }
      const idx = si(escapeXml(val));
      return `<c r="${ref}" t="s"><v>${idx}</v></c>`;
    }).join('');
    return `<row r="${rowNum}">${cells}</row>`;
  }).join('');

  // Column widths
  const colsXml = columns.map((col, i) =>
    `<col min="${i + 1}" max="${i + 1}" width="${col.width ?? 18}" customWidth="1"/>`
  ).join('');

  // Sheet XML
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>
    <row r="1">${headerCells}</row>
    ${dataRows}
  </sheetData>
</worksheet>`;

  // Shared strings XML
  const sst = strings.map(s => `<si><t xml:space="preserve">${s}</t></si>`).join('');
  const sstXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">${sst}</sst>`;

  // Workbook XML
  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Foglio1" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  // Relationships
  const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;

  const appRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;

  // Build ZIP using fflate (already available or we'll use a simple manual approach)
  // Since we can't add packages easily, we'll use the JSZip-compatible approach
  // by importing fflate dynamically
  const { strToU8, zipSync } = await import('fflate');

  const enc = (s: string) => strToU8(s);

  const zip = zipSync({
    '[Content_Types].xml': enc(contentTypesXml),
    '_rels/.rels': enc(appRelsXml),
    'xl/workbook.xml': enc(wbXml),
    'xl/_rels/workbook.xml.rels': enc(wbRelsXml),
    'xl/worksheets/sheet1.xml': enc(sheetXml),
    'xl/sharedStrings.xml': enc(sstXml),
  });

  const blob = new Blob([zip.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

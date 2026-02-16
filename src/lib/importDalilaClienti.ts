/**
 * Parser for Dalila's buyer CSV (Cortesi Luxury Real Estate - Requests)
 * 
 * CSV columns: [Country], Language, Surname, Name, Portale, Data, Property, Ref.,
 *              Data Contatto, Contattato da, Tipo Contatto, Contatto fornito 1, Contatto fornito 2
 * 
 * Mapping to clienti:
 *   - nome = Name Surname
 *   - cognome = Surname
 *   - paese = Country
 *   - lingua = Language
 *   - telefono = phone-like contact
 *   - email = email-like contact
 *   - portale = Portale
 *   - property_name = Property
 *   - ref_number = Ref.
 *   - contattato_da = Contattato da
 *   - tipo_contatto = Tipo Contatto
 *   - status = 'contacted'
 *   - note_extra = consolidated property interests for duplicates
 * 
 * Duplicates (same person, multiple properties) are consolidated into one cliente.
 */

interface CSVRow {
  country: string;
  language: string;
  surname: string;
  name: string;
  portale: string;
  data: string;
  property: string;
  ref: string;
  dataContatto: string;
  contattatoDa: string;
  tipoContatto: string;
  contatto1: string;
  contatto2: string;
}

interface ParsedBuyer {
  nome: string;
  cognome: string | null;
  paese: string | null;
  lingua: string | null;
  telefono: string | null;
  email: string | null;
  portale: string | null;
  property_name: string | null;
  ref_number: string | null;
  contattato_da: string | null;
  tipo_contatto: string | null;
  status: string;
  note_extra: string;
  last_contact_date: string | null;
  data_submission: string | null;
  sede: string;
}

const isEmail = (val: string): boolean => {
  return val.includes('@') && val.includes('.');
};

const isPhone = (val: string): boolean => {
  if (!val || val === '-' || val === '?') return false;
  const digits = val.replace(/[\s\-\(\)\+]/g, '');
  return digits.length >= 7 && /^\d+$/.test(digits);
};

const cleanValue = (val: string): string | null => {
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === '?') return null;
  return trimmed;
};

const parseDate = (dateStr: string): string | null => {
  const clean = cleanValue(dateStr);
  if (!clean) return null;
  const match = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const y = parseInt(year);
  if (y < 2020 || y > 2030) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Parse the CSV text, handling multiline quoted fields.
 * Header: ,Language,Surname,Name,Portale,Data,Property,Ref.,Data Contatto,Contattato da,Tipo Contatto,Contatto fornito 1,Contatto fornito 2,
 */
function parseCSVText(text: string): CSVRow[] {
  const rows: CSVRow[] = [];
  const lines = text.split('\n');
  
  let i = 0;
  // Skip empty lines and find header (starts with ,Language or Country,)
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes(',Language,Surname,') || line.startsWith('Country,')) {
      i++;
      break;
    }
    i++;
  }
  
  // Parse data rows
  while (i < lines.length) {
    let line = lines[i].trim();
    if (!line) { i++; continue; }
    
    // Handle multiline quoted fields
    while ((line.match(/"/g) || []).length % 2 !== 0 && i + 1 < lines.length) {
      i++;
      line += ' ' + lines[i].trim();
    }
    
    const fields = parseCSVLine(line);
    if (fields.length >= 13) {
      const name = fields[3].trim();
      const surname = fields[2].trim();
      // Skip empty/header rows
      if (!name && !surname) { i++; continue; }
      
      rows.push({
        country: fields[0].trim(),
        language: fields[1].trim(),
        surname,
        name,
        portale: fields[4].trim(),
        data: fields[5].trim(),
        property: fields[6].trim(),
        ref: fields[7].trim(),
        dataContatto: fields[8].trim(),
        contattatoDa: fields[9].trim(),
        tipoContatto: fields[10].trim(),
        contatto1: fields[11].trim(),
        contatto2: fields[12].trim(),
      });
    }
    i++;
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Group rows by person identity (name+phone or name+email)
 */
function consolidateRows(rows: CSVRow[]): Map<string, CSVRow[]> {
  const groups = new Map<string, CSVRow[]>();
  
  for (const row of rows) {
    const name = buildName(row);
    if (!name || name === '?') continue;
    
    const phone = extractPhone(row);
    const email = extractEmail(row);
    const key = `${name.toLowerCase()}|${phone || email || ''}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }
  
  return groups;
}

function buildName(row: CSVRow): string {
  const name = cleanValue(row.name);
  const surname = cleanValue(row.surname);
  
  if (name && surname) return `${name} ${surname}`;
  if (name) return name;
  if (surname) return surname;
  return '';
}

function extractPhone(row: CSVRow): string | null {
  const c1 = cleanValue(row.contatto1);
  const c2 = cleanValue(row.contatto2);
  
  if (c1 && isPhone(c1)) return c1;
  if (c2 && isPhone(c2)) return c2;
  if (c1 && !isEmail(c1) && c1.length > 5) return c1;
  return null;
}

function extractEmail(row: CSVRow): string | null {
  const c1 = cleanValue(row.contatto1);
  const c2 = cleanValue(row.contatto2);
  
  if (c2 && isEmail(c2)) return c2;
  if (c1 && isEmail(c1)) return c1;
  return null;
}

function buildNoteExtra(rows: CSVRow[]): string {
  const lines: string[] = ['📋 DATI IMPORTATI DA CSV DALILA'];
  
  if (rows.length === 1) {
    const r = rows[0];
    if (cleanValue(r.data)) lines.push(`📅 Data richiesta: ${r.data}`);
    if (cleanValue(r.property)) lines.push(`🏠 Immobile: ${r.property} (Ref. ${r.ref})`);
    if (cleanValue(r.dataContatto)) lines.push(`📞 Data contatto: ${r.dataContatto}`);
  } else {
    // Multiple property interests
    lines.push('');
    lines.push(`🏠 IMMOBILI DI INTERESSE (${rows.length}):`);
    
    for (const r of rows) {
      const parts: string[] = [];
      if (cleanValue(r.property)) parts.push(`${r.property} (Ref. ${r.ref})`);
      if (cleanValue(r.portale)) parts.push(`via ${r.portale}`);
      if (cleanValue(r.data)) parts.push(`il ${r.data}`);
      if (cleanValue(r.tipoContatto)) parts.push(`[${r.tipoContatto}]`);
      lines.push(`• ${parts.join(' - ')}`);
    }
  }
  
  return lines.join('\n');
}

export async function fetchAndParseDalilaCSV(): Promise<ParsedBuyer[]> {
  const response = await fetch('/data/dalila_buyers.csv');
  const text = await response.text();
  
  const rows = parseCSVText(text);
  const grouped = consolidateRows(rows);
  const buyers: ParsedBuyer[] = [];
  const sedi = ['CITTÀ DI CASTELLO', 'AREZZO'];
  let index = 0;
  
  for (const [, groupRows] of grouped) {
    const firstRow = groupRows[0];
    const nome = buildName(firstRow);
    if (!nome) continue;
    
    const paese = cleanValue(firstRow.country);
    const telefono = extractPhone(firstRow);
    const email = extractEmail(firstRow);
    const cognome = cleanValue(firstRow.surname);
    const lingua = cleanValue(firstRow.language);
    const portale = cleanValue(firstRow.portale);
    const property_name = cleanValue(firstRow.property);
    const ref_number = cleanValue(firstRow.ref);
    const contattato_da = cleanValue(firstRow.contattatoDa);
    const tipo_contatto = cleanValue(firstRow.tipoContatto);
    
    // Get latest contact date and earliest request date
    let latestDate: string | null = null;
    let earliestRequestDate: string | null = null;
    for (const r of groupRows) {
      const d = parseDate(r.dataContatto);
      if (d && (!latestDate || d > latestDate)) latestDate = d;
      const rd = parseDate(r.data);
      if (rd && (!earliestRequestDate || rd < earliestRequestDate)) earliestRequestDate = rd;
    }
    
    buyers.push({
      nome,
      cognome,
      paese,
      lingua,
      telefono,
      email,
      portale,
      property_name,
      ref_number,
      contattato_da,
      tipo_contatto,
      status: 'contacted',
      note_extra: buildNoteExtra(groupRows),
      last_contact_date: latestDate,
      data_submission: earliestRequestDate,
      sede: sedi[index % 2],
    });
    index++;
  }
  
  return buyers;
}

export function getDalilaCSVSummary(buyers: ParsedBuyer[]) {
  const byCountry = new Map<string, number>();
  for (const b of buyers) {
    const key = b.paese || 'N/D';
    byCountry.set(key, (byCountry.get(key) || 0) + 1);
  }
  
  const topCountries = [...byCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  return {
    total: buyers.length,
    withEmail: buyers.filter(b => b.email).length,
    withPhone: buyers.filter(b => b.telefono).length,
    topCountries: Object.fromEntries(topCountries),
  };
}

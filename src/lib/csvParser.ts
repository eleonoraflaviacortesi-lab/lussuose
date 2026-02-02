// CSV Parsing utilities for Tally CSV imports

export interface HeaderMapping {
  pattern: RegExp;
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'date' | 'budget';
  extractOption?: boolean;
}

export interface ColumnInfo {
  index: number;
  header: string;
  field: string;
  type: HeaderMapping['type'];
  optionValue?: string;
}

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  columnInfos: ColumnInfo[];
}

// All supported field mappings
export const HEADER_MAPPINGS: HeaderMapping[] = [
  // Name
  { pattern: /^(your\s+)?name(\s+and\s+surname)?$/i, field: 'nome', type: 'string' },
  
  // Phone
  { pattern: /phone\s*(number)?/i, field: 'telefono', type: 'string' },
  
  // Country
  { pattern: /(respondent'?s?\s+)?country/i, field: 'paese', type: 'string' },
  
  // Email  
  { pattern: /^(your\s+)?email(\s+address)?$/i, field: 'email', type: 'string' },
  
  // Submission ID
  { pattern: /^submission\s*id$/i, field: 'tally_submission_id', type: 'string' },
  
  // Date
  { pattern: /^submitted\s+at$/i, field: 'data_submission', type: 'date' },
  
  // Budget
  { pattern: /(estimated\s+)?budget|max\s+budget/i, field: 'budget_max', type: 'budget' },
  
  // Mortgage
  { pattern: /^will\s+you\s+require\s+a\s+mortgage.*\((yes|no|not\s+sure\s+yet)\)$/i, field: 'mutuo', type: 'string', extractOption: true },
  { pattern: /^will\s+you\s+require\s+a\s+mortgage/i, field: 'mutuo', type: 'string' },
  { pattern: /mortgage|mutuo/i, field: 'mutuo', type: 'string' },
  
  // Search time
  { pattern: /how\s+long.*looking|search\s+time/i, field: 'tempo_ricerca', type: 'string' },
  
  // Viewed properties
  { pattern: /viewed\s+properties|visited\s+properties/i, field: 'ha_visitato', type: 'boolean' },
  
  // Regions
  { pattern: /^which\s+regions.*\(([^)]+)\)$/i, field: 'regioni', type: 'array', extractOption: true },
  { pattern: /^which\s+regions(?!\s*\()/i, field: 'regioni', type: 'array' },
  { pattern: /^regions$/i, field: 'regioni', type: 'array' },
  
  // Proximity to cities
  { pattern: /proximity.*cit|prox.*main\s+cit|vicinanza/i, field: 'vicinanza_citta', type: 'boolean' },
  
  // Reason for area
  { pattern: /draws\s+you|why\s+area|what\s+attracts/i, field: 'motivo_zona', type: 'array' },
  { pattern: /^perch[ée]\s+(questa\s+)?zona\??$/i, field: 'motivo_zona', type: 'array' },
  { pattern: /motivo\s+zona|cosa\s+ti\s+attira/i, field: 'motivo_zona', type: 'array' },
  
  // Property type
  { pattern: /^what\s+type\s+of\s+property.*\(([^)]+)\)$/i, field: 'tipologia', type: 'array', extractOption: true },
  { pattern: /^what\s+type\s+of\s+property(?!\s*\()/i, field: 'tipologia', type: 'array' },
  { pattern: /^property\s+type$/i, field: 'tipologia', type: 'array' },
  
  // Style
  { pattern: /^which\s+kind\s+of\s+style.*\(([^)]+)\)$/i, field: 'stile', type: 'string', extractOption: true },
  { pattern: /style|stile/i, field: 'stile', type: 'string' },
  
  // Setting/context
  { pattern: /^what\s+kind\s+of\s+setting.*\(([^)]+)\)$/i, field: 'contesto', type: 'array', extractOption: true },
  { pattern: /^what\s+kind\s+of\s+setting(?!\s*\()/i, field: 'contesto', type: 'array' },
  { pattern: /^setting$/i, field: 'contesto', type: 'array' },
  { pattern: /^contesto\s+desiderato.*\(([^)]+)\)$/i, field: 'contesto', type: 'array', extractOption: true },
  { pattern: /^contesto\s+desiderato/i, field: 'contesto', type: 'array' },
  { pattern: /^contesto$/i, field: 'contesto', type: 'array' },
  
  // Size
  { pattern: /size.*property|property\s+size|dimensioni/i, field: 'dimensioni_min', type: 'number' },
  
  // Bedrooms
  { pattern: /bedroom|camere/i, field: 'camere', type: 'string' },
  
  // Bathrooms
  { pattern: /bathroom|bagni/i, field: 'bagni', type: 'number' },
  
  // Layout
  { pattern: /layout/i, field: 'layout', type: 'string' },
  
  // Guesthouse/annex
  { pattern: /guesthouse|annex|dependance/i, field: 'dependance', type: 'string' },
  
  // Land
  { pattern: /^do\s+you\s+require\s+land\??$/i, field: 'terreno', type: 'string' },
  { pattern: /^if\s+yes,\s+how\s+much\s+land/i, field: 'terreno', type: 'string' },
  { pattern: /^how\s+much\s+land|land\s+size|terreno/i, field: 'terreno', type: 'string' },
  { pattern: /^vuole\s+terreno\??$/i, field: 'terreno', type: 'string' },
  { pattern: /^se\s+s[ìi],?\s+quanto\s+terreno/i, field: 'terreno', type: 'string' },
  { pattern: /dimensione\s+terreno|ettari/i, field: 'terreno', type: 'string' },
  
  // Pool
  { pattern: /swimming\s+pool|pool|piscina/i, field: 'piscina', type: 'string' },
  
  // Use
  { pattern: /intend\s+to\s+use|property\s+use|uso/i, field: 'uso', type: 'string' },
  { pattern: /^come\s+user[àa]\s+la\s+propriet[àa]/i, field: 'uso', type: 'string' },
  { pattern: /utilizzo|finalit[àa]/i, field: 'uso', type: 'string' },
  
  // Rental interest
  { pattern: /renting\s+out|rental|affitto/i, field: 'interesse_affitto', type: 'string' },
  { pattern: /^interessato\s+(ad\s+)?affittare/i, field: 'interesse_affitto', type: 'string' },
  
  // Description
  { pattern: /describe.*ideal\s+property|property\s+description|descrizione/i, field: 'descrizione', type: 'string' },
  
  // Extra notes
  { pattern: /anything\s+else|extra|additional|more$/i, field: 'note_extra', type: 'string' },
];

// All available database fields for manual mapping
export const AVAILABLE_FIELDS = [
  { value: '', label: '-- Non mappare --' },
  { value: 'nome', label: 'Nome' },
  { value: 'telefono', label: 'Telefono' },
  { value: 'email', label: 'Email' },
  { value: 'paese', label: 'Paese' },
  { value: 'budget_max', label: 'Budget Max' },
  { value: 'mutuo', label: 'Mutuo' },
  { value: 'tempo_ricerca', label: 'Tempo Ricerca' },
  { value: 'ha_visitato', label: 'Ha Visitato' },
  { value: 'regioni', label: 'Regioni' },
  { value: 'vicinanza_citta', label: 'Vicinanza Città' },
  { value: 'motivo_zona', label: 'Motivo Zona' },
  { value: 'tipologia', label: 'Tipologia' },
  { value: 'stile', label: 'Stile' },
  { value: 'contesto', label: 'Contesto' },
  { value: 'dimensioni_min', label: 'Dimensioni Min' },
  { value: 'camere', label: 'Camere' },
  { value: 'bagni', label: 'Bagni' },
  { value: 'layout', label: 'Layout' },
  { value: 'dependance', label: 'Dependance' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'piscina', label: 'Piscina' },
  { value: 'uso', label: 'Uso' },
  { value: 'interesse_affitto', label: 'Interesse Affitto' },
  { value: 'descrizione', label: 'Descrizione' },
  { value: 'note_extra', label: 'Note Extra' },
  { value: 'tally_submission_id', label: 'Tally ID' },
  { value: 'data_submission', label: 'Data Submission' },
];

// Clean header text from HTML entities and whitespace
export const cleanHeader = (header: string): string => {
  return header
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Parse CSV handling quoted fields with newlines
export const parseCSVText = (csvText: string): { headers: string[]; rows: string[][] } => {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f)) {
        result.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else if (char === '\r' && !inQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f)) {
        result.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f)) {
      result.push(currentRow);
    }
  }
  
  if (result.length === 0) return { headers: [], rows: [] };
  
  return {
    headers: result[0].map(cleanHeader),
    rows: result.slice(1)
  };
};

// Auto-map headers to fields
export const autoMapHeaders = (headers: string[]): ColumnInfo[] => {
  const columnInfos: ColumnInfo[] = [];
  
  headers.forEach((header, index) => {
    const cleanedHeader = cleanHeader(header);
    let mapped = false;
    
    for (const mapping of HEADER_MAPPINGS) {
      const match = cleanedHeader.match(mapping.pattern);
      if (match) {
        const info: ColumnInfo = {
          index,
          header,
          field: mapping.field,
          type: mapping.type,
        };
        
        if (mapping.extractOption && match[1]) {
          info.optionValue = match[1].trim();
        }
        
        columnInfos.push(info);
        mapped = true;
        break;
      }
    }
    
    // Add unmapped columns too
    if (!mapped) {
      columnInfos.push({
        index,
        header,
        field: '',
        type: 'string',
      });
    }
  });
  
  return columnInfos;
};

// Parse budget value
export const parseBudget = (value: string): number | null => {
  if (!value) return null;

  const lower = value.toLowerCase();
  const multiplier =
    lower.includes('million') || /\b\d+(?:[\.,]\d+)?\s*m\b/.test(lower) ? 1_000_000 :
    /\b\d+(?:[\.,]\d+)?\s*k\b/.test(lower) ? 1_000 :
    1;

  const match = value.match(/[\d.,]+/);
  if (!match) return null;

  let numStr = match[0];
  if (numStr.includes('.') && numStr.includes(',')) {
    const lastDot = numStr.lastIndexOf('.');
    const lastComma = numStr.lastIndexOf(',');
    if (lastComma > lastDot) {
      numStr = numStr.replace(/\./g, '').replace(',', '.');
    } else {
      numStr = numStr.replace(/,/g, '');
    }
  } else if (numStr.includes(',')) {
    const parts = numStr.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      numStr = numStr.replace(',', '.');
    } else {
      numStr = numStr.replace(/,/g, '');
    }
  } else if (numStr.includes('.')) {
    const parts = numStr.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      numStr = numStr.replace(/\./g, '');
    }
  }

  const num = parseFloat(numStr);
  if (isNaN(num)) return null;
  return num * multiplier;
};

// Parse boolean value
export const parseBoolean = (value: string): boolean => {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'yes' || lower === 'true' || lower === 'sì' || lower === 'si' || lower === '1';
};

// Parse number value
export const parseNumber = (value: string): number | null => {
  if (!value) return null;
  const match = value.match(/\d+/);
  if (!match) return null;
  const num = parseInt(match[0]);
  return isNaN(num) ? null : num;
};

// Convert a row to a client record using column mappings
export const rowToClient = (
  values: string[],
  columnInfos: ColumnInfo[],
  sede: string
): Record<string, any> | null => {
  const row: Record<string, any> = {
    sede,
    status: 'new',
    emoji: '🏠',
  };

  const arrayFields: Record<string, string[]> = {
    regioni: [],
    tipologia: [],
    contesto: [],
    motivo_zona: [],
  };

  columnInfos.forEach((colInfo) => {
    if (!colInfo.field) return; // Skip unmapped columns
    
    const value = values[colInfo.index] || '';
    if (!value) return;

    switch (colInfo.type) {
      case 'string':
        if (colInfo.optionValue) {
          if (parseBoolean(value) && !row[colInfo.field]) {
            row[colInfo.field] = colInfo.optionValue;
          }
        } else if (!row[colInfo.field]) {
          const v = value.toLowerCase().trim();
          if (v !== 'true' && v !== 'false') {
            row[colInfo.field] = value;
          }
        }
        break;
        
      case 'number':
        if (!row[colInfo.field]) {
          row[colInfo.field] = parseNumber(value);
        }
        break;
        
      case 'boolean':
        if (parseBoolean(value)) {
          row[colInfo.field] = true;
        }
        break;
        
      case 'budget':
        if (!row[colInfo.field]) {
          row[colInfo.field] = parseBudget(value);
        }
        break;
        
      case 'date':
        if (!row[colInfo.field] && value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            row[colInfo.field] = date.toISOString();
          }
        }
        break;
        
      case 'array':
        if (colInfo.optionValue) {
          if (parseBoolean(value)) {
            arrayFields[colInfo.field]?.push(colInfo.optionValue);
          }
        } else {
          const v = value.toLowerCase().trim();
          if (v === 'true' || v === 'false') return;
          const items = value.split(',').map(v => v.trim()).filter(Boolean);
          if (items.length > 0) {
            arrayFields[colInfo.field] = [...(arrayFields[colInfo.field] || []), ...items];
          }
        }
        break;
    }
  });

  // Set array fields on row
  Object.entries(arrayFields).forEach(([field, values]) => {
    if (values.length > 0) {
      row[field] = [...new Set(values)];
    }
  });

  return row.nome ? row : null;
};

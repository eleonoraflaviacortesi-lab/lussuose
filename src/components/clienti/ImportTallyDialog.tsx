import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ImportTallyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Header pattern matching for Tally CSV columns
interface HeaderMapping {
  pattern: RegExp;
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'date' | 'budget';
  // For multi-column array fields, extract the option value from header
  extractOption?: boolean;
}

const HEADER_MAPPINGS: HeaderMapping[] = [
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
  { pattern: /mortgage|mutuo/i, field: 'mutuo', type: 'string' },
  
  // Search time
  { pattern: /how\s+long.*looking|search\s+time/i, field: 'tempo_ricerca', type: 'string' },
  
  // Viewed properties
  { pattern: /viewed\s+properties|visited\s+properties/i, field: 'ha_visitato', type: 'boolean' },
  
  // Regions - main column or sub-columns with region names
  { pattern: /^which\s+regions.*\(([^)]+)\)$/i, field: 'regioni', type: 'array', extractOption: true },
  { pattern: /^which\s+regions(?!\s*\()/i, field: 'regioni', type: 'array' },
  { pattern: /^regions$/i, field: 'regioni', type: 'array' },
  
  // Proximity to cities
  { pattern: /proximity.*cit|prox.*main\s+cit|vicinanza/i, field: 'vicinanza_citta', type: 'boolean' },
  
  // Reason for area
  { pattern: /draws\s+you|why\s+area|what\s+attracts/i, field: 'motivo_zona', type: 'array' },
  
  // Property type - main column or sub-columns
  { pattern: /^what\s+type\s+of\s+property.*\(([^)]+)\)$/i, field: 'tipologia', type: 'array', extractOption: true },
  { pattern: /^what\s+type\s+of\s+property(?!\s*\()/i, field: 'tipologia', type: 'array' },
  { pattern: /^property\s+type$/i, field: 'tipologia', type: 'array' },
  
  // Style
  { pattern: /^which\s+kind\s+of\s+style.*\(([^)]+)\)$/i, field: 'stile', type: 'string', extractOption: true },
  { pattern: /style|stile/i, field: 'stile', type: 'string' },
  
  // Setting/context - main column or sub-columns
  { pattern: /^what\s+kind\s+of\s+setting.*\(([^)]+)\)$/i, field: 'contesto', type: 'array', extractOption: true },
  { pattern: /^what\s+kind\s+of\s+setting(?!\s*\()/i, field: 'contesto', type: 'array' },
  { pattern: /^setting$/i, field: 'contesto', type: 'array' },
  
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
  { pattern: /^how\s+much\s+land|land\s+size|terreno/i, field: 'terreno', type: 'string' },
  
  // Pool
  { pattern: /swimming\s+pool|pool|piscina/i, field: 'piscina', type: 'string' },
  
  // Use
  { pattern: /intend\s+to\s+use|property\s+use|uso/i, field: 'uso', type: 'string' },
  
  // Rental interest
  { pattern: /renting\s+out|rental|affitto/i, field: 'interesse_affitto', type: 'string' },
  
  // Description
  { pattern: /describe.*ideal\s+property|property\s+description|descrizione/i, field: 'descrizione', type: 'string' },
  
  // Extra notes
  { pattern: /anything\s+else|extra|additional|more$/i, field: 'note_extra', type: 'string' },
];

// Clean header text from HTML entities and whitespace
const cleanHeader = (header: string): string => {
  return header
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Parse CSV handling quoted fields with newlines
const parseCSV = (csvText: string): { headers: string[]; rows: string[][] } => {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++; // Skip \n in \r\n
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f)) { // Only add non-empty rows
        result.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else if (char === '\r' && !inQuotes) {
      // Handle \r without \n
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
  
  // Don't forget the last field and row
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

const parseBudget = (value: string): number | null => {
  if (!value) return null;
  // Extract numbers from strings like "€600,000" or "600000" or "600.000"
  const cleaned = value.replace(/[€$,.\s]/g, '');
  // Handle European format where . is thousands separator
  const match = value.match(/[\d.,]+/);
  if (!match) return null;
  
  let numStr = match[0];
  // If contains both . and ,, determine format
  if (numStr.includes('.') && numStr.includes(',')) {
    // European: 600.000,00 or US: 600,000.00
    const lastDot = numStr.lastIndexOf('.');
    const lastComma = numStr.lastIndexOf(',');
    if (lastComma > lastDot) {
      // European format: comma is decimal
      numStr = numStr.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: dot is decimal
      numStr = numStr.replace(/,/g, '');
    }
  } else if (numStr.includes(',')) {
    // Could be thousands separator or decimal
    const parts = numStr.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      // Likely decimal: 600,00
      numStr = numStr.replace(',', '.');
    } else {
      // Likely thousands: 600,000
      numStr = numStr.replace(/,/g, '');
    }
  } else if (numStr.includes('.')) {
    // Could be thousands separator or decimal
    const parts = numStr.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      // Likely thousands: 600.000
      numStr = numStr.replace(/\./g, '');
    }
    // Otherwise keep as is (decimal)
  }
  
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
};

const parseBoolean = (value: string): boolean => {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'yes' || lower === 'true' || lower === 'sì' || lower === 'si' || lower === '1';
};

const parseNumber = (value: string): number | null => {
  if (!value) return null;
  const match = value.match(/\d+/);
  if (!match) return null;
  const num = parseInt(match[0]);
  return isNaN(num) ? null : num;
};

interface ColumnInfo {
  index: number;
  field: string;
  type: HeaderMapping['type'];
  optionValue?: string; // For multi-column array fields
}

export function ImportTallyDialog({ open, onOpenChange, onSuccess }: ImportTallyDialogProps) {
  const { profile } = useAuth();
  const [csvData, setCsvData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const handleImport = async () => {
    if (!csvData.trim() || !profile) return;

    setIsLoading(true);
    setResults(null);

    try {
      const { headers, rows } = parseCSV(csvData);
      
      if (headers.length === 0 || rows.length === 0) {
        toast({ title: 'CSV vuoto', description: 'Il file non contiene dati', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Map headers to column info
      const columnInfos: ColumnInfo[] = [];
      headers.forEach((header, index) => {
        const cleanedHeader = cleanHeader(header);
        
        for (const mapping of HEADER_MAPPINGS) {
          const match = cleanedHeader.match(mapping.pattern);
          if (match) {
            const info: ColumnInfo = {
              index,
              field: mapping.field,
              type: mapping.type,
            };
            
            // Extract option value from parentheses if applicable
            if (mapping.extractOption && match[1]) {
              info.optionValue = match[1].trim();
            }
            
            columnInfos.push(info);
            break;
          }
        }
      });

      const clienti: Record<string, any>[] = [];
      const errors: string[] = [];

      // Process each row
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const values = rows[rowIdx];
        
        try {
          const row: Record<string, any> = {
            sede: profile.sede,
            status: 'new',
            emoji: '🏠',
          };

          // Initialize array fields
          const arrayFields: Record<string, string[]> = {
            regioni: [],
            tipologia: [],
            contesto: [],
            motivo_zona: [],
          };

          // Process each mapped column
          columnInfos.forEach((colInfo) => {
            const value = values[colInfo.index] || '';
            if (!value) return;

            switch (colInfo.type) {
              case 'string':
                // For string fields, only set if not already set (first match wins)
                if (!row[colInfo.field]) {
                  row[colInfo.field] = value;
                }
                break;
                
              case 'number':
                if (!row[colInfo.field]) {
                  row[colInfo.field] = parseNumber(value);
                }
                break;
                
              case 'boolean':
                // For boolean, set to true if any column indicates true
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
                // Handle array fields
                if (colInfo.optionValue) {
                  // This is a sub-column for a multi-select
                  // If value is non-empty (checked), add the option
                  if (value && parseBoolean(value)) {
                    arrayFields[colInfo.field]?.push(colInfo.optionValue);
                  } else if (value && value.toLowerCase() !== 'no' && value.toLowerCase() !== 'false') {
                    // Sometimes the value IS the option name
                    arrayFields[colInfo.field]?.push(value);
                  }
                } else {
                  // Main column with comma-separated values
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
              // Remove duplicates
              row[field] = [...new Set(values)];
            }
          });

          if (!row.nome) {
            errors.push(`Riga ${rowIdx + 2}: Nome mancante`);
            continue;
          }

          clienti.push(row);
        } catch (err) {
          errors.push(`Riga ${rowIdx + 2}: Errore parsing`);
        }
      }

      if (clienti.length === 0) {
        toast({ 
          title: 'Nessun cliente valido', 
          description: `Trovati ${errors.length} errori. Controlla il formato del CSV.`, 
          variant: 'destructive' 
        });
        setResults({ success: 0, errors });
        setIsLoading(false);
        return;
      }

      // Insert in batches
      let successCount = 0;
      const batchSize = 50;
      
      for (let i = 0; i < clienti.length; i += batchSize) {
        const batch = clienti.slice(i, i + batchSize);
        const { error } = await supabase
          .from('clienti')
          .upsert(batch as any, { 
            onConflict: 'tally_submission_id',
            ignoreDuplicates: false 
          });

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      setResults({ success: successCount, errors });
      
      if (successCount > 0) {
        toast({ 
          title: 'Import completato', 
          description: `${successCount} clienti importati` 
        });
        onSuccess();
      }
    } catch (err: any) {
      toast({ 
        title: 'Errore import', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvData(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importa da Tally CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Esporta i dati dal tuo form Tally in formato CSV e incollali qui sotto, oppure carica il file.</p>
            <p className="mt-2">Il sistema riconoscerà automaticamente i campi del form.</p>
          </div>

          {/* File upload */}
          <div>
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-5 h-5" />
              <span>Carica file CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* CSV textarea */}
          <Textarea
            placeholder="Oppure incolla qui il contenuto CSV..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="min-h-[200px] font-mono text-xs"
          />

          {/* Results */}
          {results && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{results.success} clienti importati con successo</span>
              </div>
              {results.errors.length > 0 && (
                <div className="space-y-1">
                  {results.errors.slice(0, 5).map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{err}</span>
                    </div>
                  ))}
                  {results.errors.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      ... e altri {results.errors.length - 5} errori
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Chiudi
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!csvData.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importazione...
                </>
              ) : (
                'Importa'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImportTallyDialog;

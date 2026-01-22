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

// Mapping from Tally field names to database columns
const FIELD_MAPPING: Record<string, string> = {
  'name': 'nome',
  'phone number': 'telefono',
  'country': 'paese',
  'max budget': 'budget_max',
  'mutuo': 'mutuo',
  'old': 'tempo_ricerca',
  'visited properties?': 'ha_visitato',
  'regions': 'regioni',
  'prox to main cities': 'vicinanza_citta',
  'why area': 'motivo_zona',
  'property type': 'tipologia',
  'kind of style': 'stile',
  'setting': 'contesto',
  'size': 'dimensioni_min',
  'bedrooms': 'camere',
  'bathrooms': 'bagni',
  'layout': 'layout',
  'guesthouse or annex': 'dependance',
  'land': 'terreno',
  'swimming pool': 'piscina',
  'use': 'uso',
  'rent': 'interesse_affitto',
  'property description': 'descrizione',
  'more': 'note_extra',
  'email': 'email',
  'date': 'data_submission',
  'submission id': 'tally_submission_id',
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const parseBudget = (value: string): number | null => {
  if (!value) return null;
  // Extract number from strings like "€600,000" or "600000"
  const cleaned = value.replace(/[€$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const parseBoolean = (value: string): boolean => {
  const lower = value.toLowerCase();
  return lower === 'yes' || lower === 'true' || lower === 'sì' || lower === 'si';
};

const parseArray = (value: string): string[] => {
  if (!value) return [];
  // Handle comma-separated values within the cell
  return value.split(',').map(v => v.trim()).filter(Boolean);
};

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
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        toast({ title: 'CSV vuoto', description: 'Il file non contiene dati', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Parse headers
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      
      const clienti: Record<string, any>[] = [];
      const errors: string[] = [];

      // Parse rows
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        try {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, any> = {
            sede: profile.sede,
            status: 'new',
            emoji: '🏠',
          };

          headers.forEach((header, idx) => {
            const value = values[idx] || '';
            const dbField = FIELD_MAPPING[header];
            
            if (!dbField) return;

            switch (dbField) {
              case 'budget_max':
                row[dbField] = parseBudget(value);
                break;
              case 'ha_visitato':
              case 'vicinanza_citta':
                row[dbField] = parseBoolean(value);
                break;
              case 'regioni':
              case 'tipologia':
              case 'contesto':
              case 'motivo_zona':
                row[dbField] = parseArray(value);
                break;
              case 'bagni':
              case 'dimensioni_min':
              case 'dimensioni_max':
                const num = parseInt(value);
                row[dbField] = isNaN(num) ? null : num;
                break;
              case 'data_submission':
                if (value) {
                  const date = new Date(value);
                  row[dbField] = isNaN(date.getTime()) ? null : date.toISOString();
                }
                break;
              default:
                row[dbField] = value || null;
            }
          });

          if (!row.nome) {
            errors.push(`Riga ${i + 1}: Nome mancante`);
            continue;
          }

          clienti.push(row);
        } catch (err) {
          errors.push(`Riga ${i + 1}: Errore parsing`);
        }
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

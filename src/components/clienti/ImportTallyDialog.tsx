import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CSVPreviewTable } from './CSVPreviewTable';
import {
  parseCSVText,
  autoMapHeaders,
  rowToClient,
  ColumnInfo,
  AVAILABLE_FIELDS,
} from '@/lib/csvParser';

interface ImportTallyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'result';

export function ImportTallyDialog({ open, onOpenChange, onSuccess }: ImportTallyDialogProps) {
  const { profile } = useAuth();
  const [csvData, setCsvData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [step, setStep] = useState<Step>('upload');
  
  // Parsed CSV data
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnInfos, setColumnInfos] = useState<ColumnInfo[]>([]);

  // Parse CSV when moving to preview
  const handleParseCSV = () => {
    if (!csvData.trim()) return;
    
    const parsed = parseCSVText(csvData);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      toast({ 
        title: 'CSV vuoto', 
        description: 'Il file non contiene dati validi', 
        variant: 'destructive' 
      });
      return;
    }
    
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setColumnInfos(autoMapHeaders(parsed.headers));
    setStep('preview');
  };

  // Field type mapping for proper parsing
  const FIELD_TYPES: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'date' | 'budget'> = {
    dimensioni_min: 'number',
    dimensioni_max: 'number',
    bagni: 'number',
    budget_max: 'budget',
    ha_visitato: 'boolean',
    vicinanza_citta: 'boolean',
    regioni: 'array',
    tipologia: 'array',
    contesto: 'array',
    motivo_zona: 'array',
    data_submission: 'date',
  };

  // Handle column mapping change
  const handleColumnMappingChange = (index: number, field: string) => {
    setColumnInfos(prev => {
      const updated = prev.map(c => {
        if (c.index === index) {
          // Determine the correct type for the field
          const fieldType = FIELD_TYPES[field] || 'string';
          return { ...c, field, type: fieldType };
        }
        return c;
      });
      
      // If this index doesn't exist yet, add it
      if (!updated.find(c => c.index === index)) {
        const fieldType = FIELD_TYPES[field] || 'string';
        updated.push({
          index,
          header: headers[index] || '',
          field,
          type: fieldType,
        });
      }
      
      return updated;
    });
  };

  // Perform the import
  const handleImport = async () => {
    if (!profile) return;

    setIsLoading(true);
    setResults(null);

    try {
      const clienti: Record<string, any>[] = [];
      const errors: string[] = [];

      // Process each row
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        try {
          const client = rowToClient(rows[rowIdx], columnInfos, profile.sede);
          if (client) {
            clienti.push(client);
          } else {
            errors.push(`Riga ${rowIdx + 2}: Nome mancante`);
          }
        } catch (err) {
          errors.push(`Riga ${rowIdx + 2}: Errore parsing`);
        }
      }

      if (clienti.length === 0) {
        toast({ 
          title: 'Nessun cliente valido', 
          description: `Trovati ${errors.length} errori. Verifica la mappatura delle colonne.`, 
          variant: 'destructive' 
        });
        setResults({ success: 0, errors });
        setStep('result');
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
      setStep('result');
      
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

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setStep('upload');
      setCsvData('');
      setHeaders([]);
      setRows([]);
      setColumnInfos([]);
      setResults(null);
    }, 300);
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload');
    } else if (step === 'result') {
      setStep('preview');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`${step === 'preview' ? 'max-w-5xl' : 'max-w-2xl'} max-h-[90vh] overflow-hidden flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'upload' && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === 'upload' && 'Importa da Tally CSV'}
            {step === 'preview' && 'Anteprima e Mappatura Colonne'}
            {step === 'result' && 'Risultato Import'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <div className="text-sm text-muted-foreground">
                <p>Esporta i dati dal tuo form Tally in formato CSV e incollali qui sotto, oppure carica il file.</p>
                <p className="mt-2">Nel passo successivo potrai verificare e modificare la mappatura delle colonne.</p>
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
            </>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <CSVPreviewTable
              headers={headers}
              rows={rows}
              columnInfos={columnInfos}
              onColumnMappingChange={handleColumnMappingChange}
              previewRowCount={3}
            />
          )}

          {/* Step 3: Results */}
          {step === 'result' && results && (
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {step === 'result' ? 'Chiudi' : 'Annulla'}
          </Button>
          
          {step === 'upload' && (
            <Button 
              onClick={handleParseCSV} 
              disabled={!csvData.trim()}
            >
              Avanti
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          {step === 'preview' && (
            <Button 
              onClick={handleImport} 
              disabled={isLoading || columnInfos.filter(c => c.field).length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importazione...
                </>
              ) : (
                `Importa ${rows.length} clienti`
              )}
            </Button>
          )}
          
          {step === 'result' && results && results.success > 0 && (
            <Button onClick={handleClose}>
              Fatto
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImportTallyDialog;

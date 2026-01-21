import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotizie, NotiziaInput, NotiziaStatus } from '@/hooks/useNotizie';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

interface CSVRow {
  [key: string]: string;
}

const NOTIZIA_FIELDS = [
  { key: 'name', label: 'Nome', required: true },
  { key: 'zona', label: 'Zona', required: false },
  { key: 'phone', label: 'Telefono', required: false },
  { key: 'type', label: 'Tipo', required: false },
  { key: 'notes', label: 'Note', required: false },
  { key: 'status', label: 'Stato', required: false },
  { key: 'created_at', label: 'Data Creazione', required: false },
] as const;

const VALID_STATUSES: NotiziaStatus[] = ['new', 'in_progress', 'done', 'on_shot', 'taken'];

const ImportCSVDialog = () => {
  const { addNotizia } = useNotizie();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const resetState = () => {
    setStep('upload');
    setCsvData([]);
    setCsvHeaders([]);
    setMapping({});
    setImportProgress(0);
    setImportErrors([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  const parseCSV = (text: string): { headers: string[]; rows: CSVRow[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse header
    const headers = parseCSVLine(lines[0]);
    
    // Parse rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      
      if (headers.length === 0 || rows.length === 0) {
        toast({
          title: 'Errore',
          description: 'Il file CSV è vuoto o non valido',
          variant: 'destructive',
        });
        return;
      }

      setCsvHeaders(headers);
      setCsvData(rows);
      
      // Auto-map fields with matching names
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase().trim();
        const matchingField = NOTIZIA_FIELDS.find(
          f => f.key.toLowerCase() === lowerHeader || 
               f.label.toLowerCase() === lowerHeader ||
               (f.key === 'name' && (lowerHeader.includes('nome') || lowerHeader.includes('name'))) ||
               (f.key === 'zona' && (lowerHeader.includes('zona') || lowerHeader.includes('area'))) ||
               (f.key === 'phone' && (lowerHeader.includes('telefono') || lowerHeader.includes('phone') || lowerHeader.includes('tel'))) ||
               (f.key === 'type' && (lowerHeader.includes('tipo') || lowerHeader.includes('type'))) ||
               (f.key === 'notes' && (lowerHeader.includes('note') || lowerHeader.includes('descrizione'))) ||
               (f.key === 'status' && (lowerHeader.includes('stato') || lowerHeader.includes('status')))
        );
        if (matchingField) {
          autoMapping[matchingField.key] = header;
        }
      });
      setMapping(autoMapping);
      
      setStep('mapping');
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMappingChange = (field: string, csvColumn: string) => {
    setMapping(prev => {
      if (csvColumn === '__none__') {
        const newMapping = { ...prev };
        delete newMapping[field];
        return newMapping;
      }
      return { ...prev, [field]: csvColumn };
    });
  };

  const canProceedToPreview = () => {
    return mapping['name'] !== undefined;
  };

  const getMappedData = (): NotiziaInput[] => {
    return csvData.map(row => {
      const notizia: NotiziaInput = {
        name: row[mapping['name']] || '',
      };

      if (mapping['zona'] && row[mapping['zona']]) {
        notizia.zona = row[mapping['zona']];
      }
      if (mapping['phone'] && row[mapping['phone']]) {
        notizia.phone = row[mapping['phone']];
      }
      if (mapping['type'] && row[mapping['type']]) {
        notizia.type = row[mapping['type']];
      }
      if (mapping['notes'] && row[mapping['notes']]) {
        notizia.notes = row[mapping['notes']];
      }
      if (mapping['status'] && row[mapping['status']]) {
        const status = row[mapping['status']].toLowerCase().trim();
        if (VALID_STATUSES.includes(status as NotiziaStatus)) {
          notizia.status = status as NotiziaStatus;
        }
      }
      if (mapping['created_at'] && row[mapping['created_at']]) {
        const dateStr = row[mapping['created_at']];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          notizia.created_at = date.toISOString();
        }
      }

      return notizia;
    }).filter(n => n.name.trim() !== '');
  };

  const handleImport = async () => {
    const dataToImport = getMappedData();
    setStep('importing');
    setImportProgress(0);
    setImportErrors([]);

    const errors: string[] = [];
    
    for (let i = 0; i < dataToImport.length; i++) {
      try {
        await addNotizia.mutateAsync(dataToImport[i]);
      } catch (error) {
        errors.push(`Riga ${i + 1}: ${dataToImport[i].name} - ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      }
      setImportProgress(Math.round(((i + 1) / dataToImport.length) * 100));
    }

    setImportErrors(errors);
    
    if (errors.length === 0) {
      toast({
        title: 'Importazione completata!',
        description: `${dataToImport.length} notizie importate con successo`,
      });
      handleOpenChange(false);
    } else {
      toast({
        title: 'Importazione completata con errori',
        description: `${dataToImport.length - errors.length} notizie importate, ${errors.length} errori`,
        variant: 'destructive',
      });
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Clicca o trascina un file CSV
        </p>
        <p className="text-xs text-muted-foreground/70">
          Supporta file .csv con separatore virgola o punto e virgola
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Trovate <span className="font-semibold text-foreground">{csvData.length}</span> righe nel CSV. 
        Mappa le colonne ai campi delle notizie.
      </div>
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {NOTIZIA_FIELDS.map(field => (
            <div key={field.key} className="flex items-center gap-4">
              <Label className="w-32 text-right shrink-0">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select
                value={mapping[field.key] || '__none__'}
                onValueChange={(value) => handleMappingChange(field.key, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleziona colonna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-- Non mappare --</SelectItem>
                  {csvHeaders.map(header => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setStep('upload')}>
          Indietro
        </Button>
        <Button 
          onClick={() => setStep('preview')} 
          disabled={!canProceedToPreview()}
        >
          Anteprima
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const mappedData = getMappedData();
    const previewData = mappedData.slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground">
          Anteprima di <span className="font-semibold text-foreground">{mappedData.length}</span> notizie da importare
        </div>

        <ScrollArea className="h-[250px]">
          <div className="space-y-3">
            {previewData.map((notizia, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <div className="font-medium">{notizia.name}</div>
                <div className="text-muted-foreground text-xs flex flex-wrap gap-2">
                  {notizia.zona && <span>📍 {notizia.zona}</span>}
                  {notizia.phone && <span>📞 {notizia.phone}</span>}
                  {notizia.type && <span>🏠 {notizia.type}</span>}
                  {notizia.status && <span>📊 {notizia.status}</span>}
                </div>
              </div>
            ))}
            {mappedData.length > 5 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                ... e altre {mappedData.length - 5} notizie
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setStep('mapping')}>
            Indietro
          </Button>
          <Button onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Importa {mappedData.length} notizie
          </Button>
        </div>
      </div>
    );
  };

  const renderImportingStep = () => (
    <div className="space-y-6 py-8">
      <div className="text-center">
        {importProgress < 100 ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Importazione in corso...</p>
          </>
        ) : importErrors.length === 0 ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-foreground font-medium">Importazione completata!</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-sm text-foreground font-medium">Completata con errori</p>
          </>
        )}
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${importProgress}%` }}
        />
      </div>
      <p className="text-center text-sm text-muted-foreground">{importProgress}%</p>

      {importErrors.length > 0 && (
        <ScrollArea className="h-[150px] border rounded-lg p-3">
          <div className="space-y-1 text-xs text-destructive">
            {importErrors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </div>
        </ScrollArea>
      )}

      {importProgress === 100 && (
        <div className="flex justify-center pt-4">
          <Button onClick={() => handleOpenChange(false)}>
            Chiudi
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Importa CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importa Notizie da CSV
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && renderUploadStep()}
        {step === 'mapping' && renderMappingStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'importing' && renderImportingStep()}
      </DialogContent>
    </Dialog>
  );
};

export default ImportCSVDialog;

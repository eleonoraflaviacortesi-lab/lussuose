import { useState } from 'react';
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getDalilaNotizie, getDalilaNotizieSummary } from '@/lib/importDalilaNotizie';
import { useNotizie } from '@/hooks/useNotizie';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const ImportDalilaDialog = () => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  
  const { addNotizia } = useNotizie();
  const { profile } = useAuth();
  
  const summary = getDalilaNotizieSummary();
  
  // Verifica se l'utente è DALILA
  const isDalila = profile?.full_name?.toLowerCase().includes('dalila');
  
  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    
    const notizie = getDalilaNotizie();
    let success = 0;
    let errors = 0;
    
    for (const notizia of notizie) {
      try {
        await addNotizia.mutateAsync(notizia);
        success++;
      } catch (error) {
        console.error('Errore importazione:', error);
        errors++;
      }
    }
    
    setResult({ success, errors });
    setImporting(false);
    
    if (errors === 0) {
      toast({
        title: 'Importazione completata!',
        description: `${success} notizie importate con successo`,
      });
    } else {
      toast({
        title: 'Importazione parziale',
        description: `${success} importate, ${errors} errori`,
        variant: 'destructive',
      });
    }
  };
  
  const handleClose = () => {
    setOpen(false);
    setResult(null);
  };
  
  // Mostra solo per DALILA o admin
  if (!isDalila && profile?.role !== 'admin') {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importa Notizie Excel
          </DialogTitle>
          <DialogDescription>
            Importa le {summary.total} notizie dal file Excel di DALILA
          </DialogDescription>
        </DialogHeader>
        
        {!result ? (
          <div className="space-y-4 py-4">
            {/* Preview dati */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Anteprima importazione</h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Per zona:</p>
                  {Object.entries(summary.byZona).map(([zona, count]) => (
                    <div key={zona} className="flex justify-between">
                      <span>{zona}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground">Per status:</p>
                  {Object.entries(summary.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• Tutti i dati saranno preservati nelle note</p>
              <p>• Lo status sarà mappato automaticamente</p>
              <p>• Le date originali saranno conservate</p>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            {result.errors === 0 ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <p className="font-medium text-lg">Importazione completata!</p>
                  <p className="text-muted-foreground">
                    {result.success} notizie importate con successo
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
                <div>
                  <p className="font-medium text-lg">Importazione parziale</p>
                  <p className="text-muted-foreground">
                    {result.success} importate, {result.errors} errori
                  </p>
                </div>
              </>
            )}
          </div>
        )}
        
        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleImport} disabled={importing} className="gap-2">
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importa {summary.total} notizie
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Chiudi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDalilaDialog;

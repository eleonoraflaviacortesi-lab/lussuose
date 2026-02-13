import { useState, useEffect } from 'react';
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchAndParseDalilaCSV, getDalilaCSVSummary } from '@/lib/importDalilaClienti';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportDalilaCSVDialog = ({ open, onOpenChange }: Props) => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number; skipped: number } | null>(null);
  const [buyers, setBuyers] = useState<Awaited<ReturnType<typeof fetchAndParseDalilaCSV>>>([]);
  const [loading, setLoading] = useState(false);
  
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  // Load and parse CSV when dialog opens
  useEffect(() => {
    if (open && buyers.length === 0) {
      setLoading(true);
      fetchAndParseDalilaCSV()
        .then(setBuyers)
        .finally(() => setLoading(false));
    }
  }, [open]);
  
  const summary = buyers.length > 0 ? getDalilaCSVSummary(buyers) : null;
  
  const handleImport = async () => {
    if (!profile) return;
    setImporting(true);
    setResult(null);
    
    let success = 0;
    let errors = 0;
    let skipped = 0;
    
    for (const buyer of buyers) {
      try {
        // Check if buyer already exists (by name + sede)
        const { data: existing } = await supabase
          .from('clienti')
          .select('id')
          .eq('nome', buyer.nome)
          .eq('sede', buyer.sede)
          .maybeSingle();
        
        if (existing) {
          skipped++;
          continue;
        }
        
        const { error } = await supabase
          .from('clienti')
          .insert({
            nome: buyer.nome,
            paese: buyer.paese,
            telefono: buyer.telefono,
            email: buyer.email,
            status: buyer.status,
            note_extra: buyer.note_extra,
            last_contact_date: buyer.last_contact_date,
            sede: buyer.sede,
          });
        
        if (error) throw error;
        success++;
      } catch (error) {
        console.error('Errore importazione buyer:', buyer.nome, error);
        errors++;
      }
    }
    
    setResult({ success, errors, skipped });
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ['clienti'] });
    
    if (errors === 0) {
      toast({
        title: 'Importazione completata!',
        description: `${success} buyers importati${skipped ? `, ${skipped} già esistenti` : ''}`,
      });
    } else {
      toast({
        title: 'Importazione parziale',
        description: `${success} importati, ${errors} errori, ${skipped} saltati`,
        variant: 'destructive',
      });
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
    setResult(null);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importa Buyers CSV Dalila
          </DialogTitle>
          <DialogDescription>
            {loading ? 'Caricamento dati...' : summary ? `Importa ${summary.total} buyers dal file CSV di Dalila` : 'Errore nel caricamento'}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !result && summary ? (
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Anteprima importazione</h4>
              
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold">{summary.total}</p>
                  <p className="text-muted-foreground text-xs">Buyers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{summary.withPhone}</p>
                  <p className="text-muted-foreground text-xs">Con telefono</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{summary.withEmail}</p>
                  <p className="text-muted-foreground text-xs">Con email</p>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Top paesi:</p>
                {Object.entries(summary.topCountries).map(([country, count]) => (
                  <div key={country} className="flex justify-between">
                    <span>{country}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• I duplicati (stessa persona, più immobili) sono consolidati</p>
              <p>• Portale, Property, Ref, Date → nelle note</p>
              <p>• Status impostato a "Contacted"</p>
              <p>• Sede: PERUGIA</p>
              <p>• Buyers già esistenti saranno saltati</p>
            </div>
          </div>
        ) : result ? (
          <div className="py-6 text-center space-y-4">
            {result.errors === 0 ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <p className="font-medium text-lg">Importazione completata!</p>
                  <p className="text-muted-foreground">
                    {result.success} buyers importati
                    {result.skipped > 0 && `, ${result.skipped} già esistenti`}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
                <div>
                  <p className="font-medium text-lg">Importazione parziale</p>
                  <p className="text-muted-foreground">
                    {result.success} importati, {result.errors} errori
                    {result.skipped > 0 && `, ${result.skipped} saltati`}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : null}
        
        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button onClick={handleImport} disabled={importing || loading || !summary} className="gap-2">
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importa {summary?.total || 0} buyers
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Chiudi</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDalilaCSVDialog;

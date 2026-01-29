import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { Cliente, ClienteActivity } from '@/types';
import { generateClientePDF } from '@/lib/generateClientePDF';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientePDFExportProps {
  cliente: Cliente;
  activities: ClienteActivity[];
  agentName?: string;
}

export const ClientePDFExport = memo(({ 
  cliente, 
  activities,
  agentName 
}: ClientePDFExportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      // Fetch property matches with details
      const { data: matches } = await supabase
        .from('client_property_matches')
        .select(`
          id,
          reaction,
          suggested_at,
          properties(title, price, location)
        `)
        .eq('cliente_id', cliente.id)
        .eq('suggested', true)
        .order('suggested_at', { ascending: false });

      const propertyMatches = (matches || []).map((m: any) => ({
        id: m.id,
        property_title: m.properties?.title || 'Proprietà',
        property_price: m.properties?.price,
        property_location: m.properties?.location,
        reaction: m.reaction,
        suggested_at: m.suggested_at,
      }));

      await generateClientePDF({
        cliente,
        activities,
        propertyMatches,
        agentName,
      });

      toast({ title: 'PDF generato', description: 'Il download inizierà automaticamente' });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast({ 
        title: 'Errore', 
        description: 'Impossibile generare il PDF', 
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isGenerating}
      className="w-full"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      Scarica PDF
    </Button>
  );
});
ClientePDFExport.displayName = 'ClientePDFExport';

export default ClientePDFExport;

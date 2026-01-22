import { useState, useMemo } from 'react';
import { useClientPropertyMatches, useProperties, PropertyMatch, Property } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  RefreshCw, 
  ExternalLink, 
  Plus, 
  Check, 
  MapPin, 
  Maximize, 
  Bath, 
  BedDouble,
  Droplets,
  Trees,
  Calculator,
  Search,
  Link,
  Loader2,
} from 'lucide-react';

interface PropertyMatchesSectionProps {
  clienteId: string;
}

function PropertyCard({ 
  match, 
  onToggleSuggested,
  onRemove,
}: { 
  match: PropertyMatch;
  onToggleSuggested: (matchId: string, suggested: boolean) => void;
  onRemove: (matchId: string) => void;
}) {
  const property = match.property;
  if (!property) return null;

  const formatPrice = (price: number | null) => {
    if (!price) return 'Prezzo su richiesta';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`p-3 rounded-lg border ${match.suggested ? 'bg-muted/50 border-primary/30' : 'bg-card border-border'}`}>
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {property.image_url ? (
            <img 
              src={property.image_url} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{property.title}</h4>
              {property.ref_number && (
                <p className="text-xs text-muted-foreground">{property.ref_number}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge className={`${getScoreColor(match.match_score)} text-white text-xs`}>
                {match.match_score}%
              </Badge>
              {match.match_type === 'manual' && (
                <Badge variant="outline" className="text-xs">Manual</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {property.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {property.location}
              </span>
            )}
            <span className="font-medium text-foreground">
              {formatPrice(property.price)}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {property.rooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3 w-3" />
                {property.rooms}
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {property.bathrooms}
              </span>
            )}
            {property.surface_mq && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3 w-3" />
                {property.surface_mq} mq
              </span>
            )}
            {property.has_pool && (
              <span className="flex items-center gap-1 text-blue-500">
                <Droplets className="h-3 w-3" />
              </span>
            )}
            {property.has_land && (
              <span className="flex items-center gap-1 text-green-500">
                <Trees className="h-3 w-3" />
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`suggested-${match.id}`}
                checked={match.suggested}
                onCheckedChange={(checked) => onToggleSuggested(match.id, !!checked)}
              />
              <label 
                htmlFor={`suggested-${match.id}`}
                className="text-xs cursor-pointer"
              >
                {match.suggested ? (
                  <span className="flex items-center gap-1 text-primary">
                    <Check className="h-3 w-3" /> Proposta
                  </span>
                ) : (
                  'Segna come proposta'
                )}
              </label>
            </div>
            <a
              href={property.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Vedi <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddPropertyDialog({ 
  clienteId,
  existingPropertyIds,
  properties,
  onAdd,
  onSyncComplete,
}: {
  clienteId: string;
  existingPropertyIds: string[];
  properties: Property[];
  onAdd: (propertyId: string) => void;
  onSyncComplete: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urlToImport, setUrlToImport] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('search');

  const availableProperties = properties.filter(p => !existingPropertyIds.includes(p.id));
  
  // Filter properties by search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return availableProperties;
    const query = searchQuery.toLowerCase();
    return availableProperties.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.ref_number?.toLowerCase().includes(query) ||
      p.location?.toLowerCase().includes(query) ||
      p.region?.toLowerCase().includes(query) ||
      p.property_type?.toLowerCase().includes(query)
    );
  }, [availableProperties, searchQuery]);

  const handleSelectProperty = (propertyId: string) => {
    onAdd(propertyId);
    setOpen(false);
    setSearchQuery('');
  };

  const handleImportFromUrl = async () => {
    if (!urlToImport.trim()) return;
    
    // Validate URL is from the right domain
    if (!urlToImport.includes('cortesiluxuryrealestate.com')) {
      toast({
        title: 'URL non valido',
        description: 'Inserisci un URL dal sito cortesiluxuryrealestate.com',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-single-property', {
        body: { url: urlToImport },
      });

      if (error) throw error;

      if (data.success && data.propertyId) {
        toast({ title: 'Proprietà importata!' });
        onAdd(data.propertyId);
        setUrlToImport('');
        setOpen(false);
        onSyncComplete(); // Refresh properties list
      } else {
        throw new Error(data.error || 'Importazione fallita');
      }
    } catch (err: any) {
      toast({
        title: 'Errore importazione',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-1" />
          Aggiungi manualmente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi proprietà</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-1" />
              Cerca
            </TabsTrigger>
            <TabsTrigger value="import">
              <Link className="h-4 w-4 mr-1" />
              Importa da URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-3 mt-3">
            <Input
              placeholder="Cerca per nome, ref, località..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            
            {filteredProperties.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {availableProperties.length === 0 
                    ? 'Nessuna proprietà disponibile. Sincronizza prima le proprietà.'
                    : 'Nessun risultato trovato'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredProperties.map(property => (
                    <div 
                      key={property.id}
                      className="p-3 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                      onClick={() => handleSelectProperty(property.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{property.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {property.ref_number} • {property.location || property.region}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-primary ml-2">
                          {formatPrice(property.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {property.rooms && <span>{property.rooms} camere</span>}
                        {property.surface_mq && <span>{property.surface_mq} mq</span>}
                        {property.has_pool && <Droplets className="h-3 w-3 text-blue-500" />}
                        {property.has_land && <Trees className="h-3 w-3 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4 mt-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Incolla l'URL di una proprietà dal sito cortesiluxuryrealestate.com
              </p>
              <Input
                placeholder="https://cortesiluxuryrealestate.com/property/..."
                value={urlToImport}
                onChange={(e) => setUrlToImport(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleImportFromUrl} 
              disabled={!urlToImport.trim() || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Importa proprietà
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function PropertyMatchesSection({ clienteId }: PropertyMatchesSectionProps) {
  const { 
    matches, 
    isLoading, 
    calculateMatches,
    isCalculating,
    toggleSuggested,
    addManualMatch,
  } = useClientPropertyMatches(clienteId);

  const { properties, syncProperties, isSyncing, refetchProperties } = useProperties();

  const suggestedCount = matches.filter(m => m.suggested).length;
  const existingPropertyIds = matches.map(m => m.property_id);

  const handleSync = async () => {
    await syncProperties();
    await calculateMatches();
  };

  const handleCalculate = async () => {
    await calculateMatches();
  };

  const handleToggleSuggested = async (matchId: string, suggested: boolean) => {
    await toggleSuggested({ matchId, suggested });
  };

  const handleAddManual = async (propertyId: string) => {
    await addManualMatch({ propertyId });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Proprietà Compatibili</h3>
          {matches.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {matches.length}
            </Badge>
          )}
          {suggestedCount > 0 && (
            <Badge variant="default" className="text-xs">
              {suggestedCount} proposte
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCalculate}
            disabled={isCalculating}
            title="Ricalcola match"
          >
            <Calculator className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSync}
            disabled={isSyncing || isCalculating}
            title="Sincronizza dal sito"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Property list */}
      {matches.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nessuna proprietà compatibile trovata</p>
          <p className="text-xs mt-1">
            Clicca su <Calculator className="h-3 w-3 inline" /> per calcolare i match
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-2">
            {matches.map(match => (
              <PropertyCard 
                key={match.id} 
                match={match}
                onToggleSuggested={handleToggleSuggested}
                onRemove={() => {}}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Add manual */}
      <AddPropertyDialog
        clienteId={clienteId}
        existingPropertyIds={existingPropertyIds}
        properties={properties}
        onAdd={handleAddManual}
        onSyncComplete={refetchProperties}
      />
    </div>
  );
}

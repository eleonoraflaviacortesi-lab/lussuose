import { useState } from 'react';
import { useClientPropertyMatches, useProperties, PropertyMatch, Property } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Calculator
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
}: {
  clienteId: string;
  existingPropertyIds: string[];
  properties: Property[];
  onAdd: (propertyId: string) => void;
}) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [open, setOpen] = useState(false);

  const availableProperties = properties.filter(p => !existingPropertyIds.includes(p.id));

  const handleAdd = () => {
    if (selectedPropertyId) {
      onAdd(selectedPropertyId);
      setSelectedPropertyId('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-1" />
          Aggiungi manualmente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi proprietà</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona una proprietà..." />
            </SelectTrigger>
            <SelectContent>
              {availableProperties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.title} - {property.ref_number || 'No ref'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!selectedPropertyId} className="w-full">
            Aggiungi
          </Button>
        </div>
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

  const { properties, syncProperties, isSyncing } = useProperties();

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
      />
    </div>
  );
}

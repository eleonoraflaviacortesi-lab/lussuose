import { useState, useMemo } from 'react';
import { useClientPropertyMatches, useProperties, PropertyMatch, Property } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Droplets,
  Trees,
  Calculator,
  Search,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
} from 'lucide-react';

interface PropertyMatchesSectionProps {
  clienteId: string;
  clientePhone?: string | null;
}

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function PropertyCard({ 
  match, 
  clientePhone,
  onToggleSuggested,
  onSetReaction,
}: { 
  match: PropertyMatch;
  clientePhone?: string | null;
  onToggleSuggested: (matchId: string, suggested: boolean) => void;
  onSetReaction: (matchId: string, reaction: 'liked' | 'disliked' | null) => void;
}) {
  const property = match.property;
  if (!property) return null;

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/D';
    return new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 0,
    }).format(price) + ' €';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-400';
  };

  const handleWhatsApp = () => {
    // Kept for backward compatibility (not used directly anymore)
  };

  const getWhatsAppHref = () => {
    if (!clientePhone) return null;
    // wa.me expects digits only (country code + number)
    const digitsOnly = clientePhone
      .replace(/^00/, '')
      .replace(/\D/g, '');

    if (!digitsOnly) return null;

    const message = encodeURIComponent(
      `Ciao! Ti invio questa proprietà che potrebbe interessarti:\n\n${property.title}\n${property.url}`
    );

    return `https://wa.me/${digitsOnly}?text=${message}`;
  };

  const handleReaction = (reaction: 'liked' | 'disliked') => {
    // Toggle off if same reaction, otherwise set new reaction
    const newReaction = match.reaction === reaction ? null : reaction;
    onSetReaction(match.id, newReaction);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 backdrop-blur-xl">
      <div className="flex gap-2.5">
        {/* Image */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
          {property.image_url ? (
            <img 
              src={property.image_url} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-6 w-6 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-medium text-xs leading-tight line-clamp-2 flex-1">{property.title}</h4>
            <Badge className={`${getScoreColor(match.match_score || 0)} text-white text-[10px] px-1.5 py-0 flex-shrink-0`}>
              {match.match_score}%
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            {property.location && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5" />
                {property.location}
              </span>
            )}
            {property.has_pool && <Droplets className="h-2.5 w-2.5 text-blue-500 flex-shrink-0" />}
            {property.has_land && <Trees className="h-2.5 w-2.5 text-green-500 flex-shrink-0" />}
          </div>

          <p className="font-semibold text-sm mt-0.5">{formatPrice(property.price)}</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-muted/30">
        {/* Left: reactions */}
        <div className="flex items-center gap-1">
          {/* Proposed tick */}
          <button
            onClick={() => onToggleSuggested(match.id, !match.suggested)}
            className={`p-1.5 rounded-full transition-all ${
              match.suggested 
                ? 'bg-green-100 text-green-600' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
            title={match.suggested ? 'Proposta inviata' : 'Segna come proposta'}
          >
            <Check className="h-3.5 w-3.5" />
          </button>

          {/* Thumbs up */}
          <button
            onClick={() => handleReaction('liked')}
            className={`p-1.5 rounded-full transition-all ${
              match.reaction === 'liked'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
            title="Piace al cliente"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>

          {/* Thumbs down */}
          <button
            onClick={() => handleReaction('disliked')}
            className={`p-1.5 rounded-full transition-all ${
              match.reaction === 'disliked'
                ? 'bg-red-100 text-red-500'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
            title="Non piace al cliente"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: WhatsApp + View */}
        <div className="flex items-center gap-1.5">
          {(() => {
            const href = getWhatsAppHref();
            if (!href) return null;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                title="Invia su WhatsApp"
                onClick={(e) => e.stopPropagation()}
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </a>
            );
          })()}
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
            title="Vedi annuncio"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

interface WebSearchResult {
  url: string;
  title: string;
  description: string;
  ref_number: string | null;
  price: number | null;
}

function AddPropertyDialog({ 
  clienteId,
  existingPropertyIds,
  onAdd,
  onSyncComplete,
}: {
  clienteId: string;
  existingPropertyIds: string[];
  onAdd: (propertyId: string) => void;
  onSyncComplete: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WebSearchResult[]>([]);
  const [isImporting, setIsImporting] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-website-properties', {
        body: { query: searchQuery },
      });

      if (error) throw error;

      if (data.success) {
        setSearchResults(data.results || []);
        if (data.results.length === 0) {
          toast({ title: 'Nessun risultato', description: 'Prova con termini diversi' });
        }
      } else {
        throw new Error(data.error || 'Ricerca fallita');
      }
    } catch (err: any) {
      toast({
        title: 'Errore ricerca',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportAndAdd = async (result: WebSearchResult) => {
    setIsImporting(result.url);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-single-property', {
        body: { url: result.url },
      });

      if (error) throw error;

      if (data.success && data.propertyId) {
        toast({ title: 'Proprietà importata e aggiunta!' });
        onAdd(data.propertyId);
        setOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        onSyncComplete();
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
      setIsImporting(null);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-1" />
          Cerca sul sito
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cerca proprietà sul sito</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cerca villa, casale, Cortona, piscina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || searchQuery.length < 2}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Cerca direttamente sul sito cortesiluxuryrealestate.com per titolo, località, tipologia...
          </p>

          {searchResults.length === 0 && !isSearching ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Inserisci un termine e clicca cerca</p>
            </div>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {searchResults.map((result, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm line-clamp-2">{result.title}</p>
                        {result.ref_number && (
                          <p className="text-xs text-muted-foreground">{result.ref_number}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                      {result.price && (
                        <span className="text-sm font-medium text-primary whitespace-nowrap">
                          {formatPrice(result.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Vedi sul sito <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        size="sm"
                        onClick={() => handleImportAndAdd(result)}
                        disabled={isImporting !== null}
                      >
                        {isImporting === result.url ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Importa
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PropertyMatchesSection({ clienteId, clientePhone }: PropertyMatchesSectionProps) {
  const { 
    matches, 
    isLoading, 
    calculateMatches,
    isCalculating,
    toggleSuggested,
    setReaction,
    addManualMatch,
  } = useClientPropertyMatches(clienteId);

  const { syncProperties, isSyncing, refetchProperties } = useProperties();

  const suggestedCount = matches.filter(m => m.suggested).length;
  const likedCount = matches.filter(m => m.reaction === 'liked').length;
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

  const handleSetReaction = async (matchId: string, reaction: 'liked' | 'disliked' | null) => {
    await setReaction({ matchId, reaction });
  };

  const handleAddManual = async (propertyId: string) => {
    await addManualMatch({ propertyId });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - liquid glass style */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Home className="h-4 w-4 text-foreground" />
          <h3 className="font-semibold text-sm">Proprietà</h3>
          {matches.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {matches.length}
            </Badge>
          )}
          {suggestedCount > 0 && (
            <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">
              {suggestedCount} proposte
            </Badge>
          )}
          {likedCount > 0 && (
            <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">
              {likedCount} ❤️
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
            title="Ricalcola match"
          >
            <Calculator className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing || isCalculating}
            className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
            title="Sincronizza dal sito"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Property list - no scroll, show all */}
      {matches.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg">
          <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nessuna proprietà compatibile</p>
          <p className="text-xs mt-1">
            Clicca <Calculator className="h-3 w-3 inline" /> per calcolare
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map(match => (
            <PropertyCard 
              key={match.id} 
              match={match}
              clientePhone={clientePhone}
              onToggleSuggested={handleToggleSuggested}
              onSetReaction={handleSetReaction}
            />
          ))}
        </div>
      )}

      {/* Add manual - liquid glass */}
      <AddPropertyDialog
        clienteId={clienteId}
        existingPropertyIds={existingPropertyIds}
        onAdd={handleAddManual}
        onSyncComplete={refetchProperties}
      />
    </div>
  );
}

import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useClientPropertyMatches, useProperties, PropertyMatch, Property } from '@/hooks/useProperties';
import { useQueryClient } from '@tanstack/react-query';
import { useClienteActivities } from '@/hooks/useClienteActivities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  ExternalLink, 
  MapPin, 
  Droplets,
  Trees,
  Calculator,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  GripVertical,
  Check,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';


interface PropertyMatchesSectionProps {
  clienteId: string;
  clientePhone?: string | null;
  noteExtra?: string | null;
}

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function PropertyCard({ 
  match, 
  clienteId,
  clientePhone,
  onToggleSuggested,
  onSetReaction,
  onRemove,
  onUpdateNotes,
  dragHandleProps,
}: { 
  match: PropertyMatch;
  clienteId: string;
  clientePhone?: string | null;
  onToggleSuggested: (matchId: string, suggested: boolean) => void;
  onSetReaction: (matchId: string, reaction: 'liked' | 'disliked' | null) => void;
  onRemove: (matchId: string) => void;
  onUpdateNotes: (matchId: string, notes: string) => void;
  dragHandleProps?: any;
}) {
  const { toast } = useToast();
  const { createActivity } = useClienteActivities(clienteId);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState(match.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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

  const getWhatsAppHref = () => {
    if (!clientePhone) return null;
    const digitsOnly = clientePhone.replace(/^00/, '').replace(/\D/g, '');
    if (!digitsOnly) return null;
    const message = encodeURIComponent(
      `Ciao! Ti invio questa proprietà che potrebbe interessarti:\n\n${property.title}\n${property.url}`
    );
    return `https://wa.me/${digitsOnly}?text=${message}`;
  };

  const handleReaction = (reaction: 'liked' | 'disliked') => {
    const newReaction = match.reaction === reaction ? null : reaction;
    onSetReaction(match.id, newReaction);
  };

  const handleSaveComment = async () => {
    onUpdateNotes(match.id, commentText);
    // Log activity for the comment
    if (commentText.trim()) {
      await createActivity({
        cliente_id: clienteId,
        activity_type: 'comment' as any,
        title: 'Commento su proprietà',
        description: `${property.title}: ${commentText.substring(0, 100)}`,
        property_id: property.id,
      });
    }
    setShowCommentDialog(false);
    toast({ title: 'Commento salvato' });
  };

  const handleRemove = async () => {
    // Log activity for removal
    await createActivity({
      cliente_id: clienteId,
      activity_type: 'status_change' as any,
      title: 'Associazione rimossa',
      description: property.title,
      property_id: property.id,
    });
    onRemove(match.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 backdrop-blur-xl">
      <div className="flex gap-2.5">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 rounded-md hover:bg-muted transition-colors self-center"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        {/* Image */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
          {property.image_url ? (
            <img 
              src={property.image_url} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              {property.ref_number && (
                <span className="font-mono text-[10px] font-semibold text-muted-foreground">{property.ref_number}</span>
              )}
              <h4 className="font-medium text-xs leading-tight line-clamp-2">{property.title}</h4>
            </div>
            <Badge className={`${getScoreColor(match.match_score || 0)} text-white text-[10px] px-1.5 py-0 flex-shrink-0`}>
              {match.match_score}%
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
            {property.location && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5" />
                {property.location}
              </span>
            )}
            {property.surface_mq && <span>{property.surface_mq} mq</span>}
            {property.rooms && <span>{property.rooms} cam</span>}
            {property.has_pool && <Droplets className="h-2.5 w-2.5 text-blue-500 flex-shrink-0" />}
            {property.has_land && <Trees className="h-2.5 w-2.5 text-green-500 flex-shrink-0" />}
          </div>

          <p className="font-semibold text-sm mt-0.5">{formatPrice(property.price)}</p>
        </div>
      </div>

      {/* Comment preview */}
      {match.notes && (
        <div 
          className="mt-2 px-2 py-1.5 bg-muted/50 rounded-lg text-xs text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
          onClick={() => setShowCommentDialog(true)}
        >
          💬 {match.notes}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/50">
        {/* Left: reactions + comment */}
        <div className="flex items-center gap-1">
          {/* Proposed tick */}
          <button
            onClick={() => onToggleSuggested(match.id, !match.suggested)}
            className={cn(
              "p-1.5 rounded-full transition-all",
              match.suggested 
                ? 'bg-green-100 text-green-600' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
            title={match.suggested ? 'Proposta inviata' : 'Segna come proposta'}
          >
            <Check className="h-3 w-3" />
          </button>

          {/* Thumbs up */}
          <button
            onClick={() => handleReaction('liked')}
            className={cn(
              "p-1.5 rounded-full transition-all",
              match.reaction === 'liked'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
            title="Piace al cliente"
          >
            <ThumbsUp className="h-3 w-3" />
          </button>

          {/* Thumbs down */}
          <button
            onClick={() => handleReaction('disliked')}
            className={cn(
              "p-1.5 rounded-full transition-all",
              match.reaction === 'disliked'
                ? 'bg-red-100 text-red-500'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
            title="Non piace al cliente"
          >
            <ThumbsDown className="h-3 w-3" />
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowCommentDialog(true)}
            className={cn(
              "p-1.5 rounded-full transition-all",
              match.notes 
                ? 'bg-teal-100 text-teal-600' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
            title="Aggiungi commento"
          >
            <MessageCircle className="h-3 w-3" />
          </button>

          {/* Delete */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-red-100 hover:text-red-500 transition-all"
            title="Rimuovi associazione"
          >
            <Trash2 className="h-3 w-3" />
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
                <WhatsAppIcon className="h-3 w-3" />
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
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="w-4 h-4" />
              Commento
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground line-clamp-2">{property.title}</p>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Aggiungi note o commenti..."
            className="min-h-[100px]"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCommentDialog(false)}>Annulla</Button>
            <Button onClick={handleSaveComment}>Salva</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Rimuovere associazione?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{property.title}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annulla</Button>
            <Button variant="destructive" onClick={handleRemove}>Rimuovi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export function PropertyMatchesSection({ clienteId, clientePhone, noteExtra }: PropertyMatchesSectionProps) {
  const { 
    matches, 
    isLoading, 
    calculateMatches,
    isCalculating,
    toggleSuggested,
    setReaction,
    addManualMatch,
    removeMatch,
    updateNotes,
  } = useClientPropertyMatches(clienteId);

  const { refetchProperties } = useProperties();
  const queryClient = useQueryClient();
  const [orderedMatches, setOrderedMatches] = useState<PropertyMatch[]>([]);
  const [autoMatching, setAutoMatching] = useState(false);
  const autoMatchAttempted = useRef(false);

  // Auto-match: parse note_extra for Ref. numbers and associate properties
  useEffect(() => {
    if (autoMatchAttempted.current || !noteExtra || !clienteId) return;
    
    // Extract ref numbers from note_extra (patterns: "Ref. 1234", "Ref 1234", "(Ref. 1234)")
    const refMatches = noteExtra.match(/Ref\.?\s*(\d+)/gi);
    if (!refMatches || refMatches.length === 0) return;

    const refNumbers = refMatches.map(m => {
      const num = m.match(/(\d+)/);
      return num ? num[1] : null;
    }).filter(Boolean) as string[];

    if (refNumbers.length === 0) return;
    
    autoMatchAttempted.current = true;

    // Search for properties with these ref numbers and auto-associate
    const autoAssociate = async () => {
      setAutoMatching(true);
      try {
        // Get existing matches to avoid duplicates
        const { data: existingMatches } = await supabase
          .from('client_property_matches')
          .select('property_id')
          .eq('cliente_id', clienteId);
        const existingPropertyIds = (existingMatches || []).map(m => m.property_id);
        
        let added = 0;
        for (const refNum of refNumbers) {
          try {
            // Search in existing properties table
            const { data: found } = await supabase
              .from('properties')
              .select('id')
              .ilike('ref_number', `%${refNum}%`)
              .limit(1);

            if (found && found.length > 0 && !existingPropertyIds.includes(found[0].id)) {
              await supabase.from('client_property_matches').insert({
                cliente_id: clienteId,
                property_id: found[0].id,
                match_type: 'manual',
                match_score: 100,
                notes: `Auto-match da Ref. ${refNum}`,
              });
              existingPropertyIds.push(found[0].id);
              added++;
            }
          } catch (err) {
            console.warn(`Auto-match failed for Ref ${refNum}:`, err);
          }
        }
        
        if (added > 0) {
          console.log(`Auto-matched ${added} properties from note_extra refs`);
          queryClient.invalidateQueries({ queryKey: ['property-matches', clienteId] });
        }
      } finally {
        setAutoMatching(false);
      }
    };

    autoAssociate();
  }, [noteExtra, clienteId]);

  // Sync orderedMatches with matches from server
  useMemo(() => {
    if (matches.length > 0 && orderedMatches.length === 0) {
      setOrderedMatches(matches);
    } else if (matches.length !== orderedMatches.length) {
      // Merge: keep order of existing, append new ones
      const existingIds = new Set(orderedMatches.map(m => m.id));
      const newMatches = matches.filter(m => !existingIds.has(m.id));
      const validOrdered = orderedMatches.filter(o => matches.some(m => m.id === o.id));
      setOrderedMatches([...validOrdered, ...newMatches]);
    }
  }, [matches]);

  const displayMatches = orderedMatches.length > 0 ? orderedMatches : matches;

  const suggestedCount = displayMatches.filter(m => m.suggested).length;
  const likedCount = displayMatches.filter(m => m.reaction === 'liked').length;
  const existingPropertyIds = displayMatches.map(m => m.property_id);

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

  const handleRemove = async (matchId: string) => {
    await removeMatch(matchId);
    setOrderedMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const handleUpdateNotes = async (matchId: string, notes: string) => {
    await updateNotes({ matchId, notes });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(orderedMatches.length > 0 ? orderedMatches : matches);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setOrderedMatches(items);
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
      {/* Header */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Home className="h-4 w-4 text-foreground" />
          <h3 className="font-semibold text-sm">Proprietà</h3>
          {displayMatches.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {displayMatches.length}
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
        </div>
      </div>

      {/* Property list with drag-drop */}
      {displayMatches.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg">
          {autoMatching ? (
            <>
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
              <p className="text-sm">Cercando proprietà dai riferimenti...</p>
            </>
          ) : (
            <>
              <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessuna proprietà compatibile</p>
              <p className="text-xs mt-1">
                Clicca <Calculator className="h-3 w-3 inline" /> per calcolare
              </p>
            </>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="properties">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {displayMatches.map((match, index) => (
                  <Draggable key={match.id} draggableId={match.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "transition-shadow",
                          snapshot.isDragging && "shadow-xl"
                        )}
                      >
                        <PropertyCard 
                          match={match}
                          clienteId={clienteId}
                          clientePhone={clientePhone}
                          onToggleSuggested={handleToggleSuggested}
                          onSetReaction={handleSetReaction}
                          onRemove={handleRemove}
                          onUpdateNotes={handleUpdateNotes}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

    </div>
  );
}

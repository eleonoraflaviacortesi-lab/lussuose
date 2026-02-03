import { useState } from 'react';
import { format, parseISO, addWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { ArrowLeft, Plus, MoreVertical, Check, Clock, ArrowRight, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMeetings, MeetingItem, MeetingItemStatus } from '@/hooks/useMeetings';
import { useAuth } from '@/hooks/useAuth';
import { AddMeetingItemDialog } from './AddMeetingItemDialog';
import { cn } from '@/lib/utils';

// Nuovi tipi sezione secondo il modello PDF
export type MeetingSectionType = 
  | 'trattativa_corso' 
  | 'trattativa_chiusa' 
  | 'incarico_preso' 
  | 'incarico_mirino' 
  | 'acquirente_caldo' 
  | 'incarico_ribasso' 
  | 'obiettivo';

const MEETING_SECTIONS: { key: MeetingSectionType; label: string; emoji: string }[] = [
  { key: 'trattativa_corso', label: 'Trattative in corso', emoji: '🤝' },
  { key: 'trattativa_chiusa', label: 'Trattative chiuse', emoji: '✅' },
  { key: 'incarico_preso', label: 'Incarichi presi settimana scorsa', emoji: '📋' },
  { key: 'incarico_mirino', label: 'Incarichi nel mirino', emoji: '🎯' },
  { key: 'acquirente_caldo', label: 'Acquirenti caldi', emoji: '🔥' },
  { key: 'incarico_ribasso', label: 'Incarichi da ribassare', emoji: '📉' },
  { key: 'obiettivo', label: 'Obiettivo settimana', emoji: '🏆' },
];

const STATUS_CONFIG: Record<MeetingItemStatus, { label: string; color: string; icon: typeof Check }> = {
  open: { label: 'Aperto', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completato', color: 'bg-green-100 text-green-700', icon: Check },
  postponed: { label: 'Rimandato', color: 'bg-amber-100 text-amber-700', icon: ArrowRight },
};

interface MeetingDetailProps {
  meetingId: string;
  onBack: () => void;
}

export const MeetingDetail = ({ meetingId, onBack }: MeetingDetailProps) => {
  const { profile } = useAuth();
  const isCoordinator = profile?.role === 'coordinatore' || profile?.role === 'admin';
  
  const { useMeetingDetail, updateItem, deleteItem } = useMeetings();
  const { data: meeting, isLoading } = useMeetingDetail(meetingId);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSectionType, setAddSectionType] = useState<MeetingSectionType>('trattativa_corso');

  const handleStatusChange = (item: MeetingItem, newStatus: MeetingItemStatus) => {
    updateItem.mutate({
      id: item.id,
      meeting_id: item.meeting_id,
      status: newStatus,
    });
  };

  const handleDelete = (item: MeetingItem) => {
    if (confirm('Eliminare questa voce?')) {
      deleteItem.mutate({ id: item.id, meeting_id: item.meeting_id });
    }
  };

  const handleAddItem = (sectionType: MeetingSectionType) => {
    setAddSectionType(sectionType);
    setShowAddDialog(true);
  };

  const getItemsBySection = (sectionType: MeetingSectionType) => {
    return meeting?.items?.filter(i => i.item_type === sectionType) || [];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Riunione non trovata</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna indietro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">
            Settimana {meeting.week_number}, {meeting.year}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(meeting.week_start), "d MMMM", { locale: it })} - 
            {format(addWeeks(parseISO(meeting.week_start), 1), " d MMMM", { locale: it })}
          </p>
        </div>
      </div>

      {/* Vertical sections */}
      {MEETING_SECTIONS.map(section => {
        const items = getItemsBySection(section.key);
        return (
          <div key={section.key} className="space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">{section.emoji}</span>
                {section.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {items.length}
                </Badge>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddItem(section.key)}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Aggiungi
              </Button>
            </div>

            {/* Section items */}
            {items.length === 0 ? (
              <Card className="p-4 text-center text-muted-foreground border-dashed">
                <p className="text-sm">Nessun elemento</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <MeetingItemCard
                    key={item.id}
                    item={item}
                    sectionType={section.key}
                    isCoordinator={isCoordinator}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add dialog */}
      <AddMeetingItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        meetingId={meetingId}
        sectionType={addSectionType}
      />
    </div>
  );
};

interface MeetingItemCardProps {
  item: MeetingItem;
  sectionType: MeetingSectionType;
  isCoordinator: boolean;
  onStatusChange: (item: MeetingItem, status: MeetingItemStatus) => void;
  onDelete: (item: MeetingItem) => void;
}

const MeetingItemCard = ({ item, sectionType, isCoordinator, onStatusChange, onDelete }: MeetingItemCardProps) => {
  const statusConfig = STATUS_CONFIG[item.status];
  const StatusIcon = statusConfig.icon;
  
  // Per gli obiettivi mostriamo sempre lo status
  const showStatus = sectionType === 'obiettivo';

  return (
    <Card className={cn(
      "p-3 transition-all",
      item.status === 'completed' && "opacity-60"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status badge only for objectives */}
          {showStatus && (
            <div className="mb-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                statusConfig.color
              )}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </span>
            </div>
          )}
          
          {/* Title */}
          <h4 className={cn(
            "font-medium text-sm",
            item.status === 'completed' && "line-through"
          )}>
            {item.title}
          </h4>
          
          {/* Description */}
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          )}

          {/* Linked entities and agent */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.linked_notizia_name && (
              <Badge variant="outline" className="text-xs">
                <Link2 className="h-3 w-3 mr-1" />
                📋 {item.linked_notizia_name}
              </Badge>
            )}
            {item.linked_cliente_name && (
              <Badge variant="outline" className="text-xs">
                <Link2 className="h-3 w-3 mr-1" />
                👤 {item.linked_cliente_name}
              </Badge>
            )}
            {(item as any).buyer_name && !(item.linked_cliente_id) && (
              <Badge variant="outline" className="text-xs">
                👤 {(item as any).buyer_name}
              </Badge>
            )}
            {item.assigned_to_name && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <span>{item.assigned_to_emoji}</span>
                {item.assigned_to_name}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sectionType === 'obiettivo' && item.status !== 'completed' && (
              <DropdownMenuItem onClick={() => onStatusChange(item, 'completed')}>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Segna completato
              </DropdownMenuItem>
            )}
            {sectionType === 'obiettivo' && item.status === 'completed' && (
              <DropdownMenuItem onClick={() => onStatusChange(item, 'open')}>
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                Riapri
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onDelete(item)}
              className="text-destructive"
            >
              Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};
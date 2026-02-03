import { useState } from 'react';
import { format, parseISO, addWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { ArrowLeft, Plus, MoreVertical, Check, Clock, ArrowRight, Link2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMeetings, MeetingItem, MeetingItemType, MeetingItemStatus } from '@/hooks/useMeetings';
import { useAuth } from '@/hooks/useAuth';
import { AddMeetingItemDialog } from './AddMeetingItemDialog';
import { cn } from '@/lib/utils';

const ITEM_TYPES: { key: MeetingItemType; label: string; emoji: string }[] = [
  { key: 'incarico', label: 'Incarichi', emoji: '📋' },
  { key: 'trattativa', label: 'Trattative', emoji: '🤝' },
  { key: 'acquirente', label: 'Acquirenti', emoji: '👤' },
  { key: 'obiettivo', label: 'Obiettivi', emoji: '🎯' },
  { key: 'task', label: 'Task', emoji: '✅' },
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
  const [addItemType, setAddItemType] = useState<MeetingItemType>('task');
  const [activeTab, setActiveTab] = useState<MeetingItemType>('incarico');

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

  const handleAddItem = (type: MeetingItemType) => {
    setAddItemType(type);
    setShowAddDialog(true);
  };

  const getItemsByType = (type: MeetingItemType) => {
    return meeting?.items?.filter(i => i.item_type === type) || [];
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
    <div className="space-y-4 pb-24">
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

      {/* Tabs for item types */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MeetingItemType)}>
        <TabsList className="w-full grid grid-cols-5 h-auto">
          {ITEM_TYPES.map(type => (
            <TabsTrigger 
              key={type.key} 
              value={type.key}
              className="flex flex-col py-2 px-1 text-xs"
            >
              <span className="text-lg">{type.emoji}</span>
              <span className="hidden sm:inline">{type.label}</span>
              <Badge variant="secondary" className="mt-1 text-[10px] px-1.5">
                {getItemsByType(type.key).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {ITEM_TYPES.map(type => (
          <TabsContent key={type.key} value={type.key} className="mt-4">
            <div className="space-y-3">
              {/* Add button */}
              {isCoordinator && (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => handleAddItem(type.key)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi {type.label.toLowerCase().slice(0, -1)}
                </Button>
              )}

              {/* Items list */}
              {getItemsByType(type.key).length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <span className="text-3xl mb-2 block">{type.emoji}</span>
                  <p>Nessun {type.label.toLowerCase().slice(0, -1)} per questa settimana</p>
                </Card>
              ) : (
                getItemsByType(type.key).map(item => (
                  <MeetingItemCard
                    key={item.id}
                    item={item}
                    isCoordinator={isCoordinator}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add dialog */}
      <AddMeetingItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        meetingId={meetingId}
        itemType={addItemType}
      />
    </div>
  );
};

interface MeetingItemCardProps {
  item: MeetingItem;
  isCoordinator: boolean;
  onStatusChange: (item: MeetingItem, status: MeetingItemStatus) => void;
  onDelete: (item: MeetingItem) => void;
}

const MeetingItemCard = ({ item, isCoordinator, onStatusChange, onDelete }: MeetingItemCardProps) => {
  const statusConfig = STATUS_CONFIG[item.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn(
      "p-4 transition-all",
      item.status === 'completed' && "opacity-60"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              statusConfig.color
            )}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </span>
            
            {item.assigned_to_name && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span>{item.assigned_to_emoji}</span>
                {item.assigned_to_name}
              </span>
            )}
          </div>
          
          <h4 className={cn(
            "font-medium mt-2",
            item.status === 'completed' && "line-through"
          )}>
            {item.title}
          </h4>
          
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {item.description}
            </p>
          )}

          {/* Linked entities */}
          {(item.linked_notizia_name || item.linked_cliente_name) && (
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
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.status !== 'completed' && (
              <DropdownMenuItem onClick={() => onStatusChange(item, 'completed')}>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Segna completato
              </DropdownMenuItem>
            )}
            {item.status !== 'open' && (
              <DropdownMenuItem onClick={() => onStatusChange(item, 'open')}>
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                Riapri
              </DropdownMenuItem>
            )}
            {item.status !== 'postponed' && (
              <DropdownMenuItem onClick={() => onStatusChange(item, 'postponed')}>
                <ArrowRight className="h-4 w-4 mr-2 text-amber-600" />
                Rimanda
              </DropdownMenuItem>
            )}
            {isCoordinator && (
              <DropdownMenuItem 
                onClick={() => onDelete(item)}
                className="text-destructive"
              >
                Elimina
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

import { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useNotizie, Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import NotiziaColumn from './NotiziaColumn';
import NotiziaDetail from './NotiziaDetail';
import AddNotiziaDialog from './AddNotiziaDialog';

const columns: { key: NotiziaStatus; title: string }[] = [
  { key: 'new', title: 'NEW!' },
  { key: 'in_progress', title: 'In progress' },
  { key: 'done', title: 'Done' },
  { key: 'on_shot', title: 'On shot' },
  { key: 'taken', title: 'Taken' },
];

const NotiziePage = () => {
  const { notizieByStatus, isLoading } = useNotizie();
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleNotiziaClick = (notizia: Notizia) => {
    setSelectedNotizia(notizia);
    setDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Le mie Notizie</h2>
        <AddNotiziaDialog />
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {columns.map((column) => (
            <NotiziaColumn
              key={column.key}
              title={column.title}
              count={notizieByStatus[column.key].length}
              notizie={notizieByStatus[column.key]}
              variant={column.key}
              onNotiziaClick={handleNotiziaClick}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Detail Sheet */}
      <NotiziaDetail
        notizia={selectedNotizia}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default NotiziePage;

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Notizia } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';

interface NotiziaCardProps {
  notizia: Notizia;
  onClick: () => void;
}

const statusIcons: Record<string, string> = {
  new: '🆕',
  in_progress: '🔴',
  done: '😶',
  on_shot: '🌸',
  taken: '🌺',
};

const NotiziaCard = ({ notizia, onClick }: NotiziaCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg p-3 cursor-pointer hover:bg-accent/50 transition-colors border border-border/50"
    >
      <div className="flex items-start gap-2">
        <span className="text-sm">{statusIcons[notizia.status] || '📋'}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground truncate">
            {notizia.name}
          </h4>
          {notizia.zona && (
            <Badge 
              variant="secondary" 
              className={cn(
                "mt-1 text-[10px] px-1.5 py-0",
                notizia.status === 'on_shot' && "bg-pink-600/20 text-pink-300",
                notizia.status === 'done' && "bg-purple-600/20 text-purple-300",
                notizia.status === 'in_progress' && "bg-amber-600/20 text-amber-300"
              )}
            >
              {notizia.zona}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(notizia.created_at), 'd MMMM yyyy', { locale: it })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotiziaCard;

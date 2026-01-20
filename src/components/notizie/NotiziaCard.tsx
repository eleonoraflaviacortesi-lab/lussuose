import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Notizia } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';

interface NotiziaCardProps {
  notizia: Notizia;
  onClick: () => void;
}

const NotiziaCard = ({ notizia, onClick }: NotiziaCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl p-3 cursor-pointer hover:bg-accent/30 transition-all border-0 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start gap-2">
        <span className="text-base">{(notizia as any).emoji || '📋'}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground truncate">
            {notizia.name}
          </h4>
          {notizia.zona && (
            <Badge 
              variant="secondary" 
              className={cn(
                "mt-1 text-[10px] px-1.5 py-0",
                notizia.status === 'new' && "bg-yellow-200/50 text-yellow-800",
                notizia.status === 'in_progress' && "bg-yellow-400/30 text-yellow-900",
                notizia.status === 'done' && "bg-orange-400/30 text-orange-800",
                notizia.status === 'on_shot' && "bg-red-400/30 text-red-800",
                notizia.status === 'taken' && "bg-green-200/50 text-green-800"
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

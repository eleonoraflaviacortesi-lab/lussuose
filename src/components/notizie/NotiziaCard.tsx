import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Notizia } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';

interface NotiziaCardProps {
  notizia: Notizia;
  onClick: () => void;
}

const statusBadgeStyles: Record<string, string> = {
  new: "bg-yellow-200/50 text-yellow-800",
  in_progress: "bg-yellow-400/30 text-yellow-900",
  done: "bg-orange-400/30 text-orange-800",
  on_shot: "bg-red-400/30 text-red-800",
  taken: "bg-green-200/50 text-green-800",
  no: "bg-zinc-900/20 text-zinc-800",
  sold: "bg-zinc-600/20 text-zinc-700",
};

const NotiziaCard = memo(({ notizia, onClick }: NotiziaCardProps) => {
  const formattedDate = useMemo(() => 
    format(new Date(notizia.created_at), 'd MMM yyyy', { locale: it }),
    [notizia.created_at]
  );

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-transform border-0 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start gap-2">
        <span className="text-base">{notizia.emoji || '📋'}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground truncate">
            {notizia.name}
          </h4>
          {notizia.zona && (
            <Badge 
              variant="secondary" 
              className={cn(
                "mt-1 text-[10px] px-1.5 py-0",
                statusBadgeStyles[notizia.status]
              )}
            >
              {notizia.zona}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formattedDate}
          </p>
        </div>
      </div>
    </div>
  );
});

NotiziaCard.displayName = 'NotiziaCard';

export default NotiziaCard;

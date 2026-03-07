import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanEmptyColumnProps {
  /** Short message like "Nessuna notizia" */
  message: string;
  /** CTA label like "Aggiungi notizia" */
  ctaLabel?: string;
  onAdd?: () => void;
  /** Whether this is a full-page empty state (larger) vs column empty state (compact) */
  fullPage?: boolean;
}

/** Minimal illustrated empty state for Kanban columns and list views */
export function KanbanEmptyColumn({ message, ctaLabel, onAdd, fullPage = false }: KanbanEmptyColumnProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${fullPage ? 'py-16 gap-4' : 'py-6 gap-2.5'}`}>
      {/* Minimal SVG illustration */}
      <svg
        width={fullPage ? 80 : 48}
        height={fullPage ? 80 : 48}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground/30"
      >
        <rect x="8" y="10" width="32" height="6" rx="3" fill="currentColor" />
        <rect x="8" y="21" width="24" height="6" rx="3" fill="currentColor" opacity="0.6" />
        <rect x="8" y="32" width="28" height="6" rx="3" fill="currentColor" opacity="0.3" />
      </svg>
      <p className={`text-muted-foreground/60 font-medium ${fullPage ? 'text-sm' : 'text-xs'}`}>
        {message}
      </p>
      {ctaLabel && onAdd && (
        <Button
          variant="outline"
          size={fullPage ? 'default' : 'sm'}
          onClick={onAdd}
          className={`gap-1.5 rounded-full border-muted-foreground/20 text-muted-foreground hover:text-foreground ${fullPage ? '' : 'h-7 text-xs px-3'}`}
        >
          <Plus className={fullPage ? 'w-4 h-4' : 'w-3 h-3'} />
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}

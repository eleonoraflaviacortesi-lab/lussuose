import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function UndoRedoButtons() {
  const { canUndo, canRedo, undoLabel, redoLabel, undo, redo } = useUndoRedo();

  if (!canUndo && !canRedo) return null;

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            disabled={!canUndo}
            onClick={undo}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {canUndo ? `Annulla: ${undoLabel}` : 'Niente da annullare'}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            disabled={!canRedo}
            onClick={redo}
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {canRedo ? `Ripristina: ${redoLabel}` : 'Niente da ripristinare'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

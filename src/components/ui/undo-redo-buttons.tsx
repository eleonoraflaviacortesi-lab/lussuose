import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function UndoRedoButtons() {
  const { canUndo, canRedo, undoLabel, redoLabel, undo, redo } = useUndoRedo();

  const handleUndo = async () => {
    console.log('[UNDO-BTN] Undo clicked, canUndo:', canUndo);
    await undo();
  };

  const handleRedo = async () => {
    console.log('[UNDO-BTN] Redo clicked, canRedo:', canRedo);
    await redo();
  };

  console.log('[UNDO-BTN] Render - canUndo:', canUndo, 'canRedo:', canRedo);

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            disabled={!canUndo}
            onClick={handleUndo}
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
            onClick={handleRedo}
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

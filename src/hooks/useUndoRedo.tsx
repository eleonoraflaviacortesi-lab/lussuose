import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface UndoAction {
  description: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

interface UndoRedoContextType {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  pushAction: (action: UndoAction) => void;
  undo: () => void;
  redo: () => void;
}

const UndoRedoContext = createContext<UndoRedoContextType>({
  canUndo: false,
  canRedo: false,
  undoLabel: null,
  redoLabel: null,
  pushAction: () => {},
  undo: () => {},
  redo: () => {},
});

const MAX_HISTORY = 30;

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [past, setPast] = useState<UndoAction[]>([]);
  const [future, setFuture] = useState<UndoAction[]>([]);

  const pushAction = useCallback((action: UndoAction) => {
    setPast(prev => [...prev.slice(-MAX_HISTORY + 1), action]);
    setFuture([]); // Clear redo stack on new action
  }, []);

  const undo = useCallback(async () => {
    if (past.length === 0) return;
    const action = past[past.length - 1];
    try {
      await action.undo();
      setPast(prev => prev.slice(0, -1));
      setFuture(prev => [action, ...prev]);
      toast({ title: `↩ Annullato: ${action.description}` });
    } catch {
      toast({ title: 'Errore nell\'annullare', variant: 'destructive' });
    }
  }, [past]);

  const redo = useCallback(async () => {
    if (future.length === 0) return;
    const action = future[0];
    try {
      await action.redo();
      setFuture(prev => prev.slice(1));
      setPast(prev => [...prev, action]);
      toast({ title: `↪ Ripristinato: ${action.description}` });
    } catch {
      toast({ title: 'Errore nel ripristinare', variant: 'destructive' });
    }
  }, [future]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <UndoRedoContext.Provider value={{
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      undoLabel: past.length > 0 ? past[past.length - 1].description : null,
      redoLabel: future.length > 0 ? future[0].description : null,
      pushAction,
      undo,
      redo,
    }}>
      {children}
    </UndoRedoContext.Provider>
  );
}

export const useUndoRedo = () => useContext(UndoRedoContext);

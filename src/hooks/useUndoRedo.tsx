import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
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
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

const UndoRedoContext = createContext<UndoRedoContextType>({
  canUndo: false,
  canRedo: false,
  undoLabel: null,
  redoLabel: null,
  pushAction: () => {},
  undo: async () => {},
  redo: async () => {},
});

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [past, setPast] = useState<UndoAction[]>([]);
  const [future, setFuture] = useState<UndoAction[]>([]);

  const pastRef = useRef<UndoAction[]>([]);
  const futureRef = useRef<UndoAction[]>([]);

  useEffect(() => { pastRef.current = past; }, [past]);
  useEffect(() => { futureRef.current = future; }, [future]);

  const pushAction = useCallback((action: UndoAction) => {
    setPast(prev => [...prev, action]);
    setFuture([]);
  }, []);

  const undo = useCallback(async () => {
    if (pastRef.current.length === 0) return;
    const currentPast = [...pastRef.current];
    const action = currentPast.pop()!;
    try {
      await action.undo();
      setPast(currentPast);
      setFuture(prev => [action, ...prev]);
      toast({ title: `↩ Annullato: ${action.description}` });
    } catch (e) {
      console.error('Undo failed:', e);
      toast({ title: 'Errore nell\'annullare', variant: 'destructive' });
    }
  }, []);

  const redo = useCallback(async () => {
    if (futureRef.current.length === 0) return;
    const currentFuture = [...futureRef.current];
    const action = currentFuture.shift()!;
    try {
      await action.redo();
      setFuture(currentFuture);
      setPast(prev => [...prev, action]);
      toast({ title: `↪ Ripristinato: ${action.description}` });
    } catch (e) {
      console.error('Redo failed:', e);
      toast({ title: 'Errore nel ripristinare', variant: 'destructive' });
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) { redo(); } else { undo(); }
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

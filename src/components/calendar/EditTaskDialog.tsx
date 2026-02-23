import { useState, useEffect } from 'react';
import { Pencil, Trash2, Check } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import MentionInput from '@/components/ui/mention-input';
import { useTasks, Task } from '@/hooks/useTasks';
import { useMentionNotifications } from '@/hooks/useMentionNotifications';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
};

const EditTaskDialog = ({ open, onOpenChange, task }: Props) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const { updateTask, deleteTask } = useTasks();
  const { sendMentionNotifications } = useMentionNotifications();

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setCompleted(task.completed || false);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) return;
    
    if (!title.trim()) {
      toast.error('Il titolo è obbligatorio');
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: title.trim(),
        notes: notes.trim() || undefined,
        completed,
      });

      // Send notifications to mentioned users
      if (notes.trim()) {
        await sendMentionNotifications(notes.trim(), {
          type: 'task',
          entityName: title.trim(),
          referenceId: task.id,
        });
      }
      
      triggerHaptic('success');
      toast.success('Task aggiornata');
      onOpenChange(false);
    } catch (error) {
      toast.error('Errore nell\'aggiornamento della task');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    try {
      await deleteTask.mutateAsync(task.id);
      triggerHaptic('warning');
      toast.success('Task eliminata');
      onOpenChange(false);
    } catch (error) {
      toast.error('Errore nell\'eliminazione della task');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-muted">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
              <Pencil className="w-5 h-5 text-background" />
            </div>
            <div className="text-left flex-1">
              <p className="text-xl font-bold">Modifica Task</p>
            </div>
            <button
              onClick={handleDelete}
              className="w-10 h-10 rounded-full bg-destructive/10 hover:bg-destructive hover:text-white flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="py-6 space-y-4">
          {/* Completed toggle */}
          <button
            type="button"
            onClick={() => { setCompleted(!completed); triggerHaptic('light'); }}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors",
              completed ? "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800" : "bg-muted/30 border-border"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              completed ? "bg-green-500 border-green-500" : "border-muted-foreground/40"
            )}>
              {completed && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className={cn(
              "text-sm font-medium",
              completed && "line-through text-muted-foreground"
            )}>
              {completed ? 'Completata' : 'Segna come completata'}
            </span>
          </button>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Titolo *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cosa devi fare?"
              className="text-base"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Note (opzionale)
            </label>
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="Aggiungi dettagli..."
              minHeight="100px"
            />
          </div>

          <button
            type="submit"
            disabled={updateTask.isPending || !title.trim()}
            className="w-full bg-foreground text-background py-4 rounded-xl font-medium text-sm tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {updateTask.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditTaskDialog;

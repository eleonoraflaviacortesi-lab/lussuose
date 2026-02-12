import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
};

const AddTaskDialog = ({ open, onOpenChange, date }: Props) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const { createTask } = useTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Il titolo è obbligatorio');
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        notes: notes.trim() || undefined,
        due_date: format(date, 'yyyy-MM-dd'),
      });
      
      triggerHaptic('success');
      toast.success('Task creata');
      setTitle('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Errore nella creazione della task');
    }
  };

  const handleClose = () => {
    setTitle('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-muted">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
              <Pencil className="w-5 h-5 text-background" />
            </div>
            <div className="text-left">
              <p className="text-xl font-bold">Nuova Task</p>
              <p className="text-sm text-muted-foreground font-normal">
                {format(date, 'd MMMM yyyy', { locale: it })}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="py-6 space-y-4">
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
            disabled={createTask.isPending || !title.trim()}
            className="w-full bg-foreground text-background py-4 rounded-xl font-medium text-sm tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {createTask.isPending ? 'Salvataggio...' : 'Crea Task'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddTaskDialog;

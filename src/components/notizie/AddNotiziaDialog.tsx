import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotizie, NotiziaStatus } from '@/hooks/useNotizie';

const pillInputClass = "w-full bg-white rounded-full px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20";
const pillTextareaClass = "w-full bg-white rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none";

const AddNotiziaDialog = () => {
  const { addNotizia } = useNotizie();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    zona: '',
    phone: '',
    type: '',
    notes: '',
    status: 'new' as NotiziaStatus,
    reminder_date: '',
    created_date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    addNotizia.mutate({
      name: formData.name,
      zona: formData.zona || undefined,
      phone: formData.phone || undefined,
      type: formData.type || undefined,
      notes: formData.notes || undefined,
      status: formData.status,
      reminder_date: formData.reminder_date || undefined,
      created_at: formData.created_date ? new Date(formData.created_date).toISOString() : undefined,
    });
    
    setFormData({
      name: '',
      zona: '',
      phone: '',
      type: '',
      notes: '',
      status: 'new',
      reminder_date: '',
      created_date: '',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Nuova notizia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-xl border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold tracking-wide uppercase">
            Aggiungi nuova notizia
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="name" className="text-sm font-medium mb-2 block">Nome proprietà *</Label>
            <input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Es: Villa Serenity"
              required
              className={pillInputClass}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="zona" className="text-sm font-medium mb-2 block">Zona</Label>
              <input
                id="zona"
                value={formData.zona}
                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                placeholder="Es: Umbertide"
                className={pillInputClass}
              />
            </div>
            <div>
              <Label htmlFor="type" className="text-sm font-medium mb-2 block">Tipo</Label>
              <input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Es: Casale"
                className={pillInputClass}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-sm font-medium mb-2 block">Telefono</Label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+39 333 1234567"
              className={pillInputClass}
            />
          </div>
          
          <div>
            <Label htmlFor="status" className="text-sm font-medium mb-2 block">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as NotiziaStatus })}
            >
              <SelectTrigger className="bg-white rounded-full px-4 py-3 h-auto text-sm shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="on_shot">On Shot</SelectItem>
                <SelectItem value="taken">Taken</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes" className="text-sm font-medium mb-2 block">Note</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Aggiungi note..."
              rows={3}
              className={pillTextareaClass}
            />
          </div>

          <div>
            <Label htmlFor="created_date" className="text-sm font-medium mb-2 block">Data creazione notizia</Label>
            <input
              id="created_date"
              type="date"
              value={formData.created_date}
              onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
              className={pillInputClass}
            />
          </div>
          
          <div>
            <Label htmlFor="reminder" className="text-sm font-medium mb-2 block">Promemoria</Label>
            <input
              id="reminder"
              type="datetime-local"
              value={formData.reminder_date}
              onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
              className={pillInputClass}
            />
          </div>
          
          <div className="flex justify-center gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="rounded-full px-6 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-0"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name.trim()}
              className="rounded-full px-6"
            >
              Aggiungi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNotiziaDialog;

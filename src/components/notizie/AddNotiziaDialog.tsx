import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotizie, NotiziaStatus } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';

const pillInputClass = "w-full bg-white rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20";
const pillTextareaClass = "w-full bg-white rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none";

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
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Nuova notizia
      </Button>

      {/* Liquid Glass Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Blur backdrop */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-md" />
          
          {/* Compact floating card */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 w-full max-w-sm",
              "bg-white/85 backdrop-blur-2xl",
              "rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]",
              "p-5 animate-in zoom-in-95 fade-in duration-200"
            )}
          >
            {/* Close button */}
            <button 
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <h3 className="text-center text-base font-bold tracking-wide uppercase mb-4">
              Nuova Notizia
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-xs font-medium mb-1.5 block">Nome proprietà *</Label>
                <input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Es: Villa Serenity"
                  required
                  className={pillInputClass}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="zona" className="text-xs font-medium mb-1.5 block">Zona</Label>
                  <input
                    id="zona"
                    value={formData.zona}
                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                    placeholder="Es: Umbertide"
                    className={pillInputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-xs font-medium mb-1.5 block">Tipo</Label>
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
                <Label htmlFor="phone" className="text-xs font-medium mb-1.5 block">Telefono</Label>
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
                <Label htmlFor="status" className="text-xs font-medium mb-1.5 block">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as NotiziaStatus })}
                >
                  <SelectTrigger className="bg-white rounded-full px-4 py-2.5 h-auto text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0">
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
                <Label htmlFor="notes" className="text-xs font-medium mb-1.5 block">Note</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Aggiungi note..."
                  rows={2}
                  className={pillTextareaClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="created_date" className="text-xs font-medium mb-1.5 block">Data notizia</Label>
                  <input
                    id="created_date"
                    type="date"
                    value={formData.created_date}
                    onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
                    className={pillInputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="reminder" className="text-xs font-medium mb-1.5 block">Promemoria</Label>
                  <input
                    id="reminder"
                    type="datetime-local"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    className={pillInputClass}
                  />
                </div>
              </div>
              
              <div className="flex justify-center gap-2 pt-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setOpen(false)}
                  className="rounded-full px-5 text-sm"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={!formData.name.trim()}
                  className="rounded-full px-5 text-sm"
                >
                  Aggiungi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddNotiziaDialog;

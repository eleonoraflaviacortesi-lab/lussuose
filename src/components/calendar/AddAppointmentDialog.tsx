import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppointments } from '@/hooks/useAppointments';
import { useClienti } from '@/hooks/useClienti';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date | null;
};

const AddAppointmentDialog = ({ open, onOpenChange, defaultDate }: Props) => {
  const { createAppointment } = useAppointments();
  const { clienti } = useClienti();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [clienteId, setClienteId] = useState<string>('');

  useEffect(() => {
    if (defaultDate) {
      setDate(format(defaultDate, 'yyyy-MM-dd'));
    }
  }, [defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !startTime || !endTime) return;

    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    createAppointment.mutate({
      title,
      description: description || null,
      start_time: startDateTime,
      end_time: endDateTime,
      location: location || null,
      cliente_id: clienteId || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setClienteId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nuovo Appuntamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1.5 block">
              Titolo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es: Visita immobile"
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1.5 block">
              Cliente Collegato
            </label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger className="bg-muted border-0 rounded-xl">
                <SelectValue placeholder="Seleziona cliente (opzionale)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nessun cliente</SelectItem>
                {clienti?.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1.5 block">
              Data *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1.5 block">
                Inizio *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1.5 block">
                Fine *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1.5 block">
              Luogo
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Es: Via Roma 1, Arezzo"
                className="w-full bg-muted rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1.5 block">
              Note
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aggiungi note..."
              rows={2}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createAppointment.isPending}
            className="w-full bg-foreground text-background py-3 rounded-xl font-medium text-sm tracking-wider uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createAppointment.isPending ? 'Salvataggio...' : 'Crea Appuntamento'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentDialog;

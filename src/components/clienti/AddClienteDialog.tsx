import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cliente } from '@/types';

interface AddClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (cliente: Partial<Cliente>) => Promise<void>;
  isLoading?: boolean;
}

const regioni = ['Tuscany', 'Umbria', 'Lazio', 'Liguria', 'Emilia-Romagna', 'Veneto', 'Lombardia', 'Piemonte'];
const tipologie = ['Farmhouse', 'Villa', 'Apartment', 'Town house', 'Castle', 'Other'];

export function AddClienteDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading,
}: AddClienteDialogProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telefono: '',
    email: '',
    paese: '',
    budget_max: '',
    regione: '',
    tipologia: '',
    descrizione: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onAdd({
      nome: formData.nome,
      telefono: formData.telefono || null,
      email: formData.email || null,
      paese: formData.paese || null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      regioni: formData.regione ? [formData.regione] : [],
      tipologia: formData.tipologia ? [formData.tipologia] : [],
      descrizione: formData.descrizione || null,
      status: 'new',
    });

    setFormData({
      nome: '',
      telefono: '',
      email: '',
      paese: '',
      budget_max: '',
      regione: '',
      tipologia: '',
      descrizione: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aggiungi Cliente Manualmente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="telefono">Telefono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+39..."
              />
            </div>
            <div>
              <Label htmlFor="paese">Paese</Label>
              <Input
                id="paese"
                value={formData.paese}
                onChange={e => setFormData({ ...formData, paese: e.target.value })}
                placeholder="es. Germany"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="budget">Budget Max (€)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget_max}
              onChange={e => setFormData({ ...formData, budget_max: e.target.value })}
              placeholder="600000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Regione</Label>
              <Select
                value={formData.regione}
                onValueChange={v => setFormData({ ...formData, regione: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  {regioni.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipologia</Label>
              <Select
                value={formData.tipologia}
                onValueChange={v => setFormData({ ...formData, tipologia: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  {tipologie.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descrizione">Note</Label>
            <Textarea
              id="descrizione"
              value={formData.descrizione}
              onChange={e => setFormData({ ...formData, descrizione: e.target.value })}
              placeholder="Informazioni aggiuntive..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!formData.nome || isLoading}>
              {isLoading ? 'Salvataggio...' : 'Aggiungi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddClienteDialog;

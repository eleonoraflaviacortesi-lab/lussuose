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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cliente } from '@/types';
import { MultiCheckboxField } from './MultiCheckboxField';
import {
  regioniOptions,
  tipologiaOptions,
  stileOptions,
  contestoOptions,
  motivoZonaOptions,
  haVisitatoOptions,
  mutuoOptions,
  vicinanzaCittaOptions,
  terrenoOptions,
  piscinaOptions,
  usoOptions,
  interesseAffittoOptions,
} from './clienteFormOptions';

interface AddClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (cliente: Partial<Cliente>) => Promise<void>;
  agents: Array<{ user_id: string; full_name: string; avatar_emoji: string }>;
  isLoading?: boolean;
}

interface FormData {
  nome: string;
  telefono: string;
  email: string;
  paese: string;
  budget_max: string;
  tempo_ricerca: string;
  ha_visitato: string;
  regioni: string[];
  mutuo: string;
  tipologia: string[];
  stile: string[];
  contesto: string[];
  vicinanza_citta: string;
  motivo_zona: string[];
  dimensioni: string;
  camere: string;
  terreno: string;
  piscina: string;
  uso: string;
  interesse_affitto: string;
  descrizione: string;
  assigned_to: string;
}

const initialFormData: FormData = {
  nome: '',
  telefono: '',
  email: '',
  paese: '',
  budget_max: '',
  tempo_ricerca: '',
  ha_visitato: '',
  regioni: [],
  mutuo: '',
  tipologia: [],
  stile: [],
  contesto: [],
  vicinanza_citta: '',
  motivo_zona: [],
  dimensioni: '',
  camere: '',
  terreno: '',
  piscina: '',
  uso: '',
  interesse_affitto: '',
  descrizione: '',
  assigned_to: '',
};

export function AddClienteDialog({
  open,
  onOpenChange,
  onAdd,
  agents,
  isLoading,
}: AddClienteDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onAdd({
      nome: formData.nome,
      telefono: formData.telefono || null,
      email: formData.email || null,
      paese: formData.paese || null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      tempo_ricerca: formData.tempo_ricerca || null,
      ha_visitato: formData.ha_visitato === 'yes',
      regioni: formData.regioni,
      mutuo: formData.mutuo || null,
      tipologia: formData.tipologia,
      stile: formData.stile.length > 0 ? formData.stile.join(', ') : null,
      contesto: formData.contesto,
      vicinanza_citta: formData.vicinanza_citta === 'yes',
      motivo_zona: formData.motivo_zona,
      dimensioni_min: formData.dimensioni ? parseInt(formData.dimensioni) : null,
      camere: formData.camere || null,
      terreno: formData.terreno || null,
      piscina: formData.piscina || null,
      uso: formData.uso || null,
      interesse_affitto: formData.interesse_affitto || null,
      descrizione: formData.descrizione || null,
      assigned_to: formData.assigned_to || null,
      status: 'new',
    });

    setFormData(initialFormData);
    onOpenChange(false);
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col rounded-2xl mx-4 sm:mx-auto">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle>Aggiungi Cliente Manualmente</DialogTitle>
        </DialogHeader>

        <form id="add-cliente-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 sm:space-y-6 pb-4 -mx-6 px-6">
            {/* Section 1: Contact Info */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informazioni Contatto
              </h3>
              
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={e => updateField('nome', e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={e => updateField('telefono', e.target.value)}
                    placeholder="+39..."
                  />
                </div>
                <div>
                  <Label htmlFor="paese">Paese</Label>
                  <Input
                    id="paese"
                    value={formData.paese}
                    onChange={e => updateField('paese', e.target.value)}
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
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Section 2: Search Status */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Stato Ricerca
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tempo_ricerca">Da quanto cerca?</Label>
                  <Input
                    id="tempo_ricerca"
                    value={formData.tempo_ricerca}
                    onChange={e => updateField('tempo_ricerca', e.target.value)}
                    placeholder="es. 2 months"
                  />
                </div>
                <div>
                  <Label>Ha già visitato immobili?</Label>
                  <Select
                    value={formData.ha_visitato}
                    onValueChange={v => updateField('ha_visitato', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      {haVisitatoOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="budget">Budget Max (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget_max}
                    onChange={e => updateField('budget_max', e.target.value)}
                    placeholder="600000"
                  />
                </div>
                <div>
                  <Label>Mutuo?</Label>
                  <Select
                    value={formData.mutuo}
                    onValueChange={v => updateField('mutuo', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      {mutuoOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 3: Location Preferences */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Preferenze Località
              </h3>

              <MultiCheckboxField
                label="Regioni di interesse"
                options={regioniOptions}
                selected={formData.regioni}
                onChange={v => updateField('regioni', v)}
              />

              <div>
                <Label>Vicinanza aeroporti/città importante?</Label>
                <Select
                  value={formData.vicinanza_citta}
                  onValueChange={v => updateField('vicinanza_citta', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    {vicinanzaCittaOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <MultiCheckboxField
                label="Motivo scelta zona"
                options={motivoZonaOptions}
                selected={formData.motivo_zona}
                onChange={v => updateField('motivo_zona', v)}
              />

              <MultiCheckboxField
                label="Contesto preferito"
                options={contestoOptions}
                selected={formData.contesto}
                onChange={v => updateField('contesto', v)}
              />
            </div>

            {/* Section 4: Property Preferences */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Preferenze Immobile
              </h3>

              <MultiCheckboxField
                label="Tipologia immobile"
                options={tipologiaOptions}
                selected={formData.tipologia}
                onChange={v => updateField('tipologia', v)}
              />

              <MultiCheckboxField
                label="Stile / Categoria"
                options={stileOptions}
                selected={formData.stile}
                onChange={v => updateField('stile', v)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dimensioni">Dimensioni (mq)</Label>
                  <Input
                    id="dimensioni"
                    value={formData.dimensioni}
                    onChange={e => updateField('dimensioni', e.target.value)}
                    placeholder="es. 200"
                  />
                </div>
                <div>
                  <Label htmlFor="camere">Camere da letto</Label>
                  <Input
                    id="camere"
                    value={formData.camere}
                    onChange={e => updateField('camere', e.target.value)}
                    placeholder="es. 3-4"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Outdoor Features */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Caratteristiche Esterne
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Terreno?</Label>
                  <Select
                    value={formData.terreno}
                    onValueChange={v => updateField('terreno', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      {terrenoOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Piscina?</Label>
                  <Select
                    value={formData.piscina}
                    onValueChange={v => updateField('piscina', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      {piscinaOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 6: Usage */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Utilizzo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Uso previsto</Label>
                  <Select
                    value={formData.uso}
                    onValueChange={v => updateField('uso', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      {usoOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interesse affitto?</Label>
                  <Select
                    value={formData.interesse_affitto}
                    onValueChange={v => updateField('interesse_affitto', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      {interesseAffittoOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 7: Assignment & Notes */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Assegnazione & Note
              </h3>

              <div>
                <Label>Assegna a</Label>
              <Select
                  value={formData.assigned_to || 'unassigned'}
                  onValueChange={v => updateField('assigned_to', v === 'unassigned' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non assegnato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assegnato</SelectItem>
                    {agents.map(a => (
                      <SelectItem key={a.user_id} value={a.user_id}>
                        <div className="flex items-center gap-2">
                          <span>{a.avatar_emoji}</span>
                          {a.full_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="descrizione">Note aggiuntive</Label>
                <Textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={e => updateField('descrizione', e.target.value)}
                  placeholder="Informazioni aggiuntive, preferenze specifiche..."
                  rows={3}
                />
              </div>
            </div>
          </form>

        <DialogFooter className="flex-shrink-0 border-t pt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Annulla
          </Button>
          <Button 
            type="submit" 
            form="add-cliente-form"
            disabled={!formData.nome || isLoading}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? 'Salvataggio...' : 'Aggiungi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddClienteDialog;

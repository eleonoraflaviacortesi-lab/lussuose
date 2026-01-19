import { useState } from 'react';
import { Calendar, Phone, Users, Building, Euro, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const DataEntry = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    contattiReali: 0,
    contattiIdeali: 25,
    notizieReali: 0,
    notizieIdeali: 3,
    clientiGestiti: 0,
    appVendita: 0,
    acquisizioni: 0,
    incarichiVendita: 0,
    venditeNumero: 0,
    venditeValore: 0,
    affittiNumero: 0,
    affittiValore: 0,
  });

  const handleChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    toast({
      title: 'Dati salvati',
      description: `I dati del ${new Date(date).toLocaleDateString('it-IT')} sono stati salvati con successo.`,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-accent" />
            <h1 className="font-serif text-xl font-semibold text-foreground">Inserimento Dati Giornalieri</h1>
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contatti & Notizie */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Phone className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-base font-semibold text-accent">Contatti & Notizie</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Contatti Reali</Label>
              <Input
                type="number"
                min={0}
                value={formData.contattiReali}
                onChange={(e) => handleChange('contattiReali', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Contatti Ideali</Label>
              <Input
                type="number"
                min={0}
                value={formData.contattiIdeali}
                onChange={(e) => handleChange('contattiIdeali', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Notizie Nuove Reali</Label>
              <Input
                type="number"
                min={0}
                value={formData.notizieReali}
                onChange={(e) => handleChange('notizieReali', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Notizie Nuove Ideali</Label>
              <Input
                type="number"
                min={0}
                value={formData.notizieIdeali}
                onChange={(e) => handleChange('notizieIdeali', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">Clienti Gestiti</Label>
            </div>
            <Input
              type="number"
              min={0}
              value={formData.clientiGestiti}
              onChange={(e) => handleChange('clientiGestiti', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground mt-1">Numero totale di clienti gestiti oggi.</p>
          </div>
        </div>

        {/* Appuntamenti */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-base font-semibold text-accent">Appuntamenti</h2>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">App. Vendita</Label>
            <Input
              type="number"
              min={0}
              value={formData.appVendita}
              onChange={(e) => handleChange('appVendita', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Incarichi & Acquisizioni */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-base font-semibold text-accent">Incarichi & Acquisizioni</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Acquisizioni</Label>
              <Input
                type="number"
                min={0}
                value={formData.acquisizioni}
                onChange={(e) => handleChange('acquisizioni', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Incarichi Vendita</Label>
              <Input
                type="number"
                min={0}
                value={formData.incarichiVendita}
                onChange={(e) => handleChange('incarichiVendita', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Chiusure & Fatturato */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Euro className="w-4 h-4 text-destructive" />
            <h2 className="font-serif text-base font-semibold text-destructive">Chiusure & Fatturato</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Vendite</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Numero</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.venditeNumero}
                    onChange={(e) => handleChange('venditeNumero', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valore (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.venditeValore}
                    onChange={(e) => handleChange('venditeValore', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Affitti</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Numero</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.affittiNumero}
                    onChange={(e) => handleChange('affittiNumero', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valore (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.affittiValore}
                    onChange={(e) => handleChange('affittiValore', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Save className="w-4 h-4" />
          Salva Dati Giornalieri
        </Button>
      </div>
    </div>
  );
};

export default DataEntry;

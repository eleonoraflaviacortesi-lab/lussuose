import { useState } from 'react';
import { Calendar, Phone, Users, Building, Euro, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDailyData, DailyDataInput } from '@/hooks/useDailyData';

const DataEntry = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    contatti_reali: 0,
    contatti_ideali: 25,
    notizie_reali: 0,
    notizie_ideali: 3,
    clienti_gestiti: 0,
    appuntamenti_vendita: 0,
    acquisizioni: 0,
    incarichi_vendita: 0,
    vendite_numero: 0,
    vendite_valore: 0,
    affitti_numero: 0,
    affitti_valore: 0,
  });

  const { saveDailyData } = useDailyData();

  const handleChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const input: DailyDataInput = {
      date,
      ...formData,
    };
    saveDailyData.mutate(input);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="bg-card rounded-xl border border-border p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-accent" />
            <h1 className="font-serif text-lg md:text-xl font-semibold text-foreground">Inserimento Dati Giornalieri</h1>
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Contatti & Notizie */}
        <div className="bg-card rounded-xl border border-border p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Phone className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-sm md:text-base font-semibold text-accent">Contatti & Notizie</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label className="text-xs md:text-sm text-muted-foreground">Contatti Reali</Label>
              <Input
                type="number"
                min={0}
                value={formData.contatti_reali}
                onChange={(e) => handleChange('contatti_reali', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs md:text-sm text-muted-foreground">Contatti Ideali</Label>
              <Input
                type="number"
                min={0}
                value={formData.contatti_ideali}
                onChange={(e) => handleChange('contatti_ideali', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs md:text-sm text-muted-foreground">Notizie Reali</Label>
              <Input
                type="number"
                min={0}
                value={formData.notizie_reali}
                onChange={(e) => handleChange('notizie_reali', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs md:text-sm text-muted-foreground">Notizie Ideali</Label>
              <Input
                type="number"
                min={0}
                value={formData.notizie_ideali}
                onChange={(e) => handleChange('notizie_ideali', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label className="text-xs md:text-sm text-muted-foreground">Clienti Gestiti</Label>
            </div>
            <Input
              type="number"
              min={0}
              value={formData.clienti_gestiti}
              onChange={(e) => handleChange('clienti_gestiti', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Appuntamenti */}
        <div className="bg-card rounded-xl border border-border p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Calendar className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-sm md:text-base font-semibold text-accent">Appuntamenti</h2>
          </div>
          <div>
            <Label className="text-xs md:text-sm text-muted-foreground">App. Vendita</Label>
            <Input
              type="number"
              min={0}
              value={formData.appuntamenti_vendita}
              onChange={(e) => handleChange('appuntamenti_vendita', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Incarichi & Acquisizioni */}
        <div className="bg-card rounded-xl border border-border p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Building className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-sm md:text-base font-semibold text-accent">Incarichi & Acquisizioni</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs md:text-sm text-muted-foreground">Acquisizioni</Label>
              <Input
                type="number"
                min={0}
                value={formData.acquisizioni}
                onChange={(e) => handleChange('acquisizioni', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs md:text-sm text-muted-foreground">Incarichi Vendita</Label>
              <Input
                type="number"
                min={0}
                value={formData.incarichi_vendita}
                onChange={(e) => handleChange('incarichi_vendita', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Chiusure & Fatturato */}
        <div className="bg-card rounded-xl border border-border p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Euro className="w-4 h-4 text-destructive" />
            <h2 className="font-serif text-sm md:text-base font-semibold text-destructive">Chiusure & Fatturato</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Vendite</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Numero</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.vendite_numero}
                    onChange={(e) => handleChange('vendite_numero', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valore (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.vendite_valore}
                    onChange={(e) => handleChange('vendite_valore', parseInt(e.target.value) || 0)}
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
                    value={formData.affitti_numero}
                    onChange={(e) => handleChange('affitti_numero', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valore (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.affitti_valore}
                    onChange={(e) => handleChange('affitti_valore', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-6 flex justify-end">
        <Button 
          onClick={handleSave} 
          className="w-full sm:w-auto gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={saveDailyData.isPending}
        >
          <Save className="w-4 h-4" />
          {saveDailyData.isPending ? 'Salvataggio...' : 'Salva Dati Giornalieri'}
        </Button>
      </div>
    </div>
  );
};

export default DataEntry;

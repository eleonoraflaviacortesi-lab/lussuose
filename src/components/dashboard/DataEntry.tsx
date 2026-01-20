import { useState } from 'react';
import { Calendar, Save } from 'lucide-react';
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
    nuove_trattative: 0,
    nuove_trattative_ideali: 2,
    trattative_chiuse: 0,
    trattative_chiuse_ideali: 1,
    fatturato_a_credito: 0,
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

  const inputFields = [
    { section: 'CONTATTI', fields: [
      { key: 'contatti_reali', label: 'Reali' },
      { key: 'contatti_ideali', label: 'Ideali' },
    ]},
    { section: 'NOTIZIE', fields: [
      { key: 'notizie_reali', label: 'Reali' },
      { key: 'notizie_ideali', label: 'Ideali' },
    ]},
    { section: 'ATTIVITÀ', fields: [
      { key: 'clienti_gestiti', label: 'Clienti' },
      { key: 'appuntamenti_vendita', label: 'Appuntamenti' },
    ]},
    { section: 'ACQUISIZIONI', fields: [
      { key: 'acquisizioni', label: 'Acquisizioni' },
      { key: 'incarichi_vendita', label: 'Incarichi' },
    ]},
  ];

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Date Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto text-center border-0 border-b border-border rounded-none bg-transparent text-sm"
          />
        </div>
      </div>

      {/* Input Sections */}
      <div className="space-y-6">
        {inputFields.map((section) => (
          <div key={section.section} className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
              {section.section}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <Label className="text-xs text-muted-foreground mb-2 block">{field.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => handleChange(field.key, parseInt(e.target.value) || 0)}
                    className="text-center text-lg font-light bg-background"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Chiusure */}
        <div className="dark-card">
          <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
            CHIUSURE
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-white mb-3">Vendite</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Numero</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.vendite_numero}
                    onChange={(e) => handleChange('vendite_numero', parseInt(e.target.value) || 0)}
                    className="mt-1 bg-white/10 border-white/20 text-white text-center"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valore €</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.vendite_valore}
                    onChange={(e) => handleChange('vendite_valore', parseInt(e.target.value) || 0)}
                    className="mt-1 bg-white/10 border-white/20 text-white text-center"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-3">Affitti</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Numero</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.affitti_numero}
                    onChange={(e) => handleChange('affitti_numero', parseInt(e.target.value) || 0)}
                    className="mt-1 bg-white/10 border-white/20 text-white text-center"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valore €</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.affitti_valore}
                    onChange={(e) => handleChange('affitti_valore', parseInt(e.target.value) || 0)}
                    className="mt-1 bg-white/10 border-white/20 text-white text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8">
        <button 
          onClick={handleSave} 
          className="btn-pink w-full flex items-center justify-center gap-3"
          disabled={saveDailyData.isPending}
        >
          <Save className="w-4 h-4" />
          <span className="text-sm tracking-[0.2em]">
            {saveDailyData.isPending ? 'SALVATAGGIO...' : 'SALVA DATI'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DataEntry;
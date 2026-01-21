import { useMemo } from 'react';

const quotes = [
  { text: "Respira. Sei esattamente dove devi essere.", author: "" },
  { text: "Non devi avere tutte le risposte. Solo il prossimo passo.", author: "" },
  { text: "Rallenta. La fretta non ti porta dove pensi.", author: "" },
  { text: "Quello che resisti, persiste. Quello che accetti, si trasforma.", author: "Carl Jung" },
  { text: "Tra stimolo e risposta c'è uno spazio. In quello spazio c'è la tua libertà.", author: "Viktor Frankl" },
  { text: "Non sei i tuoi pensieri. Sei chi li osserva.", author: "" },
  { text: "Il presente è l'unico momento che esiste davvero.", author: "" },
  { text: "Lascia andare ciò che non puoi controllare.", author: "" },
  { text: "La gentilezza verso te stesso non è un lusso.", author: "" },
  { text: "Ogni incontro è un'occasione per essere presente.", author: "" },
  { text: "Non cercare di essere perfetto. Cerca di essere vero.", author: "" },
  { text: "Il silenzio tra le parole dice più delle parole stesse.", author: "" },
  { text: "Ascolta più di quanto parli. Imparerai cose che non sapevi di non sapere.", author: "" },
  { text: "La pazienza non è passività. È fiducia nel processo.", author: "" },
  { text: "Ciò che dai attenzione, cresce.", author: "" },
  { text: "Non devi dimostrare niente a nessuno. Neanche a te stesso.", author: "" },
  { text: "Fai spazio al dubbio. Le certezze chiudono le porte.", author: "" },
  { text: "Il riposo non è una ricompensa. È un diritto.", author: "" },
  { text: "Prima di reagire, fermati. Un respiro cambia tutto.", author: "" },
  { text: "Le piccole cose non sono piccole.", author: "" },
  { text: "Non confondere l'urgente con l'importante.", author: "" },
  { text: "Ogni persona che incontri sta combattendo una battaglia che non conosci.", author: "" },
  { text: "Il vero ascolto richiede che tu metta da parte la tua agenda.", author: "" },
  { text: "Non devi capire tutto per andare avanti.", author: "" },
  { text: "La vulnerabilità non è debolezza. È coraggio.", author: "Brené Brown" },
  { text: "Stai facendo meglio di quanto pensi.", author: "" },
  { text: "L'acqua che scorre non ha fretta, ma arriva al mare.", author: "" },
  { text: "Smetti di aspettare il momento giusto. È questo.", author: "" },
  { text: "Chi sei quando nessuno ti guarda?", author: "" },
  { text: "Le radici crescono nel buio. È normale non vedere subito i risultati.", author: "" },
  { text: "Non tutto ciò che conta può essere contato.", author: "" },
];

const DailyQuote = () => {
  const todayQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return quotes[dayOfYear % quotes.length];
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 mb-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
      <div className="relative">
        <p className="text-base leading-relaxed text-foreground/90">
          {todayQuote.text}
        </p>
        {todayQuote.author && (
          <p className="mt-2 text-sm text-muted-foreground">
            — {todayQuote.author}
          </p>
        )}
      </div>
    </div>
  );
};

export default DailyQuote;

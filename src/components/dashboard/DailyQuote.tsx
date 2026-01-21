import { useMemo } from 'react';

const quotes = [
  { text: "Il successo è la somma di piccoli sforzi ripetuti giorno dopo giorno.", author: "Robert Collier" },
  { text: "Non aspettare. Il momento perfetto non arriverà mai.", author: "Napoleon Hill" },
  { text: "Ogni giorno è una nuova opportunità per cambiare la tua vita.", author: "Anonimo" },
  { text: "La disciplina è il ponte tra obiettivi e risultati.", author: "Jim Rohn" },
  { text: "Il tuo unico limite è la tua mente.", author: "Anonimo" },
  { text: "Credi in te stesso e tutto sarà possibile.", author: "Anonimo" },
  { text: "L'energia che porti è l'energia che attrai.", author: "Anonimo" },
  { text: "Ogni chiamata è un'opportunità, ogni no ti avvicina a un sì.", author: "Anonimo" },
  { text: "La costanza batte il talento quando il talento non è costante.", author: "Anonimo" },
  { text: "Oggi è il giorno giusto per fare qualcosa di straordinario.", author: "Anonimo" },
  { text: "La vera ricchezza è aiutare gli altri a realizzare i loro sogni.", author: "Anonimo" },
  { text: "Non contare i giorni, fai che i giorni contino.", author: "Muhammad Ali" },
  { text: "Il modo per iniziare è smettere di parlare e iniziare a fare.", author: "Walt Disney" },
  { text: "Sii il cambiamento che vuoi vedere nel mondo.", author: "Gandhi" },
  { text: "La perseveranza non è una lunga corsa, ma tante brevi corse.", author: "Walter Elliot" },
  { text: "Ogni esperto era una volta un principiante.", author: "Helen Hayes" },
  { text: "Il successo non è definitivo, il fallimento non è fatale.", author: "Winston Churchill" },
  { text: "Fai oggi quello che altri non vogliono, domani vivrai come altri non possono.", author: "Les Brown" },
  { text: "La qualità non è un atto, è un'abitudine.", author: "Aristotele" },
  { text: "Non è mai troppo tardi per essere ciò che avresti potuto essere.", author: "George Eliot" },
  { text: "Il futuro appartiene a chi crede nella bellezza dei propri sogni.", author: "Eleanor Roosevelt" },
  { text: "Lavora in silenzio, lascia che il successo faccia rumore.", author: "Anonimo" },
  { text: "Ogni mattina porta nuove speranze e nuove opportunità.", author: "Anonimo" },
  { text: "La gratitudine trasforma ciò che abbiamo in abbastanza.", author: "Anonimo" },
  { text: "Sii così bravo che non possano ignorarti.", author: "Steve Martin" },
  { text: "L'unico modo per fare un ottimo lavoro è amare quello che fai.", author: "Steve Jobs" },
  { text: "Non smettere mai di imparare, perché la vita non smette mai di insegnare.", author: "Anonimo" },
  { text: "Il coraggio non è l'assenza di paura, ma agire nonostante essa.", author: "Nelson Mandela" },
  { text: "Ogni giorno fai qualcosa che ti spaventa.", author: "Eleanor Roosevelt" },
  { text: "La semplicità è la sofisticazione suprema.", author: "Leonardo da Vinci" },
  { text: "Trasforma i tuoi sogni in piani e i tuoi piani in realtà.", author: "Anonimo" },
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
        <p className="text-base leading-relaxed text-foreground/90 italic">
          "{todayQuote.text}"
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          — {todayQuote.author}
        </p>
      </div>
    </div>
  );
};

export default DailyQuote;

import { useMemo } from 'react';

const quotes = [
  { text: "The obstacle is the way.", author: "Ryan Holiday" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "Between stimulus and response there is a space.", author: "Viktor Frankl" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "The quality of your life is the quality of your questions.", author: "Tony Robbins" },
  { text: "What we resist, persists.", author: "Carl Jung" },
  { text: "You are not your thoughts.", author: "Eckhart Tolle" },
  { text: "The map is not the territory.", author: "Alfred Korzybski" },
  { text: "How we spend our days is how we spend our lives.", author: "Annie Dillard" },
  { text: "The only way out is through.", author: "Robert Frost" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "He who has a why can bear almost any how.", author: "Nietzsche" },
  { text: "The wound is the place where the light enters you.", author: "Rumi" },
  { text: "Everything can be taken from a man but one thing: to choose one's attitude.", author: "Viktor Frankl" },
  { text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" },
  { text: "In the middle of difficulty lies opportunity.", author: "Einstein" },
  { text: "What you are aware of, you are in control of.", author: "Anthony de Mello" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "We don't see things as they are, we see them as we are.", author: "Anaïs Nin" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Emerson" },
  { text: "No tree can grow to heaven unless its roots reach down to hell.", author: "Carl Jung" },
  { text: "The meaning of life is to find your gift. The purpose is to give it away.", author: "Picasso" },
  { text: "What is not started today is never finished tomorrow.", author: "Goethe" },
  { text: "One day or day one. You decide.", author: "Paulo Coelho" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "Until you make the unconscious conscious, it will direct your life.", author: "Carl Jung" },
  { text: "Where attention goes, energy flows.", author: "James Redfield" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "The present moment is the only moment available to us.", author: "Thich Nhat Hanh" },
  { text: "What consumes your mind, controls your life.", author: "Stoic proverb" },
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
    <div className="py-6 text-center">
      <p className="text-[13px] tracking-wide text-foreground/80 italic font-light leading-relaxed">
        "{todayQuote.text}"
      </p>
      <p className="mt-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
        — {todayQuote.author}
      </p>
    </div>
  );
};

export default DailyQuote;

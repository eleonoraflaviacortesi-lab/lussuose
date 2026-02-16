import { useMemo } from 'react';

const MOON_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

function getMoonPhase(date: Date): number {
  // Known new moon: Jan 6, 2000
  const known = new Date(2000, 0, 6).getTime();
  const diff = date.getTime() - known;
  const days = diff / (1000 * 60 * 60 * 24);
  const cycle = 29.53058770576;
  const phase = ((days % cycle) + cycle) % cycle;
  return Math.round(phase / cycle * 8) % 8;
}

export function MoonPhaseIndicator() {
  const emoji = useMemo(() => MOON_EMOJIS[getMoonPhase(new Date())], []);

  return (
    <div className="fixed bottom-[8.5rem] left-4 z-40">
      <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-xl shadow-lg flex items-center justify-center text-lg select-none">
        {emoji}
      </div>
    </div>
  );
}

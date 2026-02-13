

## Fix: Barra di navigazione non visibile su iPhone

### Problema
La nav bar ha una posizione fissa a `top: 85px`, ma l'header su iPhone include il "safe area inset" (circa 47-59px per il notch/Dynamic Island). Questo rende l'header molto piu' alto e la nav bar finisce nascosta dietro di esso.

### Soluzione
Usare `calc()` con `env(safe-area-inset-top)` nel posizionamento della nav bar, cosi' si adatta automaticamente a qualsiasi dispositivo.

### Dettagli tecnici

**File: `src/components/layout/Navigation.tsx`**
- Cambiare `top-[85px]` in uno stile inline che usa `calc(85px + env(safe-area-inset-top))` per compensare dinamicamente il safe area di iPhone

**File: `src/pages/Index.tsx`**
- Aggiornare lo spacer `h-[175px]` per includere anche il safe-area-inset-top, usando uno stile inline con `calc(175px + env(safe-area-inset-top))`

**File: `src/index.css`**
- Rimuovere `padding: env(safe-area-inset-top) ...` dall'elemento `html` che potrebbe causare conflitti con il layout fisso (l'header gestisce gia' il safe area internamente)


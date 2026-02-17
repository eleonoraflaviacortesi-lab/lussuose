

## Tre nuove feature mistiche

### 1. Breath Pulse sulle card urgenti del calendario

Le card segnate come "urgent" nel calendario avranno un'animazione lentissima di ombra che si espande e contrae ogni 4-5 secondi, quasi impercettibile.

**File: `tailwind.config.ts`**
- Aggiunta keyframe `breath-pulse`: ombra che oscilla tra `box-shadow` minimo e leggermente espanso su ciclo di 5 secondi
- Aggiunta classe `animate-breath-pulse`

**File: `src/components/calendar/CalendarPage.tsx`** (2 punti: riga ~1384 e ~1537)
- Sostituzione di `event.urgent && "ring-2 ring-red-500"` con `event.urgent && "ring-2 ring-red-500 animate-breath-pulse"`

**File: `src/components/calendar/CalendarDayView.tsx`** (riga ~191)
- Stessa aggiunta di `animate-breath-pulse` sulle card urgenti

---

### 2. Indicatore fase lunare reale

Un piccolo indicatore della fase lunare calcolata in tempo reale, posizionato in basso a sinistra accanto alla campanella notifiche.

**File: `src/components/layout/MoonPhaseIndicator.tsx`** (nuovo)
- Componente che calcola la fase lunare reale usando l'algoritmo di John Conway (basato sulla data corrente)
- Mostra l'emoji lunare corrispondente (da 🌑 a 🌘, 8 fasi)
- Stile: cerchietto bianco/glass con backdrop-blur, dimensione simile alla campanella (~w-10 h-10)
- Posizionato fixed, sopra la campanella (`bottom-[8.5rem] left-4`)

**File: `src/pages/Index.tsx`**
- Import e rendering del componente `MoonPhaseIndicator`

---

### 3. Pulsante campanella con starburst

Il pulsante della campanella notifiche avra lo stesso sfondo a punte (starburst) bianco con ombra, come l'indicatore attivo della navigazione.

**File: `src/components/layout/NotificationBell.tsx`**
- Sostituzione del `rounded-full bg-white/80` con un contenitore `relative` che include lo stesso SVG starburst a 16 punte usato nella navigazione
- L'SVG bianco con `drop-shadow` sostituisce il cerchio liscio attuale
- L'icona Bell resta sopra (z-10)
- Dimensione starburst: ~48px per coprire il bottone

### Dettagli tecnici

**Keyframe breath-pulse (tailwind.config.ts):**
```
"breath-pulse": {
  "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.3)" },
  "50%": { boxShadow: "0 0 12px 4px rgba(239, 68, 68, 0.15)" }
}
```
Durata: 5s, iterazione infinita, ease-in-out.

**Algoritmo fase lunare:**
Calcolo basato sul ciclo sinodico di 29.53 giorni a partire da una luna nuova nota (es. 6 gennaio 2000). Il risultato mappa su 8 fasi con emoji corrispondente.

**Starburst campanella:**
Stesso SVG `<polygon>` a 16 punte con raggi alternati 50/35, fill bianco, `filter: drop-shadow(0 3px 6px rgba(0,0,0,0.18))`.

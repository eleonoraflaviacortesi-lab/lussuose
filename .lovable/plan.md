

# Piano: Miglioramenti Generali dell'App

## 1. Performance - Ticker Header ottimizzato

**Problema**: Il ticker nel header duplica il contenuto 8 volte (`[...Array(8)]`), creando 16 elementi DOM inutili.

**Soluzione**: Ridurre a 3 copie (il minimo per un loop fluido senza vuoti visibili) e aggiungere `will-change: transform` solo via CSS (gia presente).

**File**: `src/components/layout/Header.tsx`

---

## 2. Performance - Pull-to-refresh mirato

**Problema**: `queryClient.invalidateQueries()` senza filtri invalida TUTTE le query cached, causando ricaricamenti inutili (es. profili, colonne kanban, settings).

**Soluzione**: Invalidare solo le query relative ai dati che cambiano frequentemente:
- `tasks`, `notizie`, `clienti`, `appointments`, `daily-data`, `kpis`, `weekly-goals`, `notifications`

**File**: `src/pages/Index.tsx`

---

## 3. Accessibilita - aria-label sui bottoni icona

**Problema**: I bottoni con sole icone (profilo, logout, navigazione, notification bell) non hanno `aria-label`, rendendo l'app inaccessibile a screen reader.

**Soluzione**: Aggiungere `aria-label` a:
- Bottone profilo nel Header
- Bottone logout nel Header
- Ogni tab nella Navigation
- Bottone campana notifiche

**File**: `src/components/layout/Header.tsx`, `src/components/layout/Navigation.tsx`, `src/components/layout/NotificationBell.tsx`

---

## 4. UX - Feedback tattile su azioni completate

**Problema**: Azioni come completare un task, spostare un evento, o salvare un report non danno feedback tattile di conferma.

**Soluzione**: Aggiungere `triggerHaptic('success')` dopo:
- Completamento task nel calendario
- Completamento obiettivo settimanale
- Salvataggio report giornaliero (bottone "CICLO PRODUTTIVO" -> completato)

**File**: `src/components/calendar/CalendarPage.tsx`, `src/components/dashboard/WeeklyGoalsWidget.tsx`

---

## 5. UX - Transizione fluida tra tab

**Problema**: Il cambio tab e istantaneo senza transizione, risultando brusco.

**Soluzione**: Aggiungere una micro-animazione fade-in al contenuto quando si cambia tab, usando la classe `animate-fade-in` gia definita nel design system. Wrappare il `renderContent()` con una key basata su `activeTab` per triggerare il re-mount con animazione.

**File**: `src/pages/Index.tsx`

---

## 6. iOS - Prevenire bounce su scroll

**Problema**: Su iOS Safari, lo scroll oltre i limiti causa un "rubber band" effect che puo confondere con il pull-to-refresh.

**Soluzione**: Aggiungere `overscroll-behavior: none` al body quando il pull-to-refresh e attivo, e `overscroll-behavior-y: contain` al container principale.

**File**: `src/index.css`

---

## 7. Code Quality - Funzione isDarkColor duplicata

**Problema**: La funzione `isDarkColor` e copiata identica in 3 file: `CalendarPage.tsx`, `TodayRemindersWidget.tsx`, e probabilmente altri.

**Soluzione**: Estrarla in `src/lib/utils.ts` e importarla ovunque serve.

**File**: `src/lib/utils.ts`, `src/components/calendar/CalendarPage.tsx`, `src/components/clienti/TodayRemindersWidget.tsx`

---

## Riepilogo modifiche

| File | Tipo | Modifica |
|------|------|----------|
| `src/components/layout/Header.tsx` | Perf + A11y | Ridurre ticker copies, aggiungere aria-label |
| `src/pages/Index.tsx` | Perf + UX | Invalidation mirata, transizione tab |
| `src/components/layout/Navigation.tsx` | A11y | aria-label su tab |
| `src/components/layout/NotificationBell.tsx` | A11y | aria-label su campana |
| `src/components/calendar/CalendarPage.tsx` | UX + DRY | Haptic feedback, importare isDarkColor |
| `src/components/dashboard/WeeklyGoalsWidget.tsx` | UX | Haptic su completamento |
| `src/components/dashboard/TodayRemindersWidget.tsx` | DRY | Importare isDarkColor |
| `src/lib/utils.ts` | DRY | Aggiungere isDarkColor |
| `src/index.css` | iOS | overscroll-behavior |

Nessuna modifica al database. Nessuna nuova dipendenza.


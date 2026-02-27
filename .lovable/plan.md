

## Analisi: problemi identificati nell'app

### 1. Rating Seller: loop di stato che annulla l'aggiornamento istantaneo
**File**: `src/components/notizie/NotiziaDetail.tsx` (linea 184)  
**Problema**: Il `useEffect([notizia])` re-inizializza TUTTO `editData` ogni volta che l'oggetto `notizia` cambia referenza (cosa che succede ad ogni optimistic update). Quindi: click stella → `setEditData` → `mutate` con optimistic update → `notizia` cambia referenza → `useEffect` sovrascrive `editData` col valore vecchio → flash visivo.  
**Fix**: Cambiare la dependency da `[notizia]` a `[notizia?.id]` per re-inizializzare solo quando si apre un'altra notizia.

### 2. CalendarPage: useEffect di sync creano loop infinito
**File**: `src/components/calendar/CalendarPage.tsx` (linee 466-480)  
**Problema**: I due `useEffect` aggiunti per sincronizzare `selectedCliente` e `selectedNotizia` con la cache creano un loop: optimistic update → cache cambia → `useEffect` aggiorna lo stato locale → re-render → e il confronto `latest !== selectedCliente` è sempre true perché sono oggetti diversi.  
**Fix**: Rimuovere entrambi i `useEffect`. L'optimistic update locale (`setSelectedCliente(prev => ({...prev, ...updates}))`) è già sufficiente.

### 3. Rating Seller: debounce pendente sovrascrive il rating
**File**: `src/components/notizie/NotiziaDetail.tsx` (linea 369-373)  
**Problema**: Se l'utente modifica un campo di testo e poi subito clicca una stella, il `setTimeout` di 100ms in `updateAndSave` o il debounce pendente in `triggerAutoSave` potrebbe sovrascrivere il rating con dati stale.  
**Fix**: Nella onChange del rating, aggiungere `clearTimeout(saveTimeoutRef.current)` prima della mutazione diretta.

---

## Piano di implementazione

### Step 1 — Fix NotiziaDetail useEffect dependency
In `src/components/notizie/NotiziaDetail.tsx`, linea 204:
- Cambiare `}, [notizia]);` in `}, [notizia?.id]);`

### Step 2 — Fix NotiziaDetail rating: cancella debounce pendente
In `src/components/notizie/NotiziaDetail.tsx`, linee 369-374, nella onChange del rating aggiungere:
```tsx
onChange={(val) => {
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  setEditData(prev => ({ ...prev, rating: val }));
  if (notizia) {
    updateNotizia.mutate({ id: notizia.id, rating: val, silent: true });
  }
}}
```

### Step 3 — Rimuovere i useEffect di sync in CalendarPage
In `src/components/calendar/CalendarPage.tsx`, rimuovere le linee 465-480 (i due `useEffect` che sincronizzano `selectedCliente` e `selectedNotizia` dalla cache).

Mantenere la riga 1618 (`setSelectedCliente(prev => ...)`) che fa il patch locale immediato per il buyer.


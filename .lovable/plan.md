

# Fix: Widget "INCARICHI TEAM" deve mostrare solo il mese corrente

## Problema
Il widget "INCARICHI TEAM" in fondo alla dashboard usa `kpis?.incarichi?.value` che proviene da `useKPIs('year')`, sommando tutti gli incarichi da gennaio 2026. Siamo a febbraio, quindi i 3 incarichi di gennaio vengono contati erroneamente.

## Soluzione
Calcolare gli incarichi team separatamente, filtrando `allData` solo per il mese corrente (come fa gia `IncarchiWidget` per i dati personali).

## Modifica

**File: `src/components/dashboard/PersonalDashboard.tsx`**

Aggiungere un calcolo dedicato per gli incarichi team del mese corrente usando `allData` da `useDailyData()` (che gia include i dati di tutto il team per la stessa sede):

```typescript
const incarichiTeam = useMemo(() => {
  if (!allData) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return allData
    .filter(d => new Date(d.date) >= startOfMonth)
    .reduce((acc, d) => acc + (d.incarichi_vendita || 0), 0);
}, [allData]);
```

Questo richiede di importare `allData` da `useDailyData()` (attualmente importa solo `myData`). Verra anche aggiornato il titolo del widget per chiarire che e mensile.

## Riepilogo

| File | Modifica |
|------|----------|
| `src/components/dashboard/PersonalDashboard.tsx` | Destrutturare `allData` da `useDailyData()`, calcolare incarichi team mensili, rimuovere dipendenza da `kpis.incarichi` |

Nessuna modifica al database.

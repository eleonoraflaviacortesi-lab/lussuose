

## Rendere il Ref. ben visibile nei risultati di ricerca

Il riferimento attualmente usa `text-[10px]` grigio chiaro, praticamente invisibile. Lo renderemo prominente con un badge colorato sopra il titolo.

### Modifica

Nel file `src/components/clienti/PropertyMatchesSection.tsx` (riga 491-493), sostituire lo span del ref_number con un badge ben visibile:

- Sfondo nero con testo bianco, font mono, grassetto
- Dimensione `text-xs` (non 10px)
- Padding e bordi arrotondati per creare un badge pill
- Posizionato sopra il titolo come elemento distinto

```tsx
{result.ref_number && (
  <span className="inline-block font-mono text-xs font-bold bg-black text-white px-2 py-0.5 rounded-full mb-1">
    {result.ref_number}
  </span>
)}
```


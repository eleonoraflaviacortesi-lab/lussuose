

# Nebbia Oscura Arcana al Triple-Tap del Logo

Sostituire i coriandoli con un effetto di **nebbia oscura** che si espande dallo schermo, come un incantesimo arcano.

## Cosa cambia

Il triple-tap sul logo non lancera' piu' coriandoli (`canvas-confetti`), ma attivera' un **overlay canvas a schermo intero** con nebbia scura animata:

- **Nubi di fumo viola/indaco** che si espandono dal centro dello schermo
- **Bagliori mistici** (lampi viola pallido) che pulsano attraverso la nebbia
- **Dissolvenza lenta** (~3-4 secondi) che avvolge lo schermo e poi svanisce gradualmente
- Palette: nero, viola profondo (#1E1B4B), indaco (#312E81), ciano scuro (#164E63)

## Come funziona tecnicamente

1. **Nuovo file `src/lib/arcaneFog.ts`** - Contiene la funzione `triggerArcaneFog()` che:
   - Crea un canvas temporaneo a schermo intero (z-index alto, pointer-events: none)
   - Disegna 15-20 cerchi sfumati (radial gradient) con posizioni casuali che si espandono
   - Aggiunge 2-3 "lampi" viola che appaiono e scompaiono rapidamente
   - Dopo ~3.5 secondi, dissolve tutto e rimuove il canvas dal DOM

2. **Modifica `src/components/layout/Header.tsx`** - Sostituisce la chiamata a `celebrateGasiAbbestia()` con `triggerArcaneFog()`

3. **Nessuna modifica a `src/lib/confetti.ts`** - Le altre celebrazioni (report, obiettivi) restano invariate

## File coinvolti

| File | Modifica |
|------|----------|
| `src/lib/arcaneFog.ts` | **Nuovo** - Effetto nebbia oscura su canvas |
| `src/components/layout/Header.tsx` | Sostituire import e chiamata da confetti a arcaneFog |



# Piano: Nuovo Colore di Sfondo

## Obiettivo
Sostituire il colore di sfondo attuale (bianco puro `0 0% 100%`) con il grigio caldo/beige mostrato nello screenshot.

## Analisi Colore
Il colore nell'immagine è un **grigio caldo** con una leggera sfumatura taupe/beige:
- **HEX**: circa `#E5E2DF`
- **HSL**: `30 8% 89%` (tonalità calda, bassa saturazione, alta luminosità)

## Modifiche Necessarie

### File: `src/index.css`

Aggiornare le seguenti variabili CSS nella sezione `:root`:

| Variabile | Valore Attuale | Nuovo Valore |
|-----------|---------------|--------------|
| `--background` | `0 0% 100%` | `30 8% 89%` |
| `--dashboard-bg` | `0 0% 95%` | `30 8% 87%` |
| `--muted` | `0 0% 94%` | `30 6% 85%` |
| `--secondary` | `0 0% 96%` | `30 6% 92%` |

Le card (`--card`) rimarranno bianche per creare contrasto e profondità con lo sfondo.

## Elementi Interessati
- Sfondo principale dell'app
- Dashboard background
- Elementi muted/secondary
- La pagina di login

## Note
- Il colore mantiene la coerenza con lo stile luxury/minimal esistente
- Le card bianche risalteranno meglio su questo sfondo caldo
- Il contrasto con il testo nero rimane eccellente per la leggibilità

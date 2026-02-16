
# Spreadsheet View Enhancements

## Overview
Aggiungere una barra di editing stile Google Sheets, numeri di riga, possibilita di spostare righe tramite drag-and-drop, intestazione fissa durante lo scorrimento, e opzioni per cambiare colore di sfondo e testo delle righe.

## What Changes

### 1. Editing Toolbar (barra superiore stile Google Sheets)
Una barra fissa sopra la tabella con:
- **Bold / Italic / Strikethrough** toggle per il testo della cella selezionata (visuale, non persistente -- applicato al livello riga)
- **Colore sfondo riga** (paint bucket icon) -- apre un color picker per impostare il colore di sfondo della riga selezionata
- **Colore testo riga** (font color icon) -- apre un color picker per cambiare il colore del testo della riga selezionata
- Indicatore della cella/riga selezionata (es. "Row 5 - Mario Rossi")

I colori riga/testo verranno salvati nel database (campi `row_bg_color` e `row_text_color` sulla tabella `clienti`).

### 2. Numeri di riga
Gia presenti ma verranno resi piu evidenti con styling migliorato, numeri sequenziali fissi nella colonna sinistra.

### 3. Drag-and-drop per spostare righe
Aggiungere un handle di trascinamento (grip icon) nella colonna dei numeri di riga. Utilizzo della libreria `@hello-pangea/dnd` (gia installata) per permettere il riordino delle righe.

### 4. Intestazione sempre visibile
Gia implementata con `sticky top-0`, verra verificata e migliorata per funzionare correttamente anche con la nuova toolbar.

### 5. Colore riga e testo
- Click su una riga per selezionarla
- Dalla toolbar, scegliere colore sfondo o colore testo
- I colori vengono persistiti nel DB e applicati visivamente

---

## Technical Details

### Database Migration
```sql
ALTER TABLE public.clienti 
ADD COLUMN IF NOT EXISTS row_bg_color text,
ADD COLUMN IF NOT EXISTS row_text_color text;
```

### Type Update (`src/types/index.ts`)
Aggiungere `row_bg_color: string | null` e `row_text_color: string | null` all'interfaccia `Cliente`.

### Component Changes (`src/components/clienti/ClientiSheetView.tsx`)

1. **State**: aggiungere `selectedRowId` per tracciare la riga selezionata
2. **Toolbar component** (`SheetToolbar`): barra sopra la tabella con:
   - Label riga selezionata
   - Bottone colore sfondo (con popover color picker)
   - Bottone colore testo (con popover color picker)
3. **Drag-and-drop**: wrappare le righe con `DragDropContext` e `Droppable`/`Draggable` da `@hello-pangea/dnd`
4. **Row styling**: applicare `style={{ backgroundColor, color }}` dalle proprietà `row_bg_color` / `row_text_color` di ogni cliente
5. **Row selection**: click sulla riga la evidenzia con un bordo/sfondo di selezione

### Color Picker
Utilizzare il componente `color-picker-overlay` o `liquid-glass-color-picker` gia presente nel progetto, oppure un semplice set di colori predefiniti in un Popover (piu leggero e in linea con lo stile Google Sheets).

### File modificati
- `supabase/migrations/` -- nuova migration per `row_bg_color`, `row_text_color`
- `src/types/index.ts` -- aggiunta campi
- `src/components/clienti/ClientiSheetView.tsx` -- toolbar, drag-and-drop, selezione riga, colori

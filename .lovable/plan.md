
# Piano: Aggiunta Task al Calendario

## Panoramica
Aggiungere un nuovo tipo di elemento "Task" al calendario, distinto dagli appuntamenti. Le task avranno:
- Titolo e note
- Checkbox per segnare come completata
- Stile visivo bianco con bordo nero (come i Buyer)
- Etichetta "TASK" e emoji matita (✏️)

## Modifiche da Implementare

### 1. Database - Nuova Tabella `tasks`
Creare una tabella dedicata per le task con i seguenti campi:
- `id` (UUID, primary key)
- `user_id` (UUID, riferimento all'utente)
- `title` (TEXT, obbligatorio)
- `notes` (TEXT, opzionale)
- `due_date` (DATE, data della task)
- `completed` (BOOLEAN, default false)
- `display_order` (INTEGER, per ordinamento)
- `created_at` / `updated_at` (TIMESTAMP)

RLS policies per garantire che ogni utente veda solo le proprie task.

### 2. Hook `useTasks`
Nuovo hook React Query per gestire le task:
- Query per recuperare le task dell'utente
- Mutation per creare, aggiornare, eliminare task
- Mutation per toggle completamento (con optimistic update)

### 3. Aggiornamenti al Calendario

**CalendarPage.tsx:**
- Aggiungere `task` al type `CalendarEvent`
- Integrare le task nel calcolo `eventsByDay`
- Le task appariranno con:
  - Sfondo bianco, bordo nero
  - Badge "TASK" in alto a destra
  - Emoji ✏️ come indicatore visivo
  - Checkbox per completamento

**AddToCalendarMenu.tsx:**
- Aggiungere opzione "Task" nel menu di aggiunta
- Nuova sezione con form semplice (titolo + note)

**CalendarDayView.tsx:**
- Supporto per visualizzazione e interazione con le task
- Checkbox funzionante per completamento

### 4. Nuovi Componenti

**AddTaskDialog.tsx:**
Form semplice per creare una nuova task:
- Campo titolo (obbligatorio)
- Campo note (opzionale, textarea)
- Data pre-selezionata dal giorno scelto

**TaskDetailSheet.tsx:** (opzionale)
- Vista dettaglio per modificare titolo/note
- Eliminazione task

## Visual Design

```text
┌──────────────────────────┐
│  ✏️ Titolo della task    │  ← Badge "TASK"
│  □ ← checkbox            │
│                          │
│  📝 Note (se presenti)   │
└──────────────────────────┘

Stile: bg-white, border border-foreground (nero)
Badge: bg-foreground text-background, testo "TASK"
```

## Flusso Utente
1. Utente clicca "Aggiungi" su un giorno
2. Appare menu con opzioni: Buyer, Seller, **Task**
3. Seleziona "Task" → form con titolo + note
4. Task appare nel calendario con stile bianco/nero
5. Click sulla checkbox → segna come completata (strikethrough)

## Dettagli Tecnici

**Schema SQL:**
```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" 
  ON public.tasks FOR ALL 
  USING (auth.uid() = user_id);
```

**CalendarEvent type aggiornato:**
```typescript
export type CalendarEvent = {
  id: string;
  title: string;
  type: 'appointment' | 'cliente_reminder' | 'notizia_reminder' | 'task';
  // ... altri campi esistenti
  notes?: string; // Per le task
};
```

## File da Modificare/Creare
| File | Azione |
|------|--------|
| `supabase/migrations/...` | Nuova migrazione per tabella `tasks` |
| `src/hooks/useTasks.ts` | **Nuovo** - Hook per gestione task |
| `src/components/calendar/AddTaskDialog.tsx` | **Nuovo** - Dialog creazione task |
| `src/components/calendar/CalendarPage.tsx` | Aggiungere supporto task |
| `src/components/calendar/AddToCalendarMenu.tsx` | Aggiungere opzione "Task" |
| `src/components/calendar/CalendarDayView.tsx` | Supporto visualizzazione task |

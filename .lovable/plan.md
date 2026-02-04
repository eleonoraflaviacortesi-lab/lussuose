
# Piano: Aggiunta Task al Calendario - ✅ COMPLETATO

## Panoramica
Aggiunto un nuovo tipo di elemento "Task" al calendario, distinto dagli appuntamenti. Le task hanno:
- Titolo e note
- Checkbox per segnare come completata
- Stile visivo bianco con bordo nero (come i Buyer)
- Etichetta "TASK" e emoji matita (✏️)

## Modifiche Implementate

### 1. ✅ Database - Nuova Tabella `tasks`
Creata tabella dedicata per le task con:
- `id` (UUID, primary key)
- `user_id` (UUID, riferimento all'utente)
- `title` (TEXT, obbligatorio)
- `notes` (TEXT, opzionale)
- `due_date` (DATE, data della task)
- `completed` (BOOLEAN, default false)
- `display_order` (INTEGER, per ordinamento)
- `created_at` / `updated_at` (TIMESTAMP)

RLS policies per garantire che ogni utente veda solo le proprie task.

### 2. ✅ Hook `useTasks`
Nuovo hook React Query per gestire le task:
- Query per recuperare le task dell'utente
- Mutation per creare, aggiornare, eliminare task
- Mutation per toggle completamento (con optimistic update)

### 3. ✅ Aggiornamenti al Calendario

**CalendarPage.tsx:**
- Aggiunto `task` al type `CalendarEvent`
- Integrate le task nel calcolo `eventsByDay`
- Le task appaiono con:
  - Sfondo bianco, bordo nero
  - Badge "TASK" in alto a destra
  - Emoji ✏️ come indicatore visivo
  - Checkbox per completamento

**AddToCalendarMenu.tsx:**
- Aggiunta opzione "Task" nel menu di aggiunta

**CalendarDayView.tsx:**
- Supporto per visualizzazione e interazione con le task
- Checkbox funzionante per completamento
- Visualizzazione note

### 4. ✅ Nuovi Componenti

**AddTaskDialog.tsx:**
Form semplice per creare una nuova task:
- Campo titolo (obbligatorio)
- Campo note (opzionale, textarea)
- Data pre-selezionata dal giorno scelto

## File Creati/Modificati
| File | Azione |
|------|--------|
| `supabase/migrations/...` | ✅ Nuova migrazione per tabella `tasks` |
| `src/hooks/useTasks.ts` | ✅ **Nuovo** - Hook per gestione task |
| `src/components/calendar/AddTaskDialog.tsx` | ✅ **Nuovo** - Dialog creazione task |
| `src/components/calendar/CalendarPage.tsx` | ✅ Aggiunto supporto task |
| `src/components/calendar/AddToCalendarMenu.tsx` | ✅ Aggiunta opzione "Task" |
| `src/components/calendar/CalendarDayView.tsx` | ✅ Supporto visualizzazione task |

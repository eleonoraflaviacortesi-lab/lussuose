

# Piano: Riordino Eventi nel Calendario

## Obiettivo
Permettere agli utenti di riordinare gli eventi (task, buyer, seller) all'interno dello stesso giorno tramite drag-and-drop, salvando l'ordine personalizzato nel database.

## Situazione Attuale
- Il drag-and-drop tra giorni diversi funziona già
- Il riordino nello stesso giorno è attualmente un "no-op" (righe 776-780 di CalendarPage.tsx)
- Tutte le entità hanno già un campo `display_order` nel database:
  - `tasks.display_order`
  - `notizie.display_order`  
  - `clienti.display_order`

## Implementazione

### 1. Aggiungere funzione di riordino batch negli hooks

**useTasks.ts** - Nuova mutation `reorderTasks`:
```text
- Accetta un array di { id, display_order }
- Aggiorna il display_order per ogni task
- Usa optimistic update per feedback immediato
```

**useNotizie.ts** - Nuova mutation `reorderNotizie`:
```text
- Stessa logica per le notizie/seller
```

**useClienti.ts** - Nuova mutation `reorderClienti`:
```text
- Stessa logica per i buyer
```

### 2. Modificare handleDragEnd in CalendarPage.tsx

Quando `destination.droppableId === source.droppableId` (stesso giorno):

```text
1. Ottenere la lista degli eventi del giorno
2. Rimuovere l'evento dalla posizione source.index
3. Inserirlo nella posizione destination.index
4. Calcolare i nuovi display_order per ogni evento
5. Raggruppare gli eventi per tipo (task, notizia, cliente)
6. Chiamare le rispettive mutation di riordino
```

### 3. Logica di calcolo ordine

```text
Per ogni evento riordinato:
- nuovo display_order = indice nella lista * 10
  (moltiplicando per 10 si lascia spazio per inserimenti futuri)
```

## Dettagli Tecnici

### Struttura della funzione reorderEvents

```typescript
const reorderEvents = (dayKey: string, sourceIndex: number, destIndex: number) => {
  const events = eventsByDay.get(dayKey) || [];
  const draggableEvents = events.filter(e => 
    e.type === 'notizia_reminder' || 
    e.type === 'cliente_reminder' || 
    e.type === 'task'
  );
  
  // Riordina array
  const [removed] = draggableEvents.splice(sourceIndex, 1);
  draggableEvents.splice(destIndex, 0, removed);
  
  // Calcola nuovi ordini e raggruppa per tipo
  const taskUpdates = [];
  const notiziaUpdates = [];
  const clienteUpdates = [];
  
  draggableEvents.forEach((event, index) => {
    const newOrder = index * 10;
    if (event.type === 'task' && event.taskId) {
      taskUpdates.push({ id: event.taskId, display_order: newOrder });
    } else if (event.type === 'notizia_reminder' && event.notiziaId) {
      notiziaUpdates.push({ id: event.notiziaId, display_order: newOrder });
    } else if (event.type === 'cliente_reminder' && event.clienteId) {
      clienteUpdates.push({ id: event.clienteId, display_order: newOrder });
    }
  });
  
  // Batch updates
  if (taskUpdates.length) reorderTasks.mutate(taskUpdates);
  if (notiziaUpdates.length) reorderNotizie.mutate(notiziaUpdates);
  if (clienteUpdates.length) reorderClienti.mutate(clienteUpdates);
};
```

## File da Modificare

| File | Modifica |
|------|----------|
| `src/hooks/useTasks.ts` | Aggiungere mutation `reorderTasks` |
| `src/hooks/useNotizie.ts` | Aggiungere mutation `reorderNotizie` |
| `src/hooks/useClienti.ts` | Aggiungere mutation `reorderClienti` |
| `src/components/calendar/CalendarPage.tsx` | Implementare logica riordino in `handleDragEnd` |

## Comportamento Atteso

1. **Trascinamento stesso giorno**: L'evento viene spostato nella nuova posizione, l'ordine viene salvato
2. **Trascinamento altro giorno**: Comportamento esistente (cambia data)
3. **Feedback visivo**: Optimistic update per risposta immediata
4. **Persistenza**: L'ordine viene mantenuto tra le sessioni




## Fix: Sincronizzare i colori delle card nel widget promemoria con quelli del calendario

### Problema
Il widget "Oggi, X promemoria" nella dashboard usa il colore dello **status della colonna Kanban** (`getStatusColor`), mentre nel calendario i colori sono personalizzati dall'utente e salvati in **localStorage** (`calendar_event_colors`). I due sistemi non comunicano, quindi i colori non coincidono.

### Soluzione
Leggere i colori personalizzati da `localStorage` (`calendar_event_colors`) nel `TodayRemindersWidget` e usarli come override. Se esiste un colore personalizzato per un evento, quello ha la priorità; altrimenti si usa il colore dello status Kanban come fallback.

### Modifiche

**`src/components/dashboard/TodayRemindersWidget.tsx`**

1. Leggere `calendar_event_colors` da localStorage all'interno del componente
2. Per ogni reminder, costruire lo stesso `eventId` usato nel calendario (`cliente-{id}` / `notizia-{id}`) e cercare un override
3. Aggiungere un campo `cardColor` ai reminder che ha priorità su `statusColor` nel rendering

La logica degli eventId nel calendario è:
- Clienti: `cliente-{cliente.id}`
- Notizie: `notizia-{notizia.id}`

Questi coincidono già con gli `id` costruiti nel widget (`cliente-${cliente.id}`, `notizia-${notizia.id}`), quindi basta fare un lookup diretto.

Nel rendering, la riga `style` cambierà da:
```tsx
style={!isBuyer ? { backgroundColor: reminder.statusColor } : undefined}
```
a:
```tsx
style={{ backgroundColor: reminder.cardColor || (isBuyer ? undefined : reminder.statusColor) }}
```

E i buyer con un colore calendario personalizzato mostreranno quel colore invece dello sfondo neutro.



# Piano di Implementazione: Activity Log, Reminder e PDF Export

## Panoramica

Implementeremo tre funzionalità critiche per il modulo Clienti:

1. **Storico Attività (Activity Log)** - Timeline di tutte le interazioni
2. **Reminder/Follow-up Automatici** - Sistema promemoria con integrazione Google Calendar
3. **Export PDF Cliente** - Report scaricabile con tutti i dati

---

## 1. Storico Attività Cliente (Activity Log)

### Cosa faremo
Creare un sistema che traccia automaticamente ogni interazione con il cliente, mostrando una timeline visuale nella scheda cliente.

### Tipi di attività tracciate
- Chiamate effettuate
- Email inviate
- Visite/appuntamenti
- Proposte immobiliari inviate
- Cambi di stato
- Assegnazione agente
- Commenti aggiunti

### Database
Nuova tabella `cliente_activities`:
```
- id (uuid)
- cliente_id (uuid, FK)
- activity_type: 'call' | 'email' | 'visit' | 'proposal' | 'status_change' | 'assignment' | 'comment'
- title (testo breve)
- description (dettagli opzionali)
- property_id (uuid, opzionale - per proposte)
- created_by (uuid - autore)
- created_at (timestamp)
```

### Interfaccia
- Nuova sezione "Storico" nella scheda cliente (tab o accordion)
- Timeline verticale con icone colorate per tipo
- Quick-action buttons per registrare chiamate/email
- Ogni attività mostra: data, tipo, autore, descrizione

---

## 2. Sistema Reminder/Follow-up

### Cosa faremo
Aggiungere un campo `reminder_date` ai clienti con:
- Data picker per impostare promemoria
- Notifiche automatiche quando scade
- Integrazione con Google Calendar (già presente in `lib/googleCalendar.ts`)
- Badge visivo sui clienti con reminder imminenti

### Database
Nuove colonne su `clienti`:
```
- reminder_date (timestamp)
- last_contact_date (timestamp - ultimo contatto)
```

### Logica automatica
- Quando si registra un'attività (chiamata/email/visita), aggiorna `last_contact_date`
- Alert visivo se cliente non contattato da X giorni (configurabile)
- Notifica push all'agente quando scade reminder

### Interfaccia
- Sezione "Promemoria" nella scheda cliente
- Chip/badge sulla card Kanban per reminder imminenti
- Pulsante "Aggiungi a Google Calendar"
- Indicatore "Cliente fermo da X giorni"

---

## 3. Export PDF Cliente

### Cosa faremo
Generare un PDF professionale con tutti i dati del cliente, utile per meeting e condivisione.

### Contenuto del PDF
1. **Header**: Nome cliente, paese, emoji, data generazione
2. **Dati personali**: Telefono, email, paese
3. **Preferenze ricerca**: Budget, regioni, tipologie, caratteristiche
4. **Storico attività**: Ultime 10 interazioni
5. **Proposte immobiliari**: Proprietà suggerite con reazioni

### Implementazione
- Libreria `jsPDF` + `html2canvas` per generazione client-side
- Pulsante "Scarica PDF" nella scheda cliente
- Template stilizzato con logo e colori aziendali

---

## File da Creare/Modificare

### Nuovi File
| File | Descrizione |
|------|-------------|
| `src/components/clienti/ActivityLog.tsx` | Componente timeline attività |
| `src/components/clienti/ActivityQuickActions.tsx` | Bottoni rapidi per registrare attività |
| `src/components/clienti/ClienteReminder.tsx` | Sezione promemoria con calendar |
| `src/components/clienti/ClientePDFExport.tsx` | Generatore PDF |
| `src/hooks/useClienteActivities.ts` | Hook per CRUD attività |
| `src/lib/generateClientePDF.ts` | Utility per generazione PDF |

### File da Modificare
| File | Modifiche |
|------|-----------|
| `src/types/index.ts` | Aggiungere tipi Activity, reminder |
| `src/components/clienti/ClienteDetail.tsx` | Integrare ActivityLog, Reminder, PDF export |
| `src/components/clienti/ClienteCard.tsx` | Mostrare badge reminder |
| `src/hooks/useClienti.ts` | Aggiungere funzioni reminder |
| `src/lib/googleCalendar.ts` | Nuova funzione per clienti |

### Migrazione Database
```sql
-- Tabella attività
CREATE TABLE cliente_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clienti(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_id UUID REFERENCES properties(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Colonne reminder su clienti
ALTER TABLE clienti ADD COLUMN reminder_date TIMESTAMPTZ;
ALTER TABLE clienti ADD COLUMN last_contact_date TIMESTAMPTZ;

-- RLS policies
```

---

## Dipendenze da Installare
```
jspdf
```

---

## Dettagli Tecnici

### Activity Log - Registrazione Automatica
Le attività verranno create automaticamente quando:
- Si invia una proposta (click su "Proposta inviata")
- Si cambia lo status del cliente
- Si assegna un agente
- Si aggiunge un commento

Le attività manuali (chiamate, email, visite) si registrano con quick-action buttons.

### Reminder - Notifiche
Sfrutteremo il sistema notifiche esistente (`notifications` table):
- Edge function schedulata o check client-side al login
- Crea notifica quando `reminder_date` è oggi/passato
- Deep link alla scheda cliente

### PDF - Struttura
```typescript
// Sezioni del PDF
1. Intestazione con logo
2. Dati anagrafici (2 colonne)
3. Preferenze immobiliari (lista formattata)
4. Timeline attività (tabella)
5. Proposte con reazioni (griglia)
```

---

## Ordine di Implementazione

1. **Migrazione DB** - Creare tabella activities + colonne reminder
2. **Hook useClienteActivities** - CRUD attività
3. **ActivityLog + QuickActions** - UI timeline
4. **ClienteReminder** - UI promemoria + Google Calendar
5. **PDF Export** - Generazione documento
6. **Integrazioni** - Badge su card, notifiche automatiche

---

## Stima Tempo
- Activity Log: ~40% del lavoro
- Reminder System: ~35% del lavoro
- PDF Export: ~25% del lavoro



# Piano: Riunioni Settimanali secondo Modello Base

## Panoramica
Ristrutturazione della pagina Riunioni per allinearla al modello "Riunione del Lunedì tutti insieme" con 7 sezioni specifiche. Funzionalità semplice: ricerca e collegamento a notizie/buyers esistenti, senza alcun collegamento agli status delle notizie.

## Le 7 Sezioni della Riunione (dal PDF)
1. **Trattative in corso** - cerca notizia + agente + buyer (selezionabile o testo libero)
2. **Trattative chiuse** - cerca notizia + agente + buyer
3. **Incarichi presi settimana scorsa** - cerca notizia + agente
4. **Incarichi nel mirino per settimana prossima** - cerca notizia + agente
5. **Acquirenti caldi** - cerca buyer + agente
6. **Incarichi da ribassare** - cerca notizia + agente
7. **Obiettivo settimana** - testo + agente assegnato (visibile in Home)

---

## Modifiche Tecniche

### 1. Migrazione Database
Aggiungere campo `buyer_name` per testo libero nelle trattative:

```sql
ALTER TABLE meeting_items ADD COLUMN buyer_name TEXT;

-- Aggiorna constraint item_type per i nuovi tipi
ALTER TABLE meeting_items DROP CONSTRAINT IF EXISTS meeting_items_item_type_check;
ALTER TABLE meeting_items ADD CONSTRAINT meeting_items_item_type_check 
CHECK (item_type IN (
  'trattativa_corso', 'trattativa_chiusa', 
  'incarico_preso', 'incarico_mirino', 
  'acquirente_caldo', 'incarico_ribasso', 
  'obiettivo'
));
```

### 2. Aggiornamento Tipi in useMeetings.ts
Nuovi tipi sezione che riflettono le 7 sezioni del PDF, con `buyer_name` opzionale.

### 3. Nuova Pagina MeetingDetail.tsx
Layout verticale a sezioni invece di tabs, ogni sezione con:
- Titolo con emoji
- Lista items esistenti
- Pulsante "Aggiungi" per coordinatori

### 4. Aggiornamento AddMeetingItemDialog.tsx
Form dinamico basato sul tipo di sezione:

| Sezione | Notizia | Buyer | Buyer Testo | Agente |
|---------|---------|-------|-------------|--------|
| Trattativa in corso | Sì | Sì (opz.) | Sì | Sì |
| Trattativa chiusa | Sì | Sì (opz.) | Sì | Sì |
| Incarico preso | Sì | No | No | Sì |
| Incarico mirino | Sì | No | No | Sì |
| Acquirente caldo | No | Sì | No | Sì |
| Incarico ribasso | Sì | No | No | Sì |
| Obiettivo | No | No | No | Sì (obblig.) |

### 5. Widget Obiettivi nella Home
Nuovo componente `WeeklyGoalsWidget.tsx`:
- Mostra solo obiettivi assegnati all'utente corrente
- Dalla riunione della settimana in corso
- Click per segnare completato → animazione "GASI ABBESTIA!"

### 6. Animazione "GASI ABBESTIA!"
- Nuova funzione `celebrateGasiAbbestia()` in confetti.ts
- Componente overlay con scritta grande animata
- Durata 3 secondi, zoom-in + fade-out

---

## File da Modificare/Creare

| File | Azione |
|------|--------|
| `supabase/migrations/` | Aggiungere buyer_name, aggiornare constraint |
| `src/hooks/useMeetings.ts` | Nuovi tipi, hook per obiettivi utente |
| `src/components/meetings/MeetingDetail.tsx` | Rifare con layout sezioni verticali |
| `src/components/meetings/AddMeetingItemDialog.tsx` | Form dinamico per sezione |
| `src/components/dashboard/WeeklyGoalsWidget.tsx` | **NUOVO** |
| `src/components/dashboard/PersonalDashboard.tsx` | Aggiungere widget |
| `src/components/ui/gasi-celebration.tsx` | **NUOVO** - Overlay celebrazione |
| `src/lib/confetti.ts` | Aggiungere `celebrateGasiAbbestia` |

---

## Logica Campi per Sezione

**Trattative (in corso/chiuse):**
- Ricerca notizia → collegamento a `linked_notizia_id`
- Ricerca buyer → se trovato, `linked_cliente_id`; altrimenti testo libero in `buyer_name`
- Assegnazione agente → `assigned_to`

**Incarichi (preso/mirino/ribasso):**
- Solo ricerca notizia → `linked_notizia_id`
- Assegnazione agente → `assigned_to`

**Acquirenti caldi:**
- Solo ricerca buyer → `linked_cliente_id`
- Assegnazione agente → `assigned_to`

**Obiettivo settimana:**
- Testo libero come titolo
- Assegnazione agente obbligatoria → `assigned_to`
- Visibile nella Home dell'agente assegnato

---

## Flusso Celebrazione Obiettivo

1. Utente vede obiettivo nel widget Home
2. Click su "Segna completato"
3. Chiamata `updateItem` con status: 'completed'
4. Al successo:
   - `celebrateGasiAbbestia()` → fuochi artificiali esplosivi
   - Overlay "GASI ABBESTIA!" al centro schermo
   - Dopo 3 sec, overlay scompare con fade
5. Widget si aggiorna con spunta verde

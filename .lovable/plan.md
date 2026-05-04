## Plan: Export Excel completo per Buyers

Attualmente l'export Excel della pagina Buyers (`ClientiPage.tsx`) include solo 15 colonne base. Va esteso a **tutti i campi** dell'interfaccia `Cliente` (visibili nel dettaglio cliente).

### Modifica

**File**: `src/components/clienti/ClientiPage.tsx` — funzione `handleExportExcel` (righe 192–215).

Aggiungere tutte le colonne mancanti dal tipo `Cliente` (definito in `src/types/index.ts`):

**Anagrafica & contatto**: nome, cognome, telefono, email, paese, lingua, rating

**Budget & ricerca**: budget_max, mutuo, tempo_ricerca, ha_visitato, interesse_affitto, uso

**Localizzazione**: regioni, vicinanza_citta, motivo_zona

**Proprietà desiderata**: tipologia, stile, contesto, dimensioni_min, dimensioni_max, camere, bagni, layout, dependance, terreno, piscina

**Riferimento immobile**: portale, property_name, ref_number

**Gestione lead**: status, contattato_da, tipo_contatto, assigned_to, sede, emoji, reminder_date, last_contact_date

**Note & meta**: descrizione, note_extra, tally_submission_id, data_submission, created_at, updated_at

**Trasformazioni necessarie** nel `.map()`:
- Array (`regioni`, `motivo_zona`, `tipologia`, `contesto`) → join con `, `
- Booleani (`ha_visitato`, `vicinanza_citta`) → `'Sì' / 'No'`
- Restanti campi passano diretti (numeri/stringhe/date)

I campi `comments`, `card_color`, `row_bg_color`, `row_text_color`, `display_order` vengono esclusi (metadati UI non utili in export).

Nessun'altra modifica: il pulsante, l'utility `exportToExcel`, e il flusso restano invariati.

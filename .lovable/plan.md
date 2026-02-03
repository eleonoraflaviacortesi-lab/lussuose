
# Piano: Importazione Notizie Excel per DALILA

## Panoramica
Importazione di **17 notizie** dal file Excel nel sistema, raggruppate per zona e con tutti i dati preservati.

## Analisi Dati Excel

Il file contiene notizie immobiliari con queste informazioni:

| # | Nome | Zona | Tel | Data | Status suggerito |
|---|------|------|-----|------|------------------|
| 1 | IL CASALE | Cortona | 0575 612531 | 03/12/2025 | no |
| 2 | POGGIOBELLO | Cortona | 3334937894 | 03/12/2025 | no |
| 3 | PODERE LA VECCHIA FORNACE | Cortona | 0575 601359 | 03/12/2025 | in_progress |
| 4 | LA MUCCHIA | Cortona | 335 8097912 | 03/12/2025 | done |
| 5 | IL GRIFONE A CORTONA | Cortona | 3474865489 | 04/12/2025 | in_progress |
| 6 | IL CASALE DI LEDA | Cortona | 0575 603230 | 04/12/2025 | no |
| 7 | FATTORIA BORGONUOVO | Cortona | 348 047 0286 | 04/12/2025 | in_progress |
| 8 | RELAIS VILLA PETRISCHIO | Cortona | 0575 610316 | 05/12/2025 | no |
| 9 | HOTEL NUOVO CENTRALE | Camucia | 0575 630578 | 06/12/2025 | in_progress |
| 10 | VILLA SANTA MARGHERITA | Cortona | 0575 082440 | 11/12/2025 | in_progress |
| 11 | SOMMAVILLA | Cortona | 335436174 | 13/12/2025 | in_progress |
| 12 | VILLA GLORIA | Cortona | 0575 690037 | 16/12/2025 | done |
| 13 | PILARI | Cortona | 0575 619231 | 16/12/2025 | done |
| 14 | LE MACINE | Cortona | 0575 616018 | 17/12/2025 | done |
| 15 | L'ETRUSCA | Cortona | 0575 691006 | 17/12/2025 | done |
| 16 | VILLA GIARRADEA | Cortona | 3398258670 | 23/01/2025 | in_progress |
| 17 | RISTORANTE LA PIEVE VECCHIA | Monterchi | 0575 709053 | 24/01/2025 | in_progress |

## Raggruppamento per Zona (Somiglianza)

- **Cortona**: 15 notizie (ordine cronologico)
- **Camucia**: 1 notizia
- **Monterchi**: 1 notizia

## Mappatura Dati

Ogni notizia avrà tutti i dati consolidati nelle note:

```text
📋 INFORMATORE: [nome informatore]
📞 FONTE: [fonte chiamata]
📝 AZIONE: [azione corrente]
🔗 LINK: [link proprietà]

--- STORICO ---
▸ STEP 1: [testo]
▸ STEP 2: [testo]
▸ STEP 3: [testo]
▸ STEP 4: [testo]

--- NOTE ORIGINALI ---
[note notizia]
```

## Implementazione Tecnica

### 1. Creare Script di Import Specifico
Nuovo file `src/lib/importDalilaNotizie.ts`:
- Converte i dati Excel in formato `NotiziaInput`
- Mappa status in base alla colonna AZIONE
- Consolida tutte le info nelle note

### 2. Logica di Mappatura Status
| AZIONE nel file | Status nel sistema |
|-----------------|-------------------|
| "Non richiamare!" | `no` |
| "Per adesso non vende" | `no` |
| "Non più interessata" | `no` |
| "Sviluppato --> All'asta" | `no` |
| "App. fissato" | `done` |
| "Sviluppare" | `in_progress` |
| "Da richiamare" / "Attendere" | `in_progress` |
| Altro | `new` |

### 3. Componente Import One-Click
Aggiungere pulsante nella pagina Notizie per l'import diretto dell'account DALILA.

## Dati Preservati
✅ Nome proprietà
✅ Zona geografica
✅ Numero telefono (anche multipli)
✅ Data notizia originale
✅ Note complete
✅ Informatore
✅ Fonte chiamata
✅ Link proprietà
✅ Storico azioni (Step 1-4)
✅ Status derivato dall'azione

## Nessuna Modifica al Database
L'importazione usa i campi esistenti:
- `name`: nome proprietà
- `zona`: zona geografica
- `phone`: telefono
- `notes`: tutte le info consolidate
- `status`: derivato da AZIONE
- `created_at`: data notizia originale

## Verifica Post-Import
Dopo l'importazione, le 17 notizie appariranno nella Kanban di DALILA raggruppate per status, con tutti i dettagli nelle note di ogni card.

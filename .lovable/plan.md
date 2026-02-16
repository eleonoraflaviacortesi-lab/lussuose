

# Riorganizzazione della scheda dettaglio Cliente

## Problema attuale
Le informazioni sono distribuite in 3 colonne ma con raggruppamenti poco intuitivi. Ad esempio, "Tracking CRM" interrompe il flusso dei dati personali, "Budget" e "Tempistiche" sono separati da sezioni non correlate, e "Utilizzo" e "Descrizione" sono isolati in fondo alla terza colonna.

## Nuova organizzazione proposta

La logica di riorganizzazione segue il flusso mentale dell'agente: **Chi e --> Cosa cerca --> Come agire**.

### Colonna 1 - "CHI E' + OPERATIVITA'"
Tutto cio' che serve per capire il buyer e agire immediatamente:
1. **Note** (invariato, resta in cima)
2. **Assegnazione agente** (invariato)
3. **Dati Personali** (spostati qui dalla col.2): Cognome, Paese, Lingua, Telefono, Email, Data richiesta
4. **Tracking CRM** (spostato subito sotto i dati personali, stessa card): Portale, Proprieta' richiesta, Ref, Contattato da, Tipo contatto, Associa a Richiesta
5. **Azioni Rapide** (invariato): Chiama, Promemoria, Scarica PDF
6. **Storico Attivita'** + commenti (invariato)

### Colonna 2 - "COSA CERCA"
Tutti i criteri di ricerca raggruppati per tema:
1. **Budget e Finanziamento** (spostato in cima): Budget massimo, Mutuo
2. **Tipologia Immobile**: Tipo, Stile, Camere, Bagni, Layout, Dimensioni min/max
3. **Caratteristiche Extra**: Piscina, Terreno, Dependance
4. **Localita' Preferite**: Regioni, Contesto, Motivo zona, Vicinanza citta'

### Colonna 3 - "CONTESTO + PROPRIETA'"
Informazioni di contesto e matching:
1. **Tempistiche**: Quando vuole acquistare, Ha visitato la zona
2. **Utilizzo**: Come usera' la proprieta', Interesse affitto
3. **Descrizione richiesta** (testo libero del buyer)
4. **Proprieta' associate** (matching cards)

### Sezione finale (full-width, invariata)
- Commenti precedenti (legacy)
- Metadata (date creazione/submission)
- Elimina Cliente

## Dettagli tecnici

### File modificato
- `src/components/clienti/ClienteDetail.tsx`

### Modifiche
- Spostamento dei blocchi JSX esistenti tra le colonne senza modificare i singoli campi
- La colonna 1 diventa piu' densa (dati personali + CRM + azioni) perche' e' il punto di partenza naturale
- "Dati Personali" e "Tracking CRM" restano due sezioni con header separati ma dentro la stessa card bianca nella colonna 1
- Su mobile il layout resta a colonna singola con lo stesso ordine: prima col.1, poi col.2, poi col.3
- Il layout desktop resta `lg:grid-cols-3`
- Nessun elemento aggiunto o rimosso, solo riposizionamento


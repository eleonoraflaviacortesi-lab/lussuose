

## Importazione Buyers Dalila: Distribuzione su due sedi

### Cosa cambia
I buyers importati dal CSV di Dalila verranno distribuiti alternandoli tra le sedi **CITTÀ DI CASTELLO** e **AREZZO**, invece di assegnarli tutti a una sola sede. La coordinatrice potra' poi riassegnarli manualmente.

### Dettagli tecnici

**File: `src/lib/importDalilaClienti.ts`**
- Rimuovere il parametro `sede` dalla funzione `fetchAndParseDalilaCSV`
- Assegnare la sede alternando tra 'CITTÀ DI CASTELLO' e 'AREZZO' ad ogni buyer (uno alla prima, il successivo alla seconda, e cosi' via)

**File: `src/components/clienti/ImportDalilaCSVDialog.tsx`**
- Rimuovere il passaggio di `profile.sede` alla funzione, dato che non serve piu'
- Aggiornare il testo di anteprima per indicare che i buyers saranno distribuiti su entrambe le sedi

**Correzione dati esistenti (SQL)**
- Aggiornare i record gia' importati con sede 'PERUGIA' distribuendoli tra le due sedi corrette


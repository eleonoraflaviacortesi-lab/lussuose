

## Plan: Toggle "Tutti / Solo i miei" per agenti nella pagina Buyers

### Problema attuale
Gli agenti vedono **solo** i clienti a loro assegnati (riga 161-163 di `ClientiPage.tsx`). Non hanno modo di vedere tutti i buyers della sede.

### Soluzione
Aggiungere un toggle (Switch) nella barra degli strumenti degli agenti per passare tra "Solo i miei" e "Tutti i buyers".

### Modifiche necessarie

**1. `src/hooks/useClienti.ts`** — Attualmente la query RLS permette agli agenti di vedere solo i clienti assegnati a loro. Serve verificare se esiste una policy che permetta agli agenti di vedere tutti i clienti della sede. Dalla RLS attuale, gli agenti hanno solo `Agents can view assigned clients` (WHERE `assigned_to = auth.uid()`), quindi per far funzionare il toggle serve aggiungere una policy RLS che permetta agli agenti di vedere tutti i clienti della propria sede.

**2. Migration SQL** — Aggiungere una nuova RLS policy:
```sql
CREATE POLICY "Agents can view sede clients"
ON clienti FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.sede = clienti.sede OR clienti.sede = ANY(profiles.sedi))
  )
);
```
Questo permette a tutti gli utenti autenticati di vedere i clienti della propria sede (come già fanno i coordinatori).

**3. `src/components/clienti/ClientiPage.tsx`** — Modifiche:
- Aggiungere stato `showAllBuyers` (default `false`) solo per agenti
- Nella toolbar agenti (riga ~327-363), aggiungere un toggle Switch con label "Tutti" / "Solo miei"
- Modificare `displayClients` (riga 161-163): quando `showAllBuyers` è true, mostrare tutti i clienti; altrimenti filtrare per `assigned_to`
- Nella vista "tutti", i clienti non assegnati all'agente saranno visibili ma in sola lettura (l'update RLS lo impedisce già)

### Dettaglio UI
Il toggle apparirà nella barra di ricerca degli agenti, accanto al pulsante di ordinamento per data. Sarà uno Switch con etichetta "Tutti" che quando attivo mostra tutti i buyers della sede, evidenziando quelli assegnati all'agente con un indicatore visivo.


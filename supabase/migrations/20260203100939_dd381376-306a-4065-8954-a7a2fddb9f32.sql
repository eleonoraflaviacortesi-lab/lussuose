-- Aggiungere campo buyer_name per testo libero nelle trattative
ALTER TABLE meeting_items ADD COLUMN IF NOT EXISTS buyer_name TEXT;

-- Nota: non aggiungiamo CHECK constraint perché limiterebbe la flessibilità
-- I tipi validi saranno gestiti a livello applicativo
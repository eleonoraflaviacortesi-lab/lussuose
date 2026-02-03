-- Drop the old check constraint and add a new one with all section types
ALTER TABLE public.meeting_items DROP CONSTRAINT IF EXISTS meeting_items_item_type_check;

ALTER TABLE public.meeting_items ADD CONSTRAINT meeting_items_item_type_check 
CHECK (item_type IN (
  'incarico', 'trattativa', 'acquirente', 'obiettivo', 'task',
  'trattativa_corso', 'trattativa_chiusa', 
  'incarico_preso', 'incarico_mirino', 'incarico_ribasso',
  'acquirente_caldo'
));
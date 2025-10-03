-- FASE 1: Aggiungere colonne guest_name e total_guests a calendar_blocks
ALTER TABLE public.calendar_blocks 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS total_guests INTEGER;
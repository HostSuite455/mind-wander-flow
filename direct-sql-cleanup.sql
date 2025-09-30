-- Script SQL per eliminazione forzata di tutti i dati
-- Esegui questi comandi nell'editor SQL di Supabase

-- 1. Disabilita temporaneamente i vincoli di chiave esterna
SET session_replication_role = replica;

-- 2. Elimina tutti i record dalle tabelle correlate (per sicurezza)
DELETE FROM bookings WHERE property_id IS NOT NULL;
DELETE FROM calendar_blocks WHERE property_id IS NOT NULL;
DELETE FROM ical_configs WHERE property_id IS NOT NULL;
DELETE FROM unanswered_questions WHERE property_id IS NOT NULL;
DELETE FROM property_ai_data WHERE property_id IS NOT NULL;
DELETE FROM cleaning_tasks WHERE property_id IS NOT NULL;

-- 3. Elimina TUTTI i record dalla tabella properties
DELETE FROM properties;

-- 4. Reset della sequenza ID (solo se esiste)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'properties_id_seq') THEN
        ALTER SEQUENCE properties_id_seq RESTART WITH 1;
    END IF;
END $$;

-- 5. Riabilita i vincoli di chiave esterna
SET session_replication_role = DEFAULT;

-- 6. Verifica che la tabella sia vuota
SELECT COUNT(*) as record_count FROM properties;

-- 7. Elimina anche le tabelle duplicate/obsolete
DROP TABLE IF EXISTS public.property_info CASCADE;
DROP TABLE IF EXISTS public.property_details CASCADE;
DROP TABLE IF EXISTS public.accommodations CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.availability_blocks CASCADE;
DROP TABLE IF EXISTS public.sync_logs CASCADE;
DROP TABLE IF EXISTS public.task_accounting CASCADE;
DROP TABLE IF EXISTS public.message_feedback CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- 8. Verifica finale - mostra tutte le tabelle rimanenti
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- Script SQL sicuro per eliminazione forzata di tutti i dati
-- Esegui questi comandi nell'editor SQL di Supabase

-- 1. Verifica lo stato attuale
SELECT 'Verifica iniziale - Tabelle esistenti:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Conta i record nelle tabelle principali
SELECT 'Record attuali:' as info;
SELECT 
    'properties' as tabella, 
    COUNT(*) as record_count 
FROM properties
UNION ALL
SELECT 
    'bookings' as tabella, 
    COUNT(*) as record_count 
FROM bookings
UNION ALL
SELECT 
    'calendar_blocks' as tabella, 
    COUNT(*) as record_count 
FROM calendar_blocks;

-- 3. Disabilita temporaneamente i vincoli di chiave esterna
SET session_replication_role = replica;

-- 4. Elimina tutti i record dalle tabelle correlate (per sicurezza)
DELETE FROM bookings WHERE property_id IS NOT NULL;
DELETE FROM calendar_blocks WHERE property_id IS NOT NULL;
DELETE FROM ical_configs WHERE property_id IS NOT NULL;
DELETE FROM unanswered_questions WHERE property_id IS NOT NULL;
DELETE FROM property_ai_data WHERE property_id IS NOT NULL;
DELETE FROM cleaning_tasks WHERE property_id IS NOT NULL;

-- 5. Elimina TUTTI i record dalla tabella properties
DELETE FROM properties;

-- 6. Riabilita i vincoli di chiave esterna
SET session_replication_role = DEFAULT;

-- 7. Verifica che le tabelle siano vuote
SELECT 'Verifica dopo eliminazione:' as info;
SELECT 
    'properties' as tabella, 
    COUNT(*) as record_count 
FROM properties
UNION ALL
SELECT 
    'bookings' as tabella, 
    COUNT(*) as record_count 
FROM bookings
UNION ALL
SELECT 
    'calendar_blocks' as tabella, 
    COUNT(*) as record_count 
FROM calendar_blocks;

-- 8. Elimina le tabelle duplicate/obsolete (una alla volta per evitare errori)
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

-- 9. Verifica finale - mostra tutte le tabelle rimanenti
SELECT 'Tabelle finali dopo pulizia:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 10. Messaggio di completamento
SELECT '✅ Pulizia completata con successo!' as risultato;
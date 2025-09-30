-- Script per pulire tutti i dati di test dal database
-- Eseguire questo script per resettare il sistema prima dei test

-- Elimina tutti i pagamenti e contabilità
DELETE FROM public.payouts;
DELETE FROM public.task_accounting;

-- Elimina tutti i task di pulizia
DELETE FROM public.cleaning_tasks;

-- Elimina tutte le prenotazioni/reservations
DELETE FROM public.reservations;
DELETE FROM public.bookings;

-- Elimina le assegnazioni e tariffe cleaner
DELETE FROM public.cleaner_rates;
DELETE FROM public.cleaner_assignments;

-- Elimina tutti i cleaner
DELETE FROM public.cleaners;

-- Elimina tutte le fonti iCal
DELETE FROM public.ical_sources;

-- Elimina tutti i blocchi calendario
DELETE FROM public.calendar_blocks;

-- Elimina tutti gli account canali
DELETE FROM public.channel_accounts;

-- Elimina tutte le configurazioni iCal
DELETE FROM public.ical_configs;

-- Elimina tutti gli URL iCal
DELETE FROM public.ical_urls;

-- Elimina tutti i dati AI delle proprietà
DELETE FROM public.property_ai_data;

-- Elimina tutte le proprietà
DELETE FROM public.properties;

-- Reset delle sequenze (se necessario)
-- ALTER SEQUENCE properties_id_seq RESTART WITH 1;

-- Verifica che le tabelle siano vuote
SELECT 'properties' as table_name, COUNT(*) as count FROM public.properties
UNION ALL
SELECT 'bookings' as table_name, COUNT(*) as count FROM public.bookings
UNION ALL
SELECT 'reservations' as table_name, COUNT(*) as count FROM public.reservations
UNION ALL
SELECT 'cleaners' as table_name, COUNT(*) as count FROM public.cleaners
UNION ALL
SELECT 'cleaning_tasks' as table_name, COUNT(*) as count FROM public.cleaning_tasks
UNION ALL
SELECT 'cleaner_assignments' as table_name, COUNT(*) as count FROM public.cleaner_assignments
UNION ALL
SELECT 'cleaner_rates' as table_name, COUNT(*) as count FROM public.cleaner_rates
UNION ALL
SELECT 'task_accounting' as table_name, COUNT(*) as count FROM public.task_accounting
UNION ALL
SELECT 'payouts' as table_name, COUNT(*) as count FROM public.payouts
UNION ALL
SELECT 'ical_sources' as table_name, COUNT(*) as count FROM public.ical_sources
UNION ALL
SELECT 'calendar_blocks' as table_name, COUNT(*) as count FROM public.calendar_blocks
UNION ALL
SELECT 'channel_accounts' as table_name, COUNT(*) as count FROM public.channel_accounts
UNION ALL
SELECT 'ical_configs' as table_name, COUNT(*) as count FROM public.ical_configs
UNION ALL
SELECT 'ical_urls' as table_name, COUNT(*) as count FROM public.ical_urls
UNION ALL
SELECT 'property_ai_data' as table_name, COUNT(*) as count FROM public.property_ai_data;
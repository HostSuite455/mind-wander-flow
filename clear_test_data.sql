-- Script per pulire tutti i dati di test dal database
-- Eseguire questo script per resettare il sistema prima dei test

-- Elimina tutte le prenotazioni
DELETE FROM public.bookings;

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
SELECT 'calendar_blocks' as table_name, COUNT(*) as count FROM public.calendar_blocks
UNION ALL
SELECT 'channel_accounts' as table_name, COUNT(*) as count FROM public.channel_accounts
UNION ALL
SELECT 'ical_configs' as table_name, COUNT(*) as count FROM public.ical_configs
UNION ALL
SELECT 'ical_urls' as table_name, COUNT(*) as count FROM public.ical_urls
UNION ALL
SELECT 'property_ai_data' as table_name, COUNT(*) as count FROM public.property_ai_data;
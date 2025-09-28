-- Script per creare dati di test per iCal
-- Questo script crea configurazioni iCal di test per le proprietà esistenti

-- Prima, verifichiamo le proprietà esistenti
-- SELECT id, nome FROM properties WHERE user_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b';

-- Creiamo una configurazione iCal per la prima proprietà (Appartamento moderno)
INSERT INTO ical_configs (
  id,
  property_id,
  config_type,
  channel_manager_name,
  is_active,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '84785210-eaf7-43ec-9e33-f0d354cac2f4', -- ID della prima proprietà
  'ota_direct',
  NULL,
  true,
  'active',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Otteniamo l'ID della configurazione appena creata
-- (In un ambiente reale, useresti l'ID restituito dall'INSERT)
WITH new_config AS (
  SELECT id FROM ical_configs 
  WHERE property_id = '84785210-eaf7-43ec-9e33-f0d354cac2f4' 
  AND config_type = 'ota_direct'
  LIMIT 1
)
-- Creiamo un URL iCal di test per Booking.com
INSERT INTO ical_urls (
  id,
  ical_config_id,
  url,
  source,
  is_active,
  is_primary,
  last_sync_at,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  new_config.id,
  'https://admin.booking.com/hotel/hoteladmin/ical.html?ses=12345&hotel_id=67890&lang=it',
  'booking',
  true,
  true,
  NULL,
  now(),
  now()
FROM new_config
ON CONFLICT (id) DO NOTHING;

-- Creiamo una seconda configurazione per la seconda proprietà (Centro storico)
INSERT INTO ical_configs (
  id,
  property_id,
  config_type,
  channel_manager_name,
  is_active,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'dba94783-c312-4af0-aca2-d8311f5895e6', -- ID della seconda proprietà
  'ota_direct',
  NULL,
  true,
  'active',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Creiamo URL iCal di test per la seconda proprietà
WITH new_config AS (
  SELECT id FROM ical_configs 
  WHERE property_id = 'dba94783-c312-4af0-aca2-d8311f5895e6' 
  AND config_type = 'ota_direct'
  LIMIT 1
)
-- URL per Airbnb
INSERT INTO ical_urls (
  id,
  ical_config_id,
  url,
  source,
  is_active,
  is_primary,
  last_sync_at,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  new_config.id,
  'https://www.airbnb.it/calendar/ical/123456789.ics?s=abcdef123456',
  'airbnb',
  true,
  true,
  NULL,
  now(),
  now()
FROM new_config
ON CONFLICT (id) DO NOTHING;

-- Verifichiamo i dati creati
SELECT 
  p.nome as property_name,
  ic.config_type,
  ic.is_active as config_active,
  iu.url,
  iu.source,
  iu.is_active as url_active
FROM properties p
JOIN ical_configs ic ON p.id = ic.property_id
JOIN ical_urls iu ON ic.id = iu.ical_config_id
WHERE p.user_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
ORDER BY p.nome, iu.source;
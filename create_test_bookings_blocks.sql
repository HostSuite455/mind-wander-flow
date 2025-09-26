-- Script per creare dati di test per bookings e calendar_blocks
-- Per l'utente: 6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b

-- Prima otteniamo gli ID delle proprietà esistenti per questo utente
WITH user_properties AS (
  SELECT id, nome FROM properties 
  WHERE host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
  LIMIT 2
)

-- Inserisci bookings di test
INSERT INTO public.bookings (
  id,
  property_id,
  guest_name,
  guest_email,
  check_in,
  check_out,
  guests,
  total_price,
  currency,
  status,
  booking_reference,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  up.id,
  CASE 
    WHEN ROW_NUMBER() OVER() = 1 THEN 'Marco Rossi'
    WHEN ROW_NUMBER() OVER() = 2 THEN 'Anna Bianchi'
    WHEN ROW_NUMBER() OVER() = 3 THEN 'Giuseppe Verdi'
    ELSE 'Cliente Test'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER() = 1 THEN 'marco.rossi@email.com'
    WHEN ROW_NUMBER() OVER() = 2 THEN 'anna.bianchi@email.com'
    WHEN ROW_NUMBER() OVER() = 3 THEN 'giuseppe.verdi@email.com'
    ELSE 'test@email.com'
  END,
  CURRENT_DATE + (ROW_NUMBER() OVER() * 7 - 3) * INTERVAL '1 day',
  CURRENT_DATE + (ROW_NUMBER() OVER() * 7) * INTERVAL '1 day',
  2,
  450.00,
  'EUR',
  'confirmed',
  'BK' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
  now(),
  now()
FROM user_properties up
CROSS JOIN generate_series(1, 3) AS booking_num;

-- Inserisci calendar_blocks di test
WITH user_properties AS (
  SELECT id, nome FROM properties 
  WHERE host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
  LIMIT 2
)
INSERT INTO public.calendar_blocks (
  id,
  property_id,
  start_date,
  end_date,
  block_type,
  reason,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  up.id,
  CURRENT_DATE + (ROW_NUMBER() OVER() * 14 + 5) * INTERVAL '1 day',
  CURRENT_DATE + (ROW_NUMBER() OVER() * 14 + 8) * INTERVAL '1 day',
  CASE 
    WHEN ROW_NUMBER() OVER() % 2 = 1 THEN 'maintenance'
    ELSE 'owner_use'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER() % 2 = 1 THEN 'Manutenzione programmata'
    ELSE 'Uso personale proprietario'
  END,
  now(),
  now()
FROM user_properties up
CROSS JOIN generate_series(1, 2) AS block_num;

-- Verifica i dati inseriti
SELECT 'BOOKINGS' as tipo, COUNT(*) as count FROM bookings 
WHERE property_id IN (
  SELECT id FROM properties WHERE host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
)
UNION ALL
SELECT 'BLOCKS' as tipo, COUNT(*) as count FROM calendar_blocks 
WHERE property_id IN (
  SELECT id FROM properties WHERE host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
);

-- Mostra i bookings creati
SELECT 
  b.booking_reference,
  b.guest_name,
  b.check_in,
  b.check_out,
  b.status,
  p.nome as property_name
FROM bookings b
JOIN properties p ON b.property_id = p.id
WHERE p.host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
ORDER BY b.check_in;

-- Mostra i blocks creati
SELECT 
  cb.block_type,
  cb.reason,
  cb.start_date,
  cb.end_date,
  p.nome as property_name
FROM calendar_blocks cb
JOIN properties p ON cb.property_id = p.id
WHERE p.host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
ORDER BY cb.start_date;
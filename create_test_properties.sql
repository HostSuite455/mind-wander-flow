-- Inserisci proprietà di test per l'utente autenticato
-- Sostituisci 'YOUR_USER_ID' con l'ID dell'utente autenticato: 6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b

INSERT INTO public.properties (
  id,
  host_id,
  nome,
  city,
  address,
  country,
  guests,
  max_guests,
  bedrooms,
  beds,
  bathrooms,
  base_price,
  currency,
  status,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b',
  'Appartamento con terrazza nel cuore di SIENA',
  'Siena',
  'Via del Campo 15',
  'Italia',
  4,
  4,
  2,
  2,
  1,
  120.00,
  'EUR',
  'active',
  now(),
  now()
),
(
  gen_random_uuid(),
  '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b',
  'Via esterna di Fontebranda',
  'Siena',
  'Via Fontebranda 25',
  'Italia',
  2,
  2,
  1,
  1,
  1,
  85.00,
  'EUR',
  'active',
  now(),
  now()
),
(
  gen_random_uuid(),
  '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b',
  'Viale Sardegna',
  'Siena',
  'Viale Sardegna 42',
  'Italia',
  6,
  6,
  3,
  3,
  2,
  180.00,
  'EUR',
  'active',
  now(),
  now()
);

-- Inserisci alcune prenotazioni di test
INSERT INTO public.bookings (
  id,
  property_id,
  host_id,
  external_booking_id,
  guest_name,
  guest_email,
  check_in,
  check_out,
  guests_count,
  adults_count,
  children_count,
  channel,
  booking_status,
  total_price,
  currency,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  p.id,
  p.host_id,
  'TEST-' || substring(gen_random_uuid()::text from 1 for 8),
  'Mario Rossi',
  'mario.rossi@email.com',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '10 days',
  2,
  2,
  0,
  'Airbnb',
  'confirmed',
  360.00,
  'EUR',
  now(),
  now()
FROM public.properties p 
WHERE p.host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
LIMIT 1;

-- Inserisci un altro booking
INSERT INTO public.bookings (
  id,
  property_id,
  host_id,
  external_booking_id,
  guest_name,
  guest_email,
  check_in,
  check_out,
  guests_count,
  adults_count,
  children_count,
  channel,
  booking_status,
  total_price,
  currency,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  p.id,
  p.host_id,
  'TEST-' || substring(gen_random_uuid()::text from 1 for 8),
  'Giulia Bianchi',
  'giulia.bianchi@email.com',
  CURRENT_DATE + INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '18 days',
  4,
  3,
  1,
  'Booking.com',
  'confirmed',
  540.00,
  'EUR',
  now(),
  now()
FROM public.properties p 
WHERE p.host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
ORDER BY random()
LIMIT 1;

-- Inserisci alcuni blocchi calendario
INSERT INTO public.calendar_blocks (
  id,
  host_id,
  property_id,
  start_date,
  end_date,
  reason,
  source,
  is_active,
  created_at
)
SELECT 
  gen_random_uuid(),
  p.host_id,
  p.id,
  CURRENT_DATE + INTERVAL '25 days',
  CURRENT_DATE + INTERVAL '27 days',
  'Manutenzione',
  'manual',
  true,
  now()
FROM public.properties p 
WHERE p.host_id = '6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b'
LIMIT 1;
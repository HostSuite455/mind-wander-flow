-- Migrazione: Consolidamento sistema iCal

-- Step 1: Crea tabella subscriptions se non esiste
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  subscription_tier text NOT NULL DEFAULT 'free',
  price_cents integer NOT NULL DEFAULT 0,
  current_period_start timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone DEFAULT now() + interval '1 month',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(host_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy per subscriptions (usa DO block per gestire if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
      AND policyname = 'Users view own subscription'
  ) THEN
    CREATE POLICY "Users view own subscription"
      ON public.subscriptions FOR SELECT
      USING (auth.uid() = host_id);
  END IF;
END $$;

-- Step 2: Migra ical_sources -> ical_configs (OTA direct)
INSERT INTO public.ical_configs (
  property_id,
  host_id,
  config_type,
  is_active,
  status,
  max_ical_urls
)
SELECT DISTINCT
  is2.property_id,
  p.host_id,
  'ota_direct'::text,
  true,
  'active'::text,
  5
FROM public.ical_sources is2
JOIN public.properties p ON p.id = is2.property_id
WHERE is2.active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.ical_configs ic 
    WHERE ic.property_id = is2.property_id 
      AND ic.config_type = 'ota_direct'
  )
GROUP BY is2.property_id, p.host_id;

-- Step 3: Migra URL
INSERT INTO public.ical_urls (
  ical_config_id,
  url,
  ota_name,
  source,
  is_active,
  last_sync_at,
  last_sync_status
)
SELECT 
  ic.id,
  is2.url,
  is2.channel,
  'ical'::text,
  is2.active,
  is2.last_sync_at,
  COALESCE(is2.last_status, 'pending'::text)
FROM public.ical_sources is2
JOIN public.ical_configs ic ON ic.property_id = is2.property_id 
  AND ic.config_type = 'ota_direct'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ical_urls iu
  WHERE iu.ical_config_id = ic.id AND iu.url = is2.url
);

-- Step 4: Primary URLs
UPDATE public.ical_urls iu
SET is_primary = true
WHERE iu.id IN (
  SELECT DISTINCT ON (ical_config_id) id
  FROM public.ical_urls
  ORDER BY ical_config_id, created_at ASC
);
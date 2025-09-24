-- A) Migration: channel_accounts backfill and unification (fixed)
-- A1) Schema updates  
ALTER TABLE public.channel_accounts
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

-- A2) Simple backfill from ical_configs to channel_accounts (without ON CONFLICT)
INSERT INTO public.channel_accounts (host_id, property_id, kind, name, ics_export_token)
SELECT p.host_id,
       ic.property_id,
       'ics' as kind,
       COALESCE(ic.channel_manager_name, 'ICS Channel') as name,
       REPLACE(gen_random_uuid()::text, '-', '') as ics_export_token
FROM public.ical_configs ic
JOIN public.properties p ON p.id = ic.property_id
WHERE ic.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.channel_accounts ca
    WHERE ca.host_id = p.host_id 
    AND ca.property_id = ic.property_id 
    AND ca.name = COALESCE(ic.channel_manager_name, 'ICS Channel')
  );

-- A3) Generate tokens for existing accounts without tokens
UPDATE public.channel_accounts
SET ics_export_token = REPLACE(gen_random_uuid()::text, '-', '')
WHERE ics_export_token IS NULL;
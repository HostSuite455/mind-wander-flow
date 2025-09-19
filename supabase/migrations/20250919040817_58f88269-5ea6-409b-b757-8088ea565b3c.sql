-- Schema updates for ical_urls and ical_configs
-- Add missing columns if they don't exist (idempotent)

-- Update ical_urls table - add source column (rename ota_name to source for consistency)
ALTER TABLE public.ical_urls 
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Copy ota_name to source if source is empty/null
UPDATE public.ical_urls 
SET source = ota_name 
WHERE source IS NULL AND ota_name IS NOT NULL;

-- Rename last_sync to last_sync_at for consistency
ALTER TABLE public.ical_urls 
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Copy last_sync to last_sync_at if last_sync_at is empty/null
UPDATE public.ical_urls 
SET last_sync_at = last_sync 
WHERE last_sync_at IS NULL AND last_sync IS NOT NULL;

-- Update ical_configs table - add missing columns
ALTER TABLE public.ical_configs
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ical_urls_ical_config_id ON public.ical_urls(ical_config_id);
CREATE INDEX IF NOT EXISTS idx_ical_urls_is_primary ON public.ical_urls(ical_config_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_ical_configs_property_id ON public.ical_configs(property_id);

-- RLS policies for ical_urls (these should work with the existing ical_configs relationship)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "hosts_manage_ical_urls" ON public.ical_urls;

-- Create new policy that works through ical_configs
CREATE POLICY "hosts_manage_ical_urls" ON public.ical_urls
  FOR ALL TO authenticated
  USING (
    ical_config_id IN (
      SELECT ic.id 
      FROM public.ical_configs ic 
      WHERE ic.host_id = auth.uid()
    )
  )
  WITH CHECK (
    ical_config_id IN (
      SELECT ic.id 
      FROM public.ical_configs ic 
      WHERE ic.host_id = auth.uid()
    )
  );
-- Schema updates for ical_urls and ical_configs
-- Add columns if they don't exist (idempotent)

-- Update ical_urls table
ALTER TABLE public.ical_urls 
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Update ical_configs table  
ALTER TABLE public.ical_configs
  ADD COLUMN IF NOT EXISTS config_type TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS channel_manager_name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ical_urls_property_id ON public.ical_urls(property_id);
CREATE INDEX IF NOT EXISTS idx_ical_urls_is_primary ON public.ical_urls(property_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_ical_configs_property_id ON public.ical_configs(property_id);

-- Enable RLS on ical_urls if not already enabled
ALTER TABLE public.ical_urls ENABLE ROW LEVEL SECURITY;

-- RLS policies for ical_urls
CREATE POLICY IF NOT EXISTS "ical_urls_select" ON public.ical_urls
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ical_urls.property_id
        AND p.host_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "ical_urls_insert" ON public.ical_urls
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
        AND p.host_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "ical_urls_update" ON public.ical_urls
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ical_urls.property_id
        AND p.host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
        AND p.host_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "ical_urls_delete" ON public.ical_urls
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ical_urls.property_id
        AND p.host_id = auth.uid()
    )
  );
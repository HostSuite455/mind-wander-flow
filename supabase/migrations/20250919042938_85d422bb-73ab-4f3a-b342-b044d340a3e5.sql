-- 1) Assicurati che ical_configs esista come previsto
ALTER TABLE public.ical_configs
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS property_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS config_type text DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS channel_manager_name text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ical_configs_property_id_fkey'
    ) THEN
        ALTER TABLE public.ical_configs 
        ADD CONSTRAINT ical_configs_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ical_configs_property_id ON public.ical_configs(property_id);

-- 2) Porta ical_urls sul modello con ical_config_id
ALTER TABLE public.ical_urls
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS ical_config_id uuid,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Add foreign key constraint for ical_config_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ical_urls_ical_config_id_fkey'
    ) THEN
        ALTER TABLE public.ical_urls 
        ADD CONSTRAINT ical_urls_ical_config_id_fkey 
        FOREIGN KEY (ical_config_id) REFERENCES public.ical_configs(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ical_urls_config ON public.ical_urls(ical_config_id);
CREATE INDEX IF NOT EXISTS idx_ical_urls_primary ON public.ical_urls(ical_config_id, is_primary) WHERE is_primary = true;

-- 3) Update RLS policies for ical_configs
DROP POLICY IF EXISTS ical_configs_select ON public.ical_configs;
DROP POLICY IF EXISTS ical_configs_insert ON public.ical_configs;
DROP POLICY IF EXISTS ical_configs_update ON public.ical_configs;
DROP POLICY IF EXISTS ical_configs_delete ON public.ical_configs;
DROP POLICY IF EXISTS "Hosts can view own ical configs" ON public.ical_configs;
DROP POLICY IF EXISTS "Hosts can insert own ical configs" ON public.ical_configs;
DROP POLICY IF EXISTS "Hosts can update own ical configs" ON public.ical_configs;
DROP POLICY IF EXISTS "Hosts can delete own ical configs" ON public.ical_configs;
DROP POLICY IF EXISTS "hosts_manage_ical_configs" ON public.ical_configs;

CREATE POLICY ical_configs_select ON public.ical_configs
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p
          WHERE p.id = ical_configs.property_id
            AND p.host_id = auth.uid())
);

CREATE POLICY ical_configs_insert ON public.ical_configs
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p
          WHERE p.id = property_id
            AND p.host_id = auth.uid())
);

CREATE POLICY ical_configs_update ON public.ical_configs
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p
          WHERE p.id = ical_configs.property_id
            AND p.host_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p
          WHERE p.id = property_id
            AND p.host_id = auth.uid())
);

CREATE POLICY ical_configs_delete ON public.ical_configs
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p
          WHERE p.id = ical_configs.property_id
            AND p.host_id = auth.uid())
);

-- 4) Update RLS policies for ical_urls (via ical_config_id)
DROP POLICY IF EXISTS ical_urls_select ON public.ical_urls;
DROP POLICY IF EXISTS ical_urls_insert ON public.ical_urls;
DROP POLICY IF EXISTS ical_urls_update ON public.ical_urls;
DROP POLICY IF EXISTS ical_urls_delete ON public.ical_urls;
DROP POLICY IF EXISTS "hosts_manage_ical_urls" ON public.ical_urls;

CREATE POLICY ical_urls_select ON public.ical_urls
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ical_configs ic
    JOIN public.properties p ON p.id = ic.property_id
    WHERE ic.id = ical_urls.ical_config_id
      AND p.host_id = auth.uid()
  )
);

CREATE POLICY ical_urls_insert ON public.ical_urls
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.ical_configs ic
    JOIN public.properties p ON p.id = ic.property_id
    WHERE ic.id = ical_config_id
      AND p.host_id = auth.uid()
  )
);

CREATE POLICY ical_urls_update ON public.ical_urls
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ical_configs ic
    JOIN public.properties p ON p.id = ic.property_id
    WHERE ic.id = ical_urls.ical_config_id
      AND p.host_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.ical_configs ic
    JOIN public.properties p ON p.id = ic.property_id
    WHERE ic.id = ical_config_id
      AND p.host_id = auth.uid()
  )
);

CREATE POLICY ical_urls_delete ON public.ical_urls
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ical_configs ic
    JOIN public.properties p ON p.id = ic.property_id
    WHERE ic.id = ical_urls.ical_config_id
      AND p.host_id = auth.uid()
  )
);
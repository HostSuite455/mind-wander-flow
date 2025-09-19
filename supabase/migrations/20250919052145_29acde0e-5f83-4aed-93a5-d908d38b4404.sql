-- Create calendar_blocks table for Channel Lite functionality
CREATE TABLE IF NOT EXISTS public.calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  source TEXT DEFAULT 'manual',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "cb_select" ON public.calendar_blocks
  FOR SELECT TO authenticated USING (host_id = auth.uid());

CREATE POLICY "cb_insert" ON public.calendar_blocks
  FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());

CREATE POLICY "cb_update" ON public.calendar_blocks
  FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE POLICY "cb_delete" ON public.calendar_blocks
  FOR DELETE TO authenticated USING (host_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_cb_property_dates ON public.calendar_blocks(property_id, start_date, end_date);
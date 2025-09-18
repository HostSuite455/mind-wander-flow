-- Update RLS policies for guest access to property data

-- Enable RLS on property_ai_data if not already enabled
ALTER TABLE public.property_ai_data ENABLE ROW LEVEL SECURITY;

-- Update property_ai_data policy to allow guest access
DROP POLICY IF EXISTS "guests_read_property_info" ON public.property_ai_data;

CREATE POLICY "guests_read_property_info" ON public.property_ai_data
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.guest_codes gc
    WHERE gc.property_id = property_ai_data.property_id
    AND now() BETWEEN gc.check_in AND gc.check_out
  )
);

-- Ensure hosts can manage their property AI data  
DROP POLICY IF EXISTS "hosts_manage_property_ai_data" ON public.property_ai_data;

CREATE POLICY "hosts_manage_property_ai_data" ON public.property_ai_data
FOR ALL USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE host_id = auth.uid()
  )
);

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_guest_codes_property_dates ON public.guest_codes(property_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_property_ai_data_property_id ON public.property_ai_data(property_id);
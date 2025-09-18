-- Ensure properties table has all required columns (idempotent)
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS max_guests int4,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS address text;

-- Add constraint for status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'properties_status_check' 
    AND table_name = 'properties'
  ) THEN
    ALTER TABLE public.properties 
    ADD CONSTRAINT properties_status_check CHECK (status IN ('active', 'inactive'));
  END IF;
END $$;

-- Enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;

-- Create RLS policies for properties
CREATE POLICY "properties_select_own" 
ON public.properties 
FOR SELECT 
TO authenticated 
USING (auth.uid() = host_id);

CREATE POLICY "properties_insert_own" 
ON public.properties 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = host_id);
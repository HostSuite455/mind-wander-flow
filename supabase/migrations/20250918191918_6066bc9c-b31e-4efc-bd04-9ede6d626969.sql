-- Enable RLS on properties table if not already enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;

-- Create secure RLS policies for properties
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

-- Add new columns to properties table (non-destructive)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS max_guests integer,
  ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active','inactive')) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS address text;
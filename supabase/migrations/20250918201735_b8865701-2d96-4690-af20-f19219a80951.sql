-- Fix infinite recursion in RLS policies for public.properties
-- This removes all existing policies that may cause recursion and creates clean, non-recursive ones

-- Disable RLS temporarily to remove policies
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on properties table
DROP POLICY IF EXISTS "properties_select" ON public.properties;
DROP POLICY IF EXISTS "properties_insert" ON public.properties;
DROP POLICY IF EXISTS "properties_update" ON public.properties;
DROP POLICY IF EXISTS "properties_delete" ON public.properties;
DROP POLICY IF EXISTS "Allow SELECT for guest with valid code" ON public.properties;

-- Re-enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create clean, non-recursive policies
-- Only the property owner can read their properties
CREATE POLICY "properties_select"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

-- Only authenticated users can insert properties with their own host_id
CREATE POLICY "properties_insert"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

-- Only the property owner can update their properties
CREATE POLICY "properties_update"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- Only the property owner can delete their properties
CREATE POLICY "properties_delete"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (host_id = auth.uid());

-- Ensure the host_id column is properly configured
ALTER TABLE public.properties ALTER COLUMN host_id SET NOT NULL;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- Verify the schema has all needed columns
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS max_guests INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure nome column is not null
ALTER TABLE public.properties ALTER COLUMN nome SET NOT NULL;
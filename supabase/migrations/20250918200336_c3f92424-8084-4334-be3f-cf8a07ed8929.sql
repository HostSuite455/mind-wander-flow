-- Fix RLS infinite recursion on properties table
-- Drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "properties_select" ON public.properties;
DROP POLICY IF EXISTS "properties_insert" ON public.properties;
DROP POLICY IF EXISTS "properties_update" ON public.properties;
DROP POLICY IF EXISTS "properties_delete" ON public.properties;
DROP POLICY IF EXISTS "Allow SELECT for owner" ON public.properties;
DROP POLICY IF EXISTS "Allow INSERT for owner" ON public.properties;
DROP POLICY IF EXISTS "Allow UPDATE for owner" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "hosts_see_own_properties" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;
DROP POLICY IF EXISTS "properties_select_own" ON public.properties;

-- Ensure RLS is enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create clean, non-recursive RLS policies
CREATE POLICY "properties_select"
ON public.properties
FOR SELECT
TO authenticated
USING (host_id = auth.uid());

CREATE POLICY "properties_insert"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (host_id = auth.uid());

CREATE POLICY "properties_update"
ON public.properties
FOR UPDATE
TO authenticated
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

CREATE POLICY "properties_delete"
ON public.properties
FOR DELETE
TO authenticated
USING (host_id = auth.uid());

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);
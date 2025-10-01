-- Fix infinite recursion in properties RLS for cleaners
-- Create a security definer function that bypasses RLS to check cleaner assignments

CREATE OR REPLACE FUNCTION public.cleaner_can_view_property(prop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cleaner_assignments ca
    JOIN public.cleaners c ON c.id = ca.cleaner_id
    WHERE ca.property_id = prop_id
      AND c.user_id = auth.uid()
      AND ca.active = true
  )
$$;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "cleaners_view_assigned_properties" ON public.properties;

-- Recreate it using the security definer function (no recursion)
CREATE POLICY "cleaners_view_assigned_properties"
ON public.properties
FOR SELECT
TO authenticated
USING (public.cleaner_can_view_property(id));
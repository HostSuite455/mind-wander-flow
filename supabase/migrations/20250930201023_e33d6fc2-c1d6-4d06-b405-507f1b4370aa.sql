-- Enable cleaners to view their assigned properties and assignments

-- Policy: Cleaners can view their own assignments
CREATE POLICY "cleaners_view_assignments"
ON public.cleaner_assignments
FOR SELECT
TO authenticated
USING (
  cleaner_id IN (
    SELECT id FROM public.cleaners WHERE user_id = auth.uid()
  )
);

-- Policy: Cleaners can view properties they are assigned to
CREATE POLICY "cleaners_view_assigned_properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ca.property_id
    FROM public.cleaner_assignments ca
    JOIN public.cleaners c ON c.id = ca.cleaner_id
    WHERE c.user_id = auth.uid()
      AND ca.active = true
  )
);
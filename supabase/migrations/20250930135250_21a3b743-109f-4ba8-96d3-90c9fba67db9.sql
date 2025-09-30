-- Fix RLS policies for cleaner registration via invitation

-- Drop existing restrictive policy that blocks cleaner self-registration
DROP POLICY IF EXISTS "owner_cud_cleaners" ON public.cleaners;

-- Separate policies for different operations

-- Hosts can SELECT their cleaners
CREATE POLICY "Hosts can view their cleaners"
ON public.cleaners
FOR SELECT
USING (owner_id = auth.uid());

-- Hosts can UPDATE their cleaners
CREATE POLICY "Hosts can update their cleaners"
ON public.cleaners
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Hosts can DELETE their cleaners
CREATE POLICY "Hosts can delete their cleaners"
ON public.cleaners
FOR DELETE
USING (owner_id = auth.uid());

-- Allow INSERT only through valid invitation
CREATE POLICY "Cleaners can register via invitation"
ON public.cleaners
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.cleaner_invitations ci
    WHERE ci.host_id = owner_id
    AND ci.status = 'pending'
    AND ci.expires_at > now()
    AND (
      ci.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR ci.phone = (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Cleaners can view their own profile
CREATE POLICY "Cleaners can view own profile"
ON public.cleaners
FOR SELECT
USING (user_id = auth.uid());

-- Cleaners can update their own profile (limited fields)
CREATE POLICY "Cleaners can update own profile"
ON public.cleaners
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND owner_id = (SELECT owner_id FROM public.cleaners WHERE id = cleaners.id)
);
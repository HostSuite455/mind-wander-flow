-- Create security definer function to check if cleaner invitation is valid for current user
CREATE OR REPLACE FUNCTION public.check_cleaner_invitation_valid(
  p_owner_id uuid,
  p_email text,
  p_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_user_phone text;
BEGIN
  -- Get current user's email and phone from auth.users
  SELECT email, raw_user_meta_data->>'phone'
  INTO v_user_email, v_user_phone
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if invitation matches current user's credentials
  RETURN (
    v_user_email = p_email OR 
    v_user_phone = p_phone
  );
END;
$$;

-- Drop old RLS policy that was accessing auth.users in WITH CHECK
DROP POLICY IF EXISTS "Cleaners can register via invitation" ON public.cleaners;

-- Create new RLS policy using security definer function
CREATE POLICY "Cleaners can register via invitation" 
ON public.cleaners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cleaner_invitations ci
    WHERE ci.host_id = cleaners.owner_id
      AND ci.status = 'pending'
      AND ci.expires_at > now()
      AND public.check_cleaner_invitation_valid(
            cleaners.owner_id,
            COALESCE(ci.email, ''),
            COALESCE(ci.phone, '')
          )
  )
);
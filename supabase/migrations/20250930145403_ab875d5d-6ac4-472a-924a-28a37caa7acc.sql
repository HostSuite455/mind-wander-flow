-- RPC function per ottenere info invito senza RLS
CREATE OR REPLACE FUNCTION public.get_invitation_info(p_code text)
RETURNS TABLE (
  invitation_id uuid,
  property_id uuid,
  host_id uuid,
  property_name text,
  property_address text,
  property_city text,
  status text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.property_id,
    ci.host_id,
    p.nome as property_name,
    p.address as property_address,
    p.city as property_city,
    ci.status,
    ci.expires_at
  FROM cleaner_invitations ci
  JOIN properties p ON p.id = ci.property_id
  WHERE ci.invitation_code = p_code
    AND ci.status = 'pending'
    AND ci.expires_at > now();
END;
$$;

-- RPC function per accettare invito senza RLS
CREATE OR REPLACE FUNCTION public.accept_cleaner_invitation(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation cleaner_invitations%ROWTYPE;
  v_cleaner_id uuid;
  v_user_email text;
  v_user_phone text;
  v_user_name text;
BEGIN
  -- Validate invitation
  SELECT * INTO v_invitation
  FROM cleaner_invitations
  WHERE invitation_code = p_code
    AND status = 'pending'
    AND expires_at > now();

  IF v_invitation.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invito non valido o scaduto');
  END IF;

  -- Get current user info
  SELECT email, raw_user_meta_data->>'phone', COALESCE(raw_user_meta_data->>'first_name', email)
  INTO v_user_email, v_user_phone, v_user_name
  FROM auth.users
  WHERE id = auth.uid();

  -- Check if cleaner profile exists
  SELECT id INTO v_cleaner_id
  FROM cleaners
  WHERE user_id = auth.uid() AND owner_id = v_invitation.host_id;

  -- Create cleaner profile if not exists
  IF v_cleaner_id IS NULL THEN
    INSERT INTO cleaners (user_id, owner_id, name, email, phone)
    VALUES (auth.uid(), v_invitation.host_id, v_user_name, v_user_email, v_user_phone)
    RETURNING id INTO v_cleaner_id;
  END IF;

  -- Create or update cleaner assignment
  INSERT INTO cleaner_assignments (cleaner_id, property_id, active)
  VALUES (v_cleaner_id, v_invitation.property_id, true)
  ON CONFLICT (cleaner_id, property_id) 
  DO UPDATE SET active = true;

  -- Update invitation status
  UPDATE cleaner_invitations
  SET status = 'accepted',
      accepted_at = now(),
      cleaner_id = v_cleaner_id
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true, 
    'cleaner_id', v_cleaner_id,
    'property_id', v_invitation.property_id
  );
END;
$$;
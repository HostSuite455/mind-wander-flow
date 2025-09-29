-- Phase 1: Critical Security Fixes

-- 1. Fix guest_codes table - remove public access policies
DROP POLICY IF EXISTS "Allow read for all users" ON public.guest_codes;
DROP POLICY IF EXISTS "guest_code_lookup_public" ON public.guest_codes;

-- Replace with secure, time-based access only
CREATE POLICY "guests_can_read_active_codes" ON public.guest_codes
FOR SELECT 
USING (
  now() >= (check_in::timestamp with time zone - interval '1 day') AND 
  now() <= (check_out::timestamp with time zone + interval '1 day')
);

-- 2. Fix chats table - remove public access
DROP POLICY IF EXISTS "public_access_chats" ON public.chats;
DROP POLICY IF EXISTS "allow all insert" ON public.chats;
DROP POLICY IF EXISTS "allow all select" ON public.chats;

-- Replace with authenticated access only
CREATE POLICY "authenticated_users_chat_access" ON public.chats
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Remove the insecure custom users table entirely
DROP TABLE IF EXISTS public.users CASCADE;

-- 4. Create a secure profiles table for additional user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  role text DEFAULT 'user',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies - users can only access their own profile
CREATE POLICY "users_can_view_own_profile" ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 5. Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Update properties table to use host_id properly (ensure it references auth.users)
-- Note: properties.host_id should reference auth.users(id), not the old users table

-- 7. Secure learning_patterns function
CREATE OR REPLACE FUNCTION public.reset_learning_stats(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Add security check
    IF NOT EXISTS (
        SELECT 1 FROM public.properties 
        WHERE id = p_property_id AND host_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: You do not own this property';
    END IF;
    
    UPDATE public.learning_patterns
    SET 
        patterns = '[]'::jsonb,
        category_weights = '{}'::jsonb,
        common_phrases = ARRAY[]::TEXT[],
        total_questions = 0,
        success_rate = 0,
        updated_at = NOW()
    WHERE property_id = p_property_id;
END;
$$;
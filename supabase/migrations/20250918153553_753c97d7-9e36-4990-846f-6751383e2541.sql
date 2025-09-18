-- Enable RLS on critical tables and create basic security policies

-- Users table RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own records
CREATE POLICY "users_self_select" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_self_update" ON public.users  
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_self_insert" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties table RLS policies  
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Hosts can only see their own properties
CREATE POLICY "hosts_see_own_properties" ON public.properties
FOR ALL USING (host_id = auth.uid());

-- Guest codes table RLS policies
ALTER TABLE public.guest_codes ENABLE ROW LEVEL SECURITY;

-- Allow public access to valid guest codes for verification
CREATE POLICY "guest_code_lookup_public" ON public.guest_codes
FOR SELECT USING (
  created_at >= (now() - INTERVAL '1 year') -- Basic safety check
);

-- Hosts can manage guest codes for their properties  
CREATE POLICY "hosts_manage_guest_codes" ON public.guest_codes
FOR ALL USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE host_id = auth.uid()
  )
);

-- Property AI data RLS policies
ALTER TABLE public.property_ai_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosts_manage_property_ai_data" ON public.property_ai_data
FOR ALL USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE host_id = auth.uid()
  )
);

-- iCal configs RLS policies  
ALTER TABLE public.ical_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosts_manage_ical_configs" ON public.ical_configs
FOR ALL USING (host_id = auth.uid());

-- Subscriptions RLS policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosts_manage_subscriptions" ON public.subscriptions
FOR ALL USING (host_id = auth.uid());

-- Unanswered questions RLS policies
ALTER TABLE public.unanswered_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosts_see_property_questions" ON public.unanswered_questions
FOR SELECT USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE host_id = auth.uid()
  )
);

CREATE POLICY "hosts_update_property_questions" ON public.unanswered_questions  
FOR UPDATE USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE host_id = auth.uid()
  )
);

-- Guests can insert questions for their active sessions
CREATE POLICY "guests_insert_questions" ON public.unanswered_questions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.guest_codes gc
    WHERE gc.code = guest_code 
    AND gc.property_id = unanswered_questions.property_id
    AND now() BETWEEN gc.check_in AND gc.check_out
  )
);

-- Create useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_codes_code ON public.guest_codes(code);
CREATE INDEX IF NOT EXISTS idx_guest_codes_dates ON public.guest_codes(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_properties_host ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_property ON public.unanswered_questions(property_id);
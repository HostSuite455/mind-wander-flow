-- Fix infinite recursion in RLS policies

-- Drop problematic policies and recreate them properly
DROP POLICY IF EXISTS "hosts_see_own_properties" ON public.properties;
DROP POLICY IF EXISTS "hosts_manage_property_ai_data" ON public.property_ai_data;
DROP POLICY IF EXISTS "hosts_manage_ical_configs" ON public.ical_configs;
DROP POLICY IF EXISTS "hosts_manage_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "hosts_see_property_questions" ON public.unanswered_questions;
DROP POLICY IF EXISTS "hosts_update_property_questions" ON public.unanswered_questions;

-- Create simple, non-recursive policies for properties
CREATE POLICY "hosts_see_own_properties" ON public.properties
FOR ALL TO authenticated
USING (host_id = auth.uid());

-- Create policies that don't cause recursion by using direct user checks
CREATE POLICY "hosts_manage_property_ai_data" ON public.property_ai_data  
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_ai_data.property_id 
    AND p.host_id = auth.uid()
  )
);

CREATE POLICY "hosts_manage_ical_configs" ON public.ical_configs
FOR ALL TO authenticated  
USING (host_id = auth.uid());

CREATE POLICY "hosts_manage_subscriptions" ON public.subscriptions
FOR ALL TO authenticated
USING (host_id = auth.uid());

CREATE POLICY "hosts_see_property_questions" ON public.unanswered_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = unanswered_questions.property_id 
    AND p.host_id = auth.uid()
  )
);

CREATE POLICY "hosts_update_property_questions" ON public.unanswered_questions
FOR UPDATE TO authenticated  
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = unanswered_questions.property_id 
    AND p.host_id = auth.uid()
  )
);
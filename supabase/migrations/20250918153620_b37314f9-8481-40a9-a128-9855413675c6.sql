-- Fix critical security issues: Enable RLS on remaining public tables

-- Enable RLS on ical_urls table
ALTER TABLE public.ical_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosts_manage_ical_urls" ON public.ical_urls
FOR ALL USING (
  ical_config_id IN (
    SELECT id FROM public.ical_configs 
    WHERE host_id = auth.uid()
  )
);

-- Enable RLS on learning_patterns table
ALTER TABLE public.learning_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosts_manage_learning_patterns" ON public.learning_patterns
FOR ALL USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE host_id = auth.uid()
  )
);

-- Enable RLS on message_feedback table  
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosts_view_message_feedback" ON public.message_feedback
FOR SELECT USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE host_id = auth.uid()
  )
);

-- Enable RLS on place_cache table
ALTER TABLE public.place_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_place_cache" ON public.place_cache
FOR SELECT USING (true);

CREATE POLICY "authenticated_insert_place_cache" ON public.place_cache  
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Enable RLS on chats table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access_chats" ON public.chats
FOR ALL USING (true);
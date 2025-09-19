-- Make host_id nullable in ical_configs since RLS policies don't rely on it
ALTER TABLE public.ical_configs ALTER COLUMN host_id DROP NOT NULL;
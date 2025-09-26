-- Fix properties status constraint to allow 'draft' status
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_status_check 
  CHECK (status IN ('active', 'inactive', 'draft'));
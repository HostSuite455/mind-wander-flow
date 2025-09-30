-- FASE 1: Database Cleanup & Optimization

-- Drop obsolete tables
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.channel_accounts CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.place_cache CASCADE;

-- FASE 2: Extend properties table with missing fields
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS unit_number TEXT;

-- Update ical_sources to track channel type
ALTER TABLE public.ical_sources
ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'ical',
ADD COLUMN IF NOT EXISTS platform_instructions TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_ical_sources_property_id ON public.ical_sources(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);

COMMENT ON COLUMN public.properties.image_url IS 'URL dell''immagine principale della proprietà';
COMMENT ON COLUMN public.properties.description IS 'Descrizione della proprietà visibile agli addetti';
COMMENT ON COLUMN public.properties.unit_number IS 'Numero unità o nome edificio';
COMMENT ON COLUMN public.ical_sources.channel_type IS 'Tipo di canale: airbnb, booking, vrbo, ical';
COMMENT ON COLUMN public.ical_sources.platform_instructions IS 'Istruzioni specifiche per la piattaforma';
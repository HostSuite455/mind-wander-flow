-- Estendere ical_configs per supportare multi-channel manager
ALTER TABLE public.ical_configs 
ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
ADD COLUMN IF NOT EXISTS api_key_name TEXT,
ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb;

-- Aggiornare il trigger di validazione per supportare nuovi campi
CREATE OR REPLACE FUNCTION public.validate_ical_config()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Verifica limite per Channel Manager (max 1 per proprietà)
    IF NEW.config_type = 'channel_manager' THEN
        IF EXISTS (
            SELECT 1 FROM public.ical_configs 
            WHERE property_id = NEW.property_id 
            AND config_type = 'channel_manager' 
            AND is_active = true
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Esiste già una configurazione Channel Manager per questa proprietà';
        END IF;
        NEW.max_ical_urls := 1;
    END IF;

    -- Verifica limite per OTA Diretti (max 5 per proprietà)  
    IF NEW.config_type = 'ota_direct' THEN
        IF (
            SELECT COUNT(*) FROM public.ical_configs 
            WHERE property_id = NEW.property_id 
            AND config_type = 'ota_direct' 
            AND is_active = true
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) >= 5 THEN
            RAISE EXCEPTION 'Limite massimo di 5 configurazioni OTA dirette per proprietà raggiunto';
        END IF;
        NEW.max_ical_urls := 5;
    END IF;

    RETURN NEW;
END;
$function$;
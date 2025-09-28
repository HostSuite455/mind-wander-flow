-- Fix RLS policy issue for subscriptions by making the trigger function SECURITY DEFINER

-- Drop existing trigger first
DROP TRIGGER IF EXISTS manage_subscription_on_ical_change ON ical_configs;

-- Recreate the function as SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.manage_subscription_on_ical_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS policies
SET search_path = public
AS $$
DECLARE
    active_configs_count INTEGER;
    new_tier TEXT;
    new_price INTEGER;
    existing_subscription_id UUID;
    target_host_id UUID;
BEGIN
    -- Get the host_id from the property
    SELECT p.host_id INTO target_host_id
    FROM public.properties p
    WHERE p.id = NEW.property_id;
    
    IF target_host_id IS NULL THEN
        RAISE EXCEPTION 'Property not found or host_id is null';
    END IF;
    
    -- Conta le configurazioni attive per questo host
    SELECT COUNT(*) INTO active_configs_count
    FROM public.ical_configs ic
    JOIN public.properties p ON p.id = ic.property_id
    WHERE p.host_id = target_host_id AND ic.is_active = true;
    
    -- Determina il tier
    IF active_configs_count = 1 THEN
        new_tier := 'premium';
    ELSIF active_configs_count > 1 THEN
        new_tier := 'enterprise';
    ELSE
        new_tier := 'free';
    END IF;
    
    -- Calcola il prezzo
    new_price := get_subscription_price(new_tier, active_configs_count);
    
    -- Cerca se esiste già un abbonamento per questo host
    SELECT id INTO existing_subscription_id
    FROM public.subscriptions
    WHERE host_id = target_host_id;
    
    -- Aggiorna o crea l'abbonamento
    IF existing_subscription_id IS NOT NULL THEN
        -- Aggiorna abbonamento esistente
        UPDATE public.subscriptions 
        SET 
            subscription_tier = new_tier,
            price_cents = new_price,
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '1 month',
            updated_at = NOW()
        WHERE id = existing_subscription_id;
    ELSE
        -- Crea nuovo abbonamento
        INSERT INTO public.subscriptions (host_id, subscription_tier, price_cents, current_period_start, current_period_end)
        VALUES (target_host_id, new_tier, new_price, NOW(), NOW() + INTERVAL '1 month');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER manage_subscription_on_ical_change
    AFTER INSERT OR UPDATE ON public.ical_configs
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION public.manage_subscription_on_ical_change();

-- Also need to add host_id to ical_configs for easier access
ALTER TABLE public.ical_configs 
ADD COLUMN IF NOT EXISTS host_id UUID;

-- Update existing records to populate host_id
UPDATE public.ical_configs 
SET host_id = (
    SELECT p.host_id 
    FROM public.properties p 
    WHERE p.id = ical_configs.property_id
)
WHERE host_id IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_ical_configs_host_id ON public.ical_configs(host_id);

-- Create function to automatically set host_id when inserting ical_configs
CREATE OR REPLACE FUNCTION public.set_ical_config_host_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Automatically set host_id from the property
    SELECT p.host_id INTO NEW.host_id
    FROM public.properties p
    WHERE p.id = NEW.property_id;
    
    IF NEW.host_id IS NULL THEN
        RAISE EXCEPTION 'Property not found or host_id is null for property_id: %', NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically set host_id
DROP TRIGGER IF EXISTS set_ical_config_host_id ON ical_configs;
CREATE TRIGGER set_ical_config_host_id
    BEFORE INSERT OR UPDATE ON public.ical_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_ical_config_host_id();
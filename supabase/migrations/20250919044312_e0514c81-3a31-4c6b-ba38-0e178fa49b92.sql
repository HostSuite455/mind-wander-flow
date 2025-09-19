-- Update any existing records with config_type='direct' to 'ota_direct' to match constraints
UPDATE public.ical_configs 
SET config_type = 'ota_direct' 
WHERE config_type = 'direct';
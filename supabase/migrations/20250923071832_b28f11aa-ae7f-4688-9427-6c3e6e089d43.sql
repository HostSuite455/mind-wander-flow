-- Extend properties table with additional fields for property wizard
-- This migration is idempotent and safe to run multiple times

-- Add columns that don't exist yet
DO $$
BEGIN
  -- Check and add bedrooms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bedrooms') THEN
    ALTER TABLE public.properties ADD COLUMN bedrooms integer;
  END IF;

  -- Check and add beds column  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'beds') THEN
    ALTER TABLE public.properties ADD COLUMN beds integer;
  END IF;

  -- Check and add bathrooms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bathrooms') THEN
    ALTER TABLE public.properties ADD COLUMN bathrooms numeric(3,1);
  END IF;

  -- Check and add size_sqm column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'size_sqm') THEN
    ALTER TABLE public.properties ADD COLUMN size_sqm integer;
  END IF;

  -- Check and add country column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'country') THEN
    ALTER TABLE public.properties ADD COLUMN country text;
  END IF;

  -- Check and add lat column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lat') THEN
    ALTER TABLE public.properties ADD COLUMN lat numeric(9,6);
  END IF;

  -- Check and add lng column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lng') THEN
    ALTER TABLE public.properties ADD COLUMN lng numeric(9,6);
  END IF;

  -- Check and add base_price column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'base_price') THEN
    ALTER TABLE public.properties ADD COLUMN base_price numeric(10,2);
  END IF;

  -- Check and add cleaning_fee column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'cleaning_fee') THEN
    ALTER TABLE public.properties ADD COLUMN cleaning_fee numeric(10,2);
  END IF;

  -- Check and add currency column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'currency') THEN
    ALTER TABLE public.properties ADD COLUMN currency text DEFAULT 'EUR';
  END IF;

  -- Check and add check_in_from column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'check_in_from') THEN
    ALTER TABLE public.properties ADD COLUMN check_in_from time;
  END IF;

  -- Check and add check_out_until column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'check_out_until') THEN
    ALTER TABLE public.properties ADD COLUMN check_out_until time;
  END IF;

  -- Check and add amenities column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'amenities') THEN
    ALTER TABLE public.properties ADD COLUMN amenities jsonb DEFAULT '{}';
  END IF;

END $$;

-- Update existing properties to have default currency if null
UPDATE public.properties SET currency = 'EUR' WHERE currency IS NULL;
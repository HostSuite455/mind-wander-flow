-- Property Wizard Fields Migration
-- Adds all the missing columns needed for the property wizard functionality

-- Add new columns to properties table if they don't exist
DO $$ 
BEGIN
  -- Capacity fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'guests') THEN
    ALTER TABLE public.properties ADD COLUMN guests int;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bedrooms') THEN
    ALTER TABLE public.properties ADD COLUMN bedrooms int;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'beds') THEN
    ALTER TABLE public.properties ADD COLUMN beds int;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bathrooms') THEN
    ALTER TABLE public.properties ADD COLUMN bathrooms numeric(3,1);
  END IF;
  
  -- Location and size fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'size_sqm') THEN
    ALTER TABLE public.properties ADD COLUMN size_sqm int;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'address') THEN
    ALTER TABLE public.properties ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'city') THEN
    ALTER TABLE public.properties ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'country') THEN
    ALTER TABLE public.properties ADD COLUMN country text;
  END IF;
  
  -- Coordinates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lat') THEN
    ALTER TABLE public.properties ADD COLUMN lat numeric(9,6);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lng') THEN
    ALTER TABLE public.properties ADD COLUMN lng numeric(9,6);
  END IF;
  
  -- Pricing fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'base_price') THEN
    ALTER TABLE public.properties ADD COLUMN base_price numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'cleaning_fee') THEN
    ALTER TABLE public.properties ADD COLUMN cleaning_fee numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'currency') THEN
    ALTER TABLE public.properties ADD COLUMN currency text DEFAULT 'EUR';
  END IF;
  
  -- Check-in/out times
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'check_in_from') THEN
    ALTER TABLE public.properties ADD COLUMN check_in_from time;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'check_out_until') THEN
    ALTER TABLE public.properties ADD COLUMN check_out_until time;
  END IF;
  
  -- Amenities as JSONB
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'amenities') THEN
    ALTER TABLE public.properties ADD COLUMN amenities jsonb DEFAULT '{}';
  END IF;
  
  -- Status field for draft/active
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'status') THEN
    ALTER TABLE public.properties ADD COLUMN status text DEFAULT 'active';
  END IF;
  
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_country ON public.properties(country);
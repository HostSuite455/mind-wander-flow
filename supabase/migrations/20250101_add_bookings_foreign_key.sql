-- Add missing foreign key constraint between bookings and properties
-- This fixes the relationship query issue in the calendar

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_property_id_fkey' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT bookings_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure the index exists for performance
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
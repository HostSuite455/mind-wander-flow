-- Create bookings table for direct bookings (non-iCal)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER,
  adults_count INTEGER,
  children_count INTEGER,
  total_amount NUMERIC,
  special_requests TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  channel TEXT,
  booking_reference TEXT,
  external_booking_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Hosts can manage their own property bookings
CREATE POLICY "Hosts can view their bookings"
  ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = bookings.property_id AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can insert bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = bookings.property_id AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update their bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = bookings.property_id AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can delete their bookings"
  ON public.bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = bookings.property_id AND p.host_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_bookings_property_dates ON public.bookings(property_id, check_in, check_out);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
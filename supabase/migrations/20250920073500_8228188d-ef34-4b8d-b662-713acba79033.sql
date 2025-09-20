-- Create bookings table to store reservation data from Smoobu API
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL,
  host_id uuid NOT NULL,
  external_booking_id text NOT NULL, -- Smoobu booking ID
  guest_name text,
  guest_email text,
  guest_phone text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests_count integer DEFAULT 1,
  adults_count integer DEFAULT 1,
  children_count integer DEFAULT 0,
  channel text, -- 'airbnb', 'booking', 'vrbo', etc.
  booking_status text DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'pending'
  total_price decimal(10,2),
  currency text DEFAULT 'EUR',
  booking_reference text, -- Platform specific reference
  special_requests text,
  last_sync_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "Hosts can view their own property bookings" 
ON public.bookings 
FOR SELECT 
USING (host_id = auth.uid());

CREATE POLICY "Hosts can insert bookings for their properties" 
ON public.bookings 
FOR INSERT 
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their own property bookings" 
ON public.bookings 
FOR UPDATE 
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can delete their own property bookings" 
ON public.bookings 
FOR DELETE 
USING (host_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX idx_bookings_host_id ON public.bookings(host_id);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX idx_bookings_external_id ON public.bookings(external_booking_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add table to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
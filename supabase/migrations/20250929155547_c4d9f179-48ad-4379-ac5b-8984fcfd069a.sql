-- Team Cleaner + Auto-assign + Ledger pagamenti (MVP)

-- Relationship property-cleaner (for auto-assign and visibility)
CREATE TABLE IF NOT EXISTS public.cleaner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  cleaner_id uuid NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  weight integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (property_id, cleaner_id)
);

-- Rates (per-task MVP). Extendable for property
CREATE TABLE IF NOT EXISTS public.cleaner_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id uuid NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  rate_type text NOT NULL DEFAULT 'per_task' CHECK (rate_type IN ('per_task')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  created_at timestamptz DEFAULT now()
);

-- Accounting for tasks (calculated when task moves to 'done')
CREATE TABLE IF NOT EXISTS public.task_accounting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.cleaning_tasks(id) ON DELETE CASCADE,
  host_amount_cents integer NOT NULL,
  cleaner_earnings_cents integer NOT NULL,
  platform_fee_host_cents integer NOT NULL,
  platform_fee_cleaner_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','invoiced','paid')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (task_id)
);

-- Aggregate payouts for cleaner (weekly)
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id uuid NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid')),
  stripe_transfer_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.cleaner_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_accounting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies (owner manages their team; cleaner sees own payouts)
CREATE POLICY "owner_manage_assignments" ON public.cleaner_assignments
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = cleaner_assignments.property_id AND p.host_id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = cleaner_assignments.property_id AND p.host_id = auth.uid()
  )
);

CREATE POLICY "owner_manage_rates" ON public.cleaner_rates
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.cleaners c 
    JOIN public.properties p ON (p.host_id = auth.uid()) 
    WHERE cleaner_rates.cleaner_id = c.id AND c.owner_id = p.host_id
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cleaners c 
    JOIN public.properties p ON (p.host_id = auth.uid()) 
    WHERE cleaner_rates.cleaner_id = c.id AND c.owner_id = p.host_id
  )
);

CREATE POLICY "owner_manage_task_accounting" ON public.task_accounting
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.cleaning_tasks t 
    JOIN public.properties p ON (p.id = t.property_id) 
    WHERE t.id = task_accounting.task_id AND p.host_id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cleaning_tasks t 
    JOIN public.properties p ON (p.id = t.property_id) 
    WHERE t.id = task_accounting.task_id AND p.host_id = auth.uid()
  )
);

CREATE POLICY "owner_view_payouts" ON public.payouts
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cleaners c 
    WHERE payouts.cleaner_id = c.id AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "cleaner_view_own_payouts" ON public.payouts
FOR SELECT 
USING (
  payouts.cleaner_id IN (
    SELECT c.id FROM public.cleaners c WHERE c.user_id = auth.uid()
  )
);

-- Function to calculate task accounting when task is completed
CREATE OR REPLACE FUNCTION public.calculate_task_accounting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleaner_rate_amount integer;
    earnings_cents integer;
    platform_fee_cleaner integer;
    platform_fee_host integer;
    host_total integer;
BEGIN
    -- Only calculate when task moves to 'done' status
    IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
        -- Get cleaner rate (property-specific first, then default)
        SELECT amount_cents INTO cleaner_rate_amount
        FROM public.cleaner_rates
        WHERE cleaner_id = NEW.assigned_cleaner_id
        AND (property_id = NEW.property_id OR property_id IS NULL)
        ORDER BY property_id NULLS LAST
        LIMIT 1;

        -- Use default rate if no rate found
        IF cleaner_rate_amount IS NULL THEN
            cleaner_rate_amount := 3000; -- €30.00 default
        END IF;

        earnings_cents := cleaner_rate_amount;
        platform_fee_cleaner := ROUND(earnings_cents * 0.05); -- 5% cleaner fee
        platform_fee_host := ROUND((earnings_cents + platform_fee_cleaner) * 0.10); -- 10% host fee
        host_total := earnings_cents + platform_fee_cleaner + platform_fee_host;

        -- Insert or update task accounting
        INSERT INTO public.task_accounting (
            task_id,
            cleaner_earnings_cents,
            platform_fee_cleaner_cents,
            platform_fee_host_cents,
            host_amount_cents,
            status
        ) VALUES (
            NEW.id,
            earnings_cents,
            platform_fee_cleaner,
            platform_fee_host,
            host_total,
            'pending'
        ) ON CONFLICT (task_id) DO UPDATE SET
            cleaner_earnings_cents = EXCLUDED.cleaner_earnings_cents,
            platform_fee_cleaner_cents = EXCLUDED.platform_fee_cleaner_cents,
            platform_fee_host_cents = EXCLUDED.platform_fee_host_cents,
            host_amount_cents = EXCLUDED.host_amount_cents;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for automatic accounting calculation
DROP TRIGGER IF EXISTS trigger_calculate_task_accounting ON public.cleaning_tasks;
CREATE TRIGGER trigger_calculate_task_accounting
    AFTER UPDATE ON public.cleaning_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_task_accounting();
-- ============================================
-- HOSTSUITE ADVANCED MODULES DATABASE SCHEMA
-- ============================================

-- 1. CHECKLISTS SYSTEM
-- ============================================

-- Tabella templates checklist
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cleaning', 'maintenance', 'inspection', 'checkout')),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella items della checklist
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requires_photo BOOLEAN DEFAULT false,
  requires_note BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella checklist assegnate ai task
CREATE TABLE IF NOT EXISTS public.task_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_task_id UUID REFERENCES public.cleaning_tasks(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.checklist_templates(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella completamenti item
CREATE TABLE IF NOT EXISTS public.checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_checklist_id UUID REFERENCES public.task_checklists(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.checklist_items(id),
  completed BOOLEAN DEFAULT false,
  photo_url TEXT,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INVENTORY MANAGEMENT
-- ============================================

-- Tabella inventory items
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('linens', 'toiletries', 'consumables', 'equipment')),
  current_stock INTEGER DEFAULT 0,
  min_threshold INTEGER DEFAULT 5,
  max_threshold INTEGER DEFAULT 50,
  unit TEXT DEFAULT 'pieces',
  cost_per_unit DECIMAL(10,2),
  supplier_info JSONB DEFAULT '{}',
  auto_reorder BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella stock movements
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  cleaner_id UUID REFERENCES public.cleaners(id),
  cleaning_task_id UUID REFERENCES public.cleaning_tasks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TEAM MANAGEMENT (estensione cleaners)
-- ============================================

-- Aggiungiamo campi alla tabella cleaners esistente
ALTER TABLE public.cleaners 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"whatsapp": true, "email": true}',
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}';

-- Tabella activity log
CREATE TABLE IF NOT EXISTS public.cleaner_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID REFERENCES public.cleaners(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  cleaning_task_id UUID REFERENCES public.cleaning_tasks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PAYMENTS SYSTEM
-- ============================================

-- Tabella payment methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank_transfer', 'paypal', 'revolut', 'cash', 'stripe')),
  details JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella payment schedules per cleaner
CREATE TABLE IF NOT EXISTS public.cleaner_payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID REFERENCES public.cleaners(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'per_task')),
  auto_pay BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Checklist Templates
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage their property checklists"
ON public.checklist_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = checklist_templates.property_id
    AND p.host_id = auth.uid()
  )
);

-- Checklist Items
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage checklist items"
ON public.checklist_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.checklist_templates ct
    JOIN public.properties p ON p.id = ct.property_id
    WHERE ct.id = checklist_items.template_id
    AND p.host_id = auth.uid()
  )
);

-- Task Checklists
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts and cleaners view task checklists"
ON public.task_checklists
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cleaning_tasks ct
    JOIN public.properties p ON p.id = ct.property_id
    WHERE ct.id = task_checklists.cleaning_task_id
    AND (p.host_id = auth.uid() OR ct.assigned_cleaner_id IN (
      SELECT id FROM public.cleaners WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Hosts manage task checklists"
ON public.task_checklists
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cleaning_tasks ct
    JOIN public.properties p ON p.id = ct.property_id
    WHERE ct.id = task_checklists.cleaning_task_id
    AND p.host_id = auth.uid()
  )
);

-- Checklist Completions
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cleaners complete checklist items"
ON public.checklist_completions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.task_checklists tc
    JOIN public.cleaning_tasks ct ON ct.id = tc.cleaning_task_id
    WHERE tc.id = checklist_completions.task_checklist_id
    AND ct.assigned_cleaner_id IN (
      SELECT id FROM public.cleaners WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Hosts view checklist completions"
ON public.checklist_completions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.task_checklists tc
    JOIN public.cleaning_tasks ct ON ct.id = tc.cleaning_task_id
    JOIN public.properties p ON p.id = ct.property_id
    WHERE tc.id = checklist_completions.task_checklist_id
    AND p.host_id = auth.uid()
  )
);

-- Inventory Items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage inventory"
ON public.inventory_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = inventory_items.property_id
    AND p.host_id = auth.uid()
  )
);

-- Inventory Movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts and cleaners view inventory movements"
ON public.inventory_movements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    JOIN public.properties p ON p.id = ii.property_id
    WHERE ii.id = inventory_movements.item_id
    AND (p.host_id = auth.uid() OR inventory_movements.cleaner_id IN (
      SELECT id FROM public.cleaners WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Hosts and cleaners create inventory movements"
ON public.inventory_movements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    JOIN public.properties p ON p.id = ii.property_id
    WHERE ii.id = inventory_movements.item_id
    AND (p.host_id = auth.uid() OR inventory_movements.cleaner_id IN (
      SELECT id FROM public.cleaners WHERE user_id = auth.uid()
    ))
  )
);

-- Cleaner Activity Logs
ALTER TABLE public.cleaner_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts view cleaner activity"
ON public.cleaner_activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cleaners c
    WHERE c.id = cleaner_activity_logs.cleaner_id
    AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Cleaners create their own activity logs"
ON public.cleaner_activity_logs
FOR INSERT
WITH CHECK (
  cleaner_id IN (
    SELECT id FROM public.cleaners WHERE user_id = auth.uid()
  )
);

-- Payment Methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage payment methods"
ON public.payment_methods
FOR ALL
USING (host_id = auth.uid());

-- Cleaner Payment Schedules
ALTER TABLE public.cleaner_payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage cleaner payment schedules"
ON public.cleaner_payment_schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cleaners c
    WHERE c.id = cleaner_payment_schedules.cleaner_id
    AND c.owner_id = auth.uid()
  )
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_checklist_templates_property ON public.checklist_templates(property_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_template ON public.checklist_items(template_id);
CREATE INDEX IF NOT EXISTS idx_task_checklists_task ON public.task_checklists(cleaning_task_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_property ON public.inventory_items(property_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_cleaner_activity_logs_cleaner ON public.cleaner_activity_logs(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_host ON public.payment_methods(host_id);
CREATE INDEX IF NOT EXISTS idx_cleaner_payment_schedules_cleaner ON public.cleaner_payment_schedules(cleaner_id);
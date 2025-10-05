-- ========================================
-- FASE 3: Estendi cleaning_tasks per workflow avanzato
-- ========================================

-- Add new workflow tracking columns FIRST
ALTER TABLE cleaning_tasks 
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_duration_min INTEGER,
  ADD COLUMN IF NOT EXISTS photos_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS issues_notes TEXT;

-- THEN backfill existing completed tasks
UPDATE cleaning_tasks
SET 
  started_at = COALESCE(actual_start, scheduled_start),
  completed_at = COALESCE(actual_end, scheduled_end),
  actual_duration_min = COALESCE(duration_min, 120)
WHERE status = 'done' AND started_at IS NULL;

-- Add constraint: minimum 60 minutes for completed tasks
ALTER TABLE cleaning_tasks
  DROP CONSTRAINT IF EXISTS check_min_duration;

ALTER TABLE cleaning_tasks
  ADD CONSTRAINT check_min_duration 
  CHECK (
    status != 'done' OR 
    started_at IS NULL OR 
    completed_at IS NULL OR
    EXTRACT(EPOCH FROM (completed_at - started_at)) >= 3600
  );

-- ========================================
-- FASE 4: Tabella notifiche host
-- ========================================

CREATE TABLE IF NOT EXISTS host_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  task_id UUID REFERENCES cleaning_tasks(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Host vede solo le proprie notifiche
ALTER TABLE host_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY host_notifications_select ON host_notifications
  FOR SELECT USING (host_id = auth.uid());

CREATE POLICY host_notifications_update ON host_notifications
  FOR UPDATE USING (host_id = auth.uid());

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_host_notifications_host_id 
  ON host_notifications(host_id, created_at DESC);

-- ========================================
-- FASE 5: Tabella requisiti foto per stanza
-- ========================================

CREATE TABLE IF NOT EXISTS property_photo_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Host gestisce solo proprie property
ALTER TABLE property_photo_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY photo_requirements_host_manage ON property_photo_requirements
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE host_id = auth.uid()
    )
  );

-- Cleaners possono leggere i requisiti delle property assegnate
CREATE POLICY photo_requirements_cleaner_read ON property_photo_requirements
  FOR SELECT USING (
    property_id IN (
      SELECT DISTINCT ca.property_id 
      FROM cleaner_assignments ca
      JOIN cleaners c ON c.id = ca.cleaner_id
      WHERE c.user_id = auth.uid() AND ca.active = true
    )
  );

-- Unique constraint: una sola entry per room per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_photo_requirements_unique 
  ON property_photo_requirements(property_id, room_name);
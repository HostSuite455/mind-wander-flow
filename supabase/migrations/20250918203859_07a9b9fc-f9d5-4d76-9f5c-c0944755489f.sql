-- RLS reset for unanswered_questions
ALTER TABLE public.unanswered_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow guests to insert unanswered questions" ON public.unanswered_questions;
DROP POLICY IF EXISTS "Allow hosts to view unanswered questions" ON public.unanswered_questions;
DROP POLICY IF EXISTS "Allow hosts to update unanswered questions" ON public.unanswered_questions;
DROP POLICY IF EXISTS "guests_insert_questions" ON public.unanswered_questions;
DROP POLICY IF EXISTS "hosts_see_property_questions" ON public.unanswered_questions;
DROP POLICY IF EXISTS "hosts_update_property_questions" ON public.unanswered_questions;
DROP POLICY IF EXISTS "uq_select" ON public.unanswered_questions;
DROP POLICY IF EXISTS "uq_insert" ON public.unanswered_questions;
DROP POLICY IF EXISTS "uq_update" ON public.unanswered_questions;
DROP POLICY IF EXISTS "uq_delete" ON public.unanswered_questions;

-- Select only questions tied to my properties (hosts)
CREATE POLICY "uq_select" ON public.unanswered_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = unanswered_questions.property_id
        AND p.host_id = auth.uid()
    )
  );

-- Allow guests to insert questions for their active stay
CREATE POLICY "uq_insert" ON public.unanswered_questions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guest_codes gc
      WHERE gc.code = unanswered_questions.guest_code
        AND gc.property_id = unanswered_questions.property_id
        AND now() >= gc.check_in
        AND now() <= gc.check_out
    )
  );

-- Allow hosts to update questions for their properties
CREATE POLICY "uq_update" ON public.unanswered_questions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = unanswered_questions.property_id
        AND p.host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = unanswered_questions.property_id
        AND p.host_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_uq_property_id ON public.unanswered_questions(property_id);
CREATE INDEX IF NOT EXISTS idx_uq_created_at ON public.unanswered_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uq_status_created ON public.unanswered_questions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uq_guest_code ON public.unanswered_questions(guest_code);

-- Index on properties for the foreign key lookups
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);

-- Index on guest_codes for the foreign key lookups
CREATE INDEX IF NOT EXISTS idx_guest_codes_property_code ON public.guest_codes(property_id, code);
CREATE INDEX IF NOT EXISTS idx_guest_codes_dates ON public.guest_codes(check_in, check_out);
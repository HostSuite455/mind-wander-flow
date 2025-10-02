-- CRITICAL FIX: Replace partial unique index with full unique index
-- This enables ON CONFLICT upsert to work properly for both active and cancelled events

-- Drop the problematic partial index (with is_active = true filter)
DROP INDEX IF EXISTS public.uq_calendar_blocks_src_ext;

-- Create full unique index (no is_active filter) for proper deduplication
CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_blocks_src_ext_full
ON public.calendar_blocks(property_id, source, external_id) 
WHERE external_id IS NOT NULL;

-- Keep performance index for date queries
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_dates 
ON public.calendar_blocks(property_id, start_date, end_date);

-- OPTIONAL: Remove duplicate indexes if they exist
DROP INDEX IF EXISTS public.idx_calendar_blocks_property_dates;
DROP INDEX IF EXISTS public.idx_cb_property_dates;

COMMENT ON INDEX uq_calendar_blocks_src_ext_full IS 'Full unique constraint for iCal sync deduplication - works with ON CONFLICT for both active and cancelled events';
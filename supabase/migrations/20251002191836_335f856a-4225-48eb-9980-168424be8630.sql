-- Fix critical: add unique constraint for iCal deduplication
-- This enables ON CONFLICT in upsert operations

-- Add unique partial index for deduplication based on (property_id, source, external_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_blocks_src_ext 
ON public.calendar_blocks(property_id, source, external_id) 
WHERE external_id IS NOT NULL AND is_active = true;

-- Add index for date-based queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_dates 
ON public.calendar_blocks(property_id, start_date, end_date);

-- Add comment for clarity
COMMENT ON INDEX uq_calendar_blocks_src_ext IS 'Unique constraint for iCal sync deduplication - ensures no duplicate blocks from same source';

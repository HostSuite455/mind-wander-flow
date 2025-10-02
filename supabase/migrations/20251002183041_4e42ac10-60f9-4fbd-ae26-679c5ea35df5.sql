-- Add external_id column to calendar_blocks for robust iCal event deduplication
ALTER TABLE public.calendar_blocks 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create index for deduplication lookups (property + source + external_id)
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_src_ext 
ON public.calendar_blocks(property_id, source, external_id) 
WHERE external_id IS NOT NULL;

-- Create unique constraint to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_blocks_src_ext 
ON public.calendar_blocks(property_id, source, external_id) 
WHERE external_id IS NOT NULL AND is_active = true;

-- Add index for active blocks filtering (performance optimization)
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_active 
ON public.calendar_blocks(property_id, is_active, start_date, end_date) 
WHERE is_active = true;
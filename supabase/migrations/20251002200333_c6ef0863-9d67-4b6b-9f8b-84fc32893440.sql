-- Fix 42P10 error: Drop partial index and create real UNIQUE constraint
-- This allows ON CONFLICT to work properly in fn_create_cleaning_task_from_block trigger

-- Drop the problematic partial unique index if it exists
DROP INDEX IF EXISTS public.idx_cleaning_tasks_block_type;

-- Create a real UNIQUE constraint that works with ON CONFLICT
-- This constraint allows multiple NULL values for calendar_block_id (no conflict)
-- but ensures uniqueness when calendar_block_id IS NOT NULL
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_cleaning_tasks_block_type'
  ) THEN
    ALTER TABLE public.cleaning_tasks
    ADD CONSTRAINT uq_cleaning_tasks_block_type 
    UNIQUE (calendar_block_id, type);
  END IF;
END $$;
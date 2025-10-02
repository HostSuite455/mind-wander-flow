-- Add calendar_block_id to cleaning_tasks for linking
ALTER TABLE public.cleaning_tasks 
ADD COLUMN IF NOT EXISTS calendar_block_id uuid REFERENCES public.calendar_blocks(id) ON DELETE SET NULL;

-- Add unique constraint to prevent duplicate tasks for same block
CREATE UNIQUE INDEX IF NOT EXISTS idx_cleaning_tasks_block_type 
ON public.cleaning_tasks(calendar_block_id, type) 
WHERE calendar_block_id IS NOT NULL;

-- Add performance index for calendar_blocks queries
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_property_dates 
ON public.calendar_blocks(property_id, start_date, end_date);

-- Add index for active blocks
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_active 
ON public.calendar_blocks(property_id, is_active) 
WHERE is_active = true;

-- Function to automatically create cleaning task from calendar block
CREATE OR REPLACE FUNCTION public.fn_create_cleaning_task_from_block()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  turnover_duration_min integer;
BEGIN
  -- Only process iCal blocks (source starts with 'ical')
  IF NEW.source NOT LIKE 'ical%' OR NEW.is_active = false THEN
    RETURN NEW;
  END IF;
  
  -- Get default turnover duration for property
  SELECT default_turnover_duration_min INTO turnover_duration_min
  FROM public.properties 
  WHERE id = NEW.property_id;
  
  IF turnover_duration_min IS NULL THEN 
    turnover_duration_min := 120; -- Default 2 hours
  END IF;
  
  -- Create cleaning task for check-out day
  INSERT INTO public.cleaning_tasks (
    property_id,
    calendar_block_id,
    type,
    scheduled_start,
    scheduled_end,
    duration_min,
    billable_min,
    status
  )
  VALUES (
    NEW.property_id,
    NEW.id,
    'turnover',
    NEW.end_date,
    NEW.end_date + make_interval(mins => turnover_duration_min),
    turnover_duration_min,
    turnover_duration_min,
    'todo'
  )
  ON CONFLICT (calendar_block_id, type) DO UPDATE
  SET scheduled_start = EXCLUDED.scheduled_start,
      scheduled_end = EXCLUDED.scheduled_end,
      duration_min = EXCLUDED.duration_min,
      billable_min = EXCLUDED.billable_min,
      status = CASE 
        WHEN public.cleaning_tasks.status = 'done' THEN 'done' 
        ELSE 'todo' 
      END;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic task creation
DROP TRIGGER IF EXISTS trg_create_cleaning_task_from_block ON public.calendar_blocks;
CREATE TRIGGER trg_create_cleaning_task_from_block
AFTER INSERT OR UPDATE ON public.calendar_blocks
FOR EACH ROW
EXECUTE FUNCTION public.fn_create_cleaning_task_from_block();

-- Function to handle block deletions/deactivations
CREATE OR REPLACE FUNCTION public.fn_handle_block_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If block is deleted or deactivated, mark related tasks as blocked
  IF (TG_OP = 'DELETE') OR (NEW.is_active = false AND OLD.is_active = true) THEN
    UPDATE public.cleaning_tasks
    SET status = 'blocked'
    WHERE calendar_block_id = COALESCE(NEW.id, OLD.id)
      AND status != 'done';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for block deletion handling
DROP TRIGGER IF EXISTS trg_handle_block_deletion ON public.calendar_blocks;
CREATE TRIGGER trg_handle_block_deletion
AFTER UPDATE OR DELETE ON public.calendar_blocks
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_block_deletion();
-- FASE 3: Auto-assignment cleaner per cleaning tasks
-- Modifico il trigger per assegnare automaticamente un cleaner quando viene creato un task

CREATE OR REPLACE FUNCTION public.fn_create_cleaning_task_from_block()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  turnover_duration_min integer;
  assigned_cleaner uuid;
  active_cleaners_count integer;
  random_index integer;
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
  
  -- Try to auto-assign a cleaner using weighted random selection
  SELECT COUNT(*) INTO active_cleaners_count
  FROM public.cleaner_assignments ca
  JOIN public.cleaners c ON c.id = ca.cleaner_id
  WHERE ca.property_id = NEW.property_id 
    AND ca.active = true;
  
  IF active_cleaners_count > 0 THEN
    -- Get a random cleaner weighted by their weight
    SELECT ca.cleaner_id INTO assigned_cleaner
    FROM public.cleaner_assignments ca
    JOIN public.cleaners c ON c.id = ca.cleaner_id
    WHERE ca.property_id = NEW.property_id 
      AND ca.active = true
    ORDER BY RANDOM() * ca.weight DESC
    LIMIT 1;
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
    status,
    assigned_cleaner_id
  )
  VALUES (
    NEW.property_id,
    NEW.id,
    'turnover',
    NEW.end_date,
    NEW.end_date + make_interval(mins => turnover_duration_min),
    turnover_duration_min,
    turnover_duration_min,
    'todo',
    assigned_cleaner  -- NULL if no cleaner available, auto-assigned otherwise
  )
  ON CONFLICT (calendar_block_id, type) DO UPDATE
  SET scheduled_start = EXCLUDED.scheduled_start,
      scheduled_end = EXCLUDED.scheduled_end,
      duration_min = EXCLUDED.duration_min,
      billable_min = EXCLUDED.billable_min,
      assigned_cleaner_id = COALESCE(EXCLUDED.assigned_cleaner_id, cleaning_tasks.assigned_cleaner_id),
      status = CASE 
        WHEN public.cleaning_tasks.status = 'done' THEN 'done' 
        ELSE 'todo' 
      END;
  
  RETURN NEW;
END;
$function$;
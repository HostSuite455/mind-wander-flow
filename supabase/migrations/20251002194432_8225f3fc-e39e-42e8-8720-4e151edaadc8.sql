-- FASE 1: FIX DEFINITIVO DATABASE PER ICAL SYNC
-- Problema: ON CONFLICT richiede un CONSTRAINT UNIQUE, non un indice parziale
-- Soluzione: Creare constraint reale su (property_id, source, external_id)

-- Step 1: Rimuovere indici parziali esistenti (non compatibili con ON CONFLICT)
DROP INDEX IF EXISTS public.uq_calendar_blocks_src_ext_full;
DROP INDEX IF EXISTS public.idx_calendar_blocks_src_ext;

-- Step 2: Rimuovere eventuali indici duplicati su date
DROP INDEX IF EXISTS public.idx_calendar_blocks_dates;

-- Step 3: Creare CONSTRAINT UNIQUE reale (compatibile con ON CONFLICT)
-- Questo consente l'upsert corretto in ics-sync edge function
ALTER TABLE public.calendar_blocks
ADD CONSTRAINT uq_calendar_blocks_dedup 
UNIQUE (property_id, source, external_id);

-- Step 4: Creare indice per performance su query per date
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_property_dates 
ON public.calendar_blocks(property_id, start_date, end_date) 
WHERE is_active = true;

-- Step 5: Creare indice per query su source (utile per filtrare per canale)
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_source 
ON public.calendar_blocks(property_id, source) 
WHERE is_active = true;

-- VERIFICA: Il constraint creato funzionerà con questa sintassi in ics-sync:
-- .upsert(blockData, { onConflict: 'property_id,source,external_id' })

-- COMPORTAMENTO ATTESO POST-MIGRAZIONE:
-- 1. Smoobu sync: ~40 eventi creati (non più skip upsert_error)
-- 2. Airbnb sync: ~11 eventi creati (non più skip upsert_error)
-- 3. Trigger fn_create_cleaning_task_from_block genera task automaticamente
-- 4. Calendario host visualizza tutti i blocchi iCal
-- 5. Dashboard cleaner mostra i task di turnover generati

COMMENT ON CONSTRAINT uq_calendar_blocks_dedup ON public.calendar_blocks IS 
'Constraint UNIQUE per deduplicazione blocchi iCal. Necessario per ON CONFLICT in ics-sync edge function.';
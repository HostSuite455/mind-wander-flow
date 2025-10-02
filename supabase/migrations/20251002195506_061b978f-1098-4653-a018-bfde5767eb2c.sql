-- FASE B: ABILITAZIONE TRIGGER MANCANTI PER AUTOMAZIONI CALENDARIO

-- ============================================================================
-- 1. TRIGGER PER GENERAZIONE AUTOMATICA CLEANING TASKS DA CALENDAR BLOCKS
-- ============================================================================

-- Verifica se il trigger esiste già, altrimenti crealo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_create_cleaning_task_from_block'
  ) THEN
    CREATE TRIGGER trigger_create_cleaning_task_from_block
      AFTER INSERT OR UPDATE ON public.calendar_blocks
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_create_cleaning_task_from_block();
    
    RAISE NOTICE 'Trigger trigger_create_cleaning_task_from_block created';
  ELSE
    RAISE NOTICE 'Trigger trigger_create_cleaning_task_from_block already exists';
  END IF;
END $$;

-- ============================================================================
-- 2. TRIGGER PER GESTIONE BLOCCHI CANCELLATI/DISATTIVATI
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_handle_block_deletion'
  ) THEN
    CREATE TRIGGER trigger_handle_block_deletion
      AFTER DELETE OR UPDATE OF is_active ON public.calendar_blocks
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_handle_block_deletion();
    
    RAISE NOTICE 'Trigger trigger_handle_block_deletion created';
  ELSE
    RAISE NOTICE 'Trigger trigger_handle_block_deletion already exists';
  END IF;
END $$;

-- ============================================================================
-- 3. TRIGGER PER AGGIORNAMENTO TIMESTAMP ICAL_URLS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_ical_urls_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_ical_urls_updated_at
      BEFORE UPDATE ON public.ical_urls
      FOR EACH ROW
      EXECUTE FUNCTION public.update_ical_urls_updated_at();
    
    RAISE NOTICE 'Trigger trigger_update_ical_urls_updated_at created';
  ELSE
    RAISE NOTICE 'Trigger trigger_update_ical_urls_updated_at already exists';
  END IF;
END $$;

-- ============================================================================
-- 4. TRIGGER PER GESTIONE SUBSCRIPTION AL CAMBIO ICAL_CONFIG
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_manage_subscription_on_ical_change'
  ) THEN
    CREATE TRIGGER trigger_manage_subscription_on_ical_change
      AFTER INSERT OR UPDATE ON public.ical_configs
      FOR EACH ROW
      EXECUTE FUNCTION public.manage_subscription_on_ical_change();
    
    RAISE NOTICE 'Trigger trigger_manage_subscription_on_ical_change created';
  ELSE
    RAISE NOTICE 'Trigger trigger_manage_subscription_on_ical_change already exists';
  END IF;
END $$;

-- ============================================================================
-- 5. VERIFICA CONSTRAINT UNIQUE PER DEDUPLICAZIONE
-- ============================================================================

-- Verifica che il constraint uq_calendar_blocks_dedup esista
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_calendar_blocks_dedup'
  ) THEN
    ALTER TABLE public.calendar_blocks
    ADD CONSTRAINT uq_calendar_blocks_dedup 
    UNIQUE (property_id, source, external_id);
    
    RAISE NOTICE 'Constraint uq_calendar_blocks_dedup created';
  ELSE
    RAISE NOTICE 'Constraint uq_calendar_blocks_dedup already exists';
  END IF;
END $$;

-- ============================================================================
-- COMMENTI E DOCUMENTAZIONE
-- ============================================================================

COMMENT ON TRIGGER trigger_create_cleaning_task_from_block ON public.calendar_blocks IS 
'Genera automaticamente cleaning_tasks per ogni blocco iCal con check-out';

COMMENT ON TRIGGER trigger_handle_block_deletion ON public.calendar_blocks IS 
'Marca i cleaning_tasks come blocked quando il blocco viene cancellato o disattivato';

COMMENT ON TRIGGER trigger_update_ical_urls_updated_at ON public.ical_urls IS 
'Aggiorna automaticamente il campo updated_at su ogni modifica';

COMMENT ON TRIGGER trigger_manage_subscription_on_ical_change ON public.ical_configs IS 
'Aggiorna il subscription_tier del host quando cambia il numero di configurazioni iCal attive';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type CalendarBlock = {
  id: string;
  host_id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  source: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
};

const isDebug = () => localStorage.getItem('debug') === '1';

const debugToast = (action: string, error: any) => {
  if (isDebug()) {
    console.error(`[supaBlocks] ${action}:`, error);
    toast({
      title: `Debug: ${action} Error`,
      description: error.message || JSON.stringify(error),
      variant: "destructive"
    });
  }
};

/** List calendar blocks for a property */
export async function listCalendarBlocks(propertyId: string): Promise<{ data: CalendarBlock[], error: any }> {
  try {
    const { data, error } = await supabase
      .from('calendar_blocks')
      .select('*')
      .eq('property_id', propertyId)
      .order('start_date', { ascending: true });

    if (error) {
      debugToast('listCalendarBlocks', error);
      return { data: [], error };
    }

    return { data: data as CalendarBlock[] ?? [], error: null };
  } catch (err) {
    debugToast('listCalendarBlocks', err);
    return { data: [], error: err };
  }
}

/** Create a new calendar block */
export async function createCalendarBlock({
  property_id,
  start_date,
  end_date,
  reason,
  source = 'manual',
  is_active = true
}: {
  property_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  source?: string;
  is_active?: boolean;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('calendar_blocks')
      .insert([{
        host_id: user.id,
        property_id,
        start_date,
        end_date,
        reason,
        source,
        is_active,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      debugToast('createCalendarBlock', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il blocco calendario",
        variant: "destructive"
      });
      return { data: null, error };
    }

    toast({
      title: "Successo",
      description: "Blocco calendario creato con successo"
    });

    return { data, error: null };
  } catch (err) {
    debugToast('createCalendarBlock', err);
    return { data: null, error: err };
  }
}

/** Update a calendar block */
export async function updateCalendarBlock(id: string, updates: Partial<{
  start_date: string;
  end_date: string;
  reason: string;
  is_active: boolean;
}>) {
  try {
    const { data, error } = await supabase
      .from('calendar_blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      debugToast('updateCalendarBlock', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il blocco calendario",
        variant: "destructive"
      });
      return { data: null, error };
    }

    toast({
      title: "Successo",
      description: "Blocco calendario aggiornato con successo"
    });

    return { data, error: null };
  } catch (err) {
    debugToast('updateCalendarBlock', err);
    return { data: null, error: err };
  }
}

/** Delete a calendar block */
export async function deleteCalendarBlock(id: string) {
  try {
    const { error } = await supabase
      .from('calendar_blocks')
      .delete()
      .eq('id', id);

    if (error) {
      debugToast('deleteCalendarBlock', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il blocco calendario",
        variant: "destructive"
      });
      return { error };
    }

    toast({
      title: "Successo",
      description: "Blocco calendario eliminato con successo"
    });

    return { error: null };
  } catch (err) {
    debugToast('deleteCalendarBlock', err);
    return { error: err };
  }
}

/** Toggle calendar block active status */
export async function toggleCalendarBlock(id: string, is_active: boolean) {
  return updateCalendarBlock(id, { is_active });
}
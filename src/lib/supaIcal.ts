import { supabase } from "@/integrations/supabase/client";
import { supaSelect } from "@/lib/supaSafe";
import { toast } from "@/hooks/use-toast";

export type IcalUrl = {
  id: string;
  ical_config_id: string;
  url: string;
  source: string;
  is_active: boolean;
  is_primary: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
};

export type IcalConfigType = 'ota_direct' | 'channel_manager';

export type IcalConfig = {
  id: string;
  property_id: string;
  is_active: boolean;
  config_type: IcalConfigType;
  channel_manager_name?: string;
  api_endpoint?: string;
  api_key_name?: string;
  provider_config?: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
};

const isDebug = () => localStorage.getItem('debug') === '1';

// Helper to format error messages for debugging
const debugToast = (action: string, error: any) => {
  if (isDebug()) {
    console.error(`[supaIcal] ${action}:`, error);
    toast({
      title: `Debug: ${action} Error`,
      description: error.message || JSON.stringify(error),
      variant: "destructive"
    });
  }
};

/** List all iCal URLs for a specific property or all properties of the current host */
export async function listIcalUrls(propertyId?: string | 'all'): Promise<{ data: IcalUrl[], error: any }> {
  try {
    // Join esplicito: ical_urls -> ical_configs (inner), poi proprietà annidata
    let query = supabase
      .from('ical_urls')
      .select(`
        *,
        ical_configs!inner (
          id,
          property_id,
          properties!inner (
            id,
            host_id
          )
        )
      `);

    // Se propertyId è specificato e non è 'all', filtra per quella proprietà
    if (propertyId && propertyId !== 'all') {
      query = query.eq('ical_configs.property_id', propertyId);
    }

    const { data, error } = await query;

    if (error) {
      debugToast('listIcalUrls', error);
      return { data: [], error };
    }

    // Flatten the nested structure
    const flattenedData = (data || []).map(item => ({
      ...item,
      ical_config_id: item.ical_configs.id
    }));

    return { data: flattenedData, error: null };
  } catch (err) {
    debugToast('listIcalUrls', err);
    return { data: [], error: err };
  }
}

/** List all iCal configs for a specific property or all properties of the current host */
export async function listIcalConfigs(propertyId?: string | 'all'): Promise<{ data: IcalConfig[], error: any }> {
  try {
    let query = supabase
      .from('ical_configs')
      .select(`
        *,
        properties!inner (
          id,
          host_id
        )
      `);

    // Se propertyId è specificato e non è 'all', filtra per quella proprietà
    if (propertyId && propertyId !== 'all') {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query;

    if (error) {
      debugToast('listIcalConfigs', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    debugToast('listIcalConfigs', err);
    return { data: [], error: err };
  }
}

/** Create a new iCal URL */
export async function createIcalUrl({
  ical_config_id,
  url,
  source,
  ota_name,
  is_active = true,
  is_primary = false
}: {
  ical_config_id: string;
  url: string;
  source: string;
  ota_name: string;
  is_active?: boolean;
  is_primary?: boolean;
}) {
  try {
    // If this is set as primary, unset other primary URLs for this config
    if (is_primary) {
      const { error: unsetError } = await unsetPrimaryByConfig(ical_config_id);
      if (unsetError) {
        debugToast('createIcalUrl - unsetPrimary', unsetError);
        // Continue anyway, as this is not critical
      }
    }

    const { data, error } = await supabase
      .from('ical_urls')
      .insert([{
        ical_config_id,
        url,
        source,
        ota_name,
        is_active,
        is_primary
      }])
      .select()
      .single();

    if (error) {
      debugToast('createIcalUrl', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione dell'URL iCal",
        variant: "destructive"
      });
      return { data: null, error };
    }

    toast({
      title: "Successo",
      description: "URL iCal creato con successo"
    });

    return { data, error: null };
  } catch (err) {
    debugToast('createIcalUrl', err);
    return { data: null, error: err };
  }
}

/** Update an existing iCal URL */
export async function updateIcalUrl(id: string, updates: Partial<{
  url: string;
  source: string;
  is_active: boolean;
  is_primary: boolean;
}>) {
  try {
    // If setting as primary, first get the config_id and unset other primaries
    if (updates.is_primary) {
      const { data: urlData } = await supabase
        .from('ical_urls')
        .select('ical_config_id')
        .eq('id', id)
        .single();

      if (urlData) {
        const { error: unsetError } = await unsetPrimaryByConfig(urlData.ical_config_id);
        if (unsetError) {
          debugToast('updateIcalUrl - unsetPrimary', unsetError);
          // Continue anyway
        }
      }
    }

    const { data, error } = await supabase
      .from('ical_urls')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      debugToast('updateIcalUrl', error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dell'URL iCal",
        variant: "destructive"
      });
      return { data: null, error };
    }

    toast({
      title: "Successo",
      description: "URL iCal aggiornato con successo"
    });

    return { data, error: null };
  } catch (err) {
    debugToast('updateIcalUrl', err);
    return { data: null, error: err };
  }
}

/** Delete an iCal URL */
export async function deleteIcalUrl(id: string) {
  try {
    const { error } = await supabase
      .from('ical_urls')
      .delete()
      .eq('id', id);

    if (error) {
      debugToast('deleteIcalUrl', error);
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione dell'URL iCal",
        variant: "destructive"
      });
      return { error };
    }

    toast({
      title: "Successo",
      description: "URL iCal eliminato con successo"
    });

    return { error: null };
  } catch (err) {
    debugToast('deleteIcalUrl', err);
    return { error: err };
  }
}

/** Unset primary flag for all URLs in a config */
export async function unsetPrimaryByConfig(ical_config_id: string) {
  try {
    const { error } = await supabase
      .from('ical_urls')
      .update({ is_primary: false })
      .eq('ical_config_id', ical_config_id)
      .eq('is_primary', true);

    if (error) {
      debugToast('unsetPrimaryByConfig', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    debugToast('unsetPrimaryByConfig', err);
    return { error: err };
  }
}

/** Create a new iCal config */
export async function createIcalConfig({
  property_id,
  config_type = 'ota_direct',
  channel_manager_name,
  api_endpoint,
  api_key_name,
  provider_config,
  is_active = true
}: {
  property_id: string;
  config_type?: IcalConfigType;
  channel_manager_name?: string;
  api_endpoint?: string;
  api_key_name?: string;
  provider_config?: Record<string, any>;
  is_active?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from('ical_configs')
      .insert([{
        property_id,
        config_type,
        channel_manager_name,
        api_endpoint,
        api_key_name,
        provider_config: provider_config || {},
        is_active,
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      debugToast('createIcalConfig', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione della configurazione iCal",
        variant: "destructive"
      });
      return { data: null, error };
    }

    toast({
      title: "Successo",
      description: "Configurazione iCal creata con successo"
    });

    return { data, error: null };
  } catch (err) {
    debugToast('createIcalConfig', err);
    return { data: null, error: err };
  }
}

/** Delete an iCal config */
export async function deleteIcalConfig(id: string) {
  try {
    const { error } = await supabase
      .from('ical_configs')
      .delete()
      .eq('id', id);

    if (error) {
      debugToast('deleteIcalConfig', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la configurazione iCal",
        variant: "destructive"
      });
      return { error };
    }

    toast({
      title: "Successo",
      description: "Configurazione iCal eliminata con successo"
    });

    return { error: null };
  } catch (err) {
    debugToast('deleteIcalConfig', err);
    return { error: err };
  }
}

/** Sync an iCal URL */
export async function syncIcalUrl(id: string) {
  try {
    // Call the ics-sync edge function
    const { data, error } = await supabase.functions.invoke('ics-sync', {
      body: { ical_url_id: id }
    });

    if (error) {
      debugToast('syncIcalUrl', error);
      toast({
        title: "Errore di Sincronizzazione",
        description: `Errore nella sincronizzazione: ${error.message || 'Errore sconosciuto'}`,
        variant: "destructive"
      });
      return { data: null, error };
    }

    const result = data as { success: boolean; processed?: number; created?: number; updated?: number; message?: string };
    
    if (result?.success) {
      toast({
        title: "✅ Sincronizzazione Completata",
        description: result.message || `Elaborati ${result.processed || 0} eventi, creati ${result.created || 0}, aggiornati ${result.updated || 0}`,
      });
    } else {
      toast({
        title: "Attenzione",
        description: "Sincronizzazione completata ma senza risultati",
        variant: "destructive"
      });
    }

    return { data, error: null };
  } catch (err) {
    debugToast('syncIcalUrl', err);
    toast({
      title: "Errore di Connessione",
      description: "Impossibile contattare il servizio di sincronizzazione",
      variant: "destructive"
    });
    return { data: null, error: err };
  }
}

/** Generate export token for a property */
export async function generateExportToken(propertyId: string) {
  try {
    // Generate a secure random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), 
      byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Check if there's already a channel account for this property
    const { data: existingAccount } = await supabase
      .from('channel_accounts')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle();
    
    if (existingAccount) {
      // Update existing account with new token
      const { data, error } = await supabase
        .from('channel_accounts')
        .update({ ics_export_token: token })
        .eq('id', existingAccount.id)
        .select()
        .single();
        
      if (error) throw error;
      return { data: { ...data, export_url: `${window.location.origin}/api/ics-export?property_id=${propertyId}&token=${token}` }, error: null };
    } else {
      // Create new channel account
      const { data, error } = await supabase
        .from('channel_accounts')
        .insert({
          property_id: propertyId,
          name: 'Export iCal',
          kind: 'export',
          ics_export_token: token
        })
        .select()
        .single();
        
      if (error) throw error;
      return { 
        data: { 
          ...data, 
          export_url: `https://blsiiqhijlubzhpmtswc.supabase.co/functions/v1/ics-export?property_id=${propertyId}&token=${token}` 
        }, 
        error: null 
      };
    }
  } catch (err) {
    debugToast('generateExportToken', err);
    return { data: null, error: err };
  }
}

/** Get export URL for a property */
export async function getExportUrl(propertyId: string): Promise<{ url: string | null; error: any }> {
  try {
    const { data: account, error } = await supabase
      .from('channel_accounts')
      .select('ics_export_token')
      .eq('property_id', propertyId)
      .eq('kind', 'export')
      .maybeSingle();
      
    if (error) throw error;
    
    if (account?.ics_export_token) {
      return {
        url: `https://blsiiqhijlubzhpmtswc.supabase.co/functions/v1/ics-export?property_id=${propertyId}&token=${account.ics_export_token}`,
        error: null
      };
    }
    
    return { url: null, error: null };
  } catch (err) {
    debugToast('getExportUrl', err);
    return { url: null, error: err };
  }
}

/** Format URL for display */
export function formatUrl(url: string, maxLength = 50): string {
  return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
}

/** Get icon for source */
export function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    'booking.com': '🏨',
    'airbnb': '🏠',
    'expedia': '✈️',
    'vrbo': '🏡',
    'default': '📅'
  };
  return icons[source.toLowerCase()] || icons.default;
}

/** Validate iCal URL */
export function validateIcalUrl(url: string): { isValid: boolean; message?: string } {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, message: 'URL deve utilizzare protocollo HTTP o HTTPS' };
    }
    if (!url.toLowerCase().includes('ical') && !url.toLowerCase().includes('.ics')) {
      return { isValid: false, message: 'URL non sembra essere un feed iCal valido' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'URL non valido' };
  }
}
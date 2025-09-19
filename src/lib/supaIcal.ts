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
    const select = `
      id,url,source,is_active,is_primary,last_sync_at,created_at,updated_at,
      ical_config_id,
      ical_configs!inner (
        id, property_id, is_active,
        properties:property_id ( id, nome )
      )
    `;

    let query = supabase.from('ical_urls').select(select).order('created_at', { ascending: false });

    // Filtra per property se passato
    if (propertyId && propertyId !== 'all') {
      query = query.eq('ical_configs.property_id', propertyId);
    }

    // Opzionale: mostra solo config attive
    query = query.eq('ical_configs.is_active', true);

    const { data, error } = await query;
    if (error) {
      debugToast('listIcalUrls', error);
      return { data: [], error };
    }
    
    return { data: data as any ?? [], error: null };
  } catch (err) {
    debugToast('listIcalUrls', err);
    return { data: [], error: err };
  }
}

/** List all iCal configs for a specific property or all properties of the current host */
export async function listIcalConfigs(propertyId?: string | 'all'): Promise<{ data: IcalConfig[], error: any }> {
  try {
    const select = `
      id,
      property_id,
      is_active,
      config_type,
      channel_manager_name,
      status,
      created_at,
      updated_at
    `;

    let query = supabase.from('ical_configs').select(select).order('created_at', { ascending: false });

    if (propertyId && propertyId !== 'all') {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query;
    if (error) {
      debugToast('listIcalConfigs', error);
      return { data: [], error };
    }

    return { data: data as IcalConfig[] ?? [], error: null };
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
  is_active = true,
  is_primary = false
}: {
  ical_config_id: string;
  url: string;
  source: string;
  is_active?: boolean;
  is_primary?: boolean;
}) {
  try {
    // If setting as primary, unset other primary URLs for the same config
    if (is_primary) {
      await unsetPrimaryByConfig(ical_config_id);
    }

    const { data, error } = await supabase
      .from('ical_urls')
      .insert([{
        ical_config_id,
        url,
        source,
        ota_name: source, // Keep compatibility with existing schema
        is_active,
        is_primary
      }])
      .select()
      .single();

    if (error) {
      debugToast('createIcalUrl', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il link iCal",
        variant: "destructive"
      });
      return { data: null, error };
    }

    toast({
      title: "Successo",
      description: "Link iCal creato con successo"
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
    // If setting as primary, get the config_id first and unset others
    if (updates.is_primary) {
      const { data: currentUrl } = await supabase
        .from('ical_urls')
        .select('ical_config_id')
        .eq('id', id)
        .single();
      
      if (currentUrl) {
        await unsetPrimaryByConfig(currentUrl.ical_config_id);
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
        description: "Impossibile aggiornare il link iCal",
        variant: "destructive"
      });
      return { data: null, error };
    }

    toast({
      title: "Successo",
      description: "Link iCal aggiornato con successo"
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
        description: "Impossibile eliminare il link iCal",
        variant: "destructive"
      });
      return { error };
    }

    toast({
      title: "Successo",
      description: "Link iCal eliminato con successo"
    });

    return { error: null };
  } catch (err) {
    debugToast('deleteIcalUrl', err);
    return { error: err };
  }
}

/** Unset all primary flags for a specific config */
export async function unsetPrimaryByConfig(ical_config_id: string) {
  try {
    const { error } = await supabase
      .from('ical_urls')
      .update({ is_primary: false })
      .eq('ical_config_id', ical_config_id)
      .eq('is_primary', true);

    if (error) {
      debugToast('unsetPrimaryByConfig', error);
    }

    return { error };
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
  is_active = true
}: {
  property_id: string;
  config_type?: IcalConfigType;
  channel_manager_name?: string;
  is_active?: boolean;
}) {
  try {
    // Get current user ID for host_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('ical_configs')
      .insert([{
        property_id,
        host_id: user.id,
        config_type,
        channel_manager_name,
        is_active,
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      debugToast('createIcalConfig', error);
      toast({
        title: "Errore",
        description: "Impossibile creare la configurazione iCal",
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

/** Format URL for display (truncate long URLs) */
export function formatUrl(url: string, maxLength = 50): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

/** Get source icon/emoji based on source name */
export function getSourceIcon(source: string): string {
  switch (source?.toLowerCase()) {
    case 'airbnb': return '🏠';
    case 'booking.com': return '🔵';
    case 'vrbo': return '🏖️';
    case 'smoobu': return '📊';
    default: return '🔗';
  }
}

/** Validate iCal URL format */
export function validateIcalUrl(url: string): { isValid: boolean; message?: string } {
  if (!url.trim()) {
    return { isValid: false, message: 'URL è obbligatorio' };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { isValid: false, message: 'URL deve iniziare con http:// o https://' };
  }

  if (!url.toLowerCase().includes('ical') && !url.toLowerCase().includes('.ics')) {
    return { isValid: false, message: 'URL dovrebbe contenere "ical" o terminare con ".ics"' };
  }

  return { isValid: true };
}
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface ICalSource {
  id: string;
  url: string;
  ota_name: string;
  last_sync_at?: string;
  last_sync_status?: string;
  is_active: boolean;
  ical_config?: {
    channel_manager_name?: string;
    config_type: string;
  };
}

interface ICalSourcesPanelProps {
  propertyId: string;
}

const ICalSourcesPanel: React.FC<ICalSourcesPanelProps> = ({ propertyId }) => {
  const [sources, setSources] = useState<ICalSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSources();
  }, [propertyId]);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ical_urls')
        .select(`
          id, 
          url, 
          ota_name,
          last_sync_at,
          last_sync_status,
          is_active,
          ical_configs!inner (
            channel_manager_name,
            config_type,
            property_id
          )
        `)
        .eq('ical_configs.property_id', propertyId)
        .eq('is_active', true);

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching iCal sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (otaName: string) => {
    const name = otaName.toLowerCase();
    if (name.includes('airbnb')) return '🏠';
    if (name.includes('booking')) return '🔵';
    if (name.includes('vrbo') || name.includes('expedia')) return '🏖️';
    if (name.includes('agoda')) return '🌏';
    return '📅';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-500">Sincronizzato</Badge>;
      case 'error': return <Badge variant="destructive">Errore</Badge>;
      case 'pending': return <Badge variant="secondary">In attesa</Badge>;
      default: return <Badge variant="outline">Mai sincronizzato</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (sources.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Nessuna fonte iCal configurata per questa proprietà
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Fonti iCal Attive ({sources.length})
      </h3>
      <div className="space-y-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-start justify-between gap-3 p-3 bg-muted/30 rounded-lg border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getChannelIcon(source.ota_name)}</span>
                <span className="font-medium text-sm">{source.ota_name}</span>
                {getStatusIcon(source.last_sync_status)}
              </div>
              <p className="text-xs text-muted-foreground truncate" title={source.url}>
                {source.url}
              </p>
              {source.last_sync_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ultimo sync: {formatDistanceToNow(new Date(source.last_sync_at), { 
                    addSuffix: true, 
                    locale: it 
                  })}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(source.last_sync_status)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ICalSourcesPanel;

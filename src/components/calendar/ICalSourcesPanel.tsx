import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { buildFunctionUrl, getSupabaseAnonKey } from '@/lib/supaFns';

interface ICalSource {
  id: string;
  url: string;
  ota_name: string;
  last_sync_at?: string;
  last_sync_status?: string;
}

interface ICalSourcesPanelProps {
  propertyId: string;
  onSynced?: () => void;
}

const ICalSourcesPanel: React.FC<ICalSourcesPanelProps> = ({ propertyId, onSynced }) => {
  const [sources, setSources] = useState<ICalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, [propertyId]);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const { data: configs } = await supabase
        .from('ical_configs')
        .select('id')
        .eq('property_id', propertyId)
        .eq('is_active', true);

      const configIds = (configs || []).map(c => c.id);
      if (configIds.length === 0) {
        setSources([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('ical_urls')
        .select('*')
        .in('ical_config_id', configIds)
        .eq('is_active', true);

      setSources(data || []);
    } catch (error) {
      console.error('Error fetching iCal sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (icalUrlId: string) => {
    setSyncing(icalUrlId);
    try {
      await fetch(buildFunctionUrl('ics-sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getSupabaseAnonKey()}`
        },
        body: JSON.stringify({ ical_url_id: icalUrlId })
      });
      toast({ title: "Sincronizzazione completata" });
      setTimeout(() => {
        fetchSources();
        if (onSynced) onSynced();
      }, 2000);
    } catch (error) {
      toast({ title: "Errore sincronizzazione", variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  if (loading) return <Card className="p-4"><div className="animate-pulse h-20 bg-gray-200 rounded"></div></Card>;
  if (sources.length === 0) return <Card className="p-4"><p className="text-sm text-muted-foreground">Nessuna fonte iCal configurata</p></Card>;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Fonti iCal Attive ({sources.length})</h3>
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="flex items-start justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{source.ota_name}</span>
                {source.last_sync_status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {source.last_sync_status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{source.url}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleSync(source.id)} disabled={syncing === source.id}>
              <RefreshCw className={`h-4 w-4 ${syncing === source.id ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ICalSourcesPanel;

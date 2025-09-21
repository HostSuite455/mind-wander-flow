import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Globe, Settings, Trash2, Key, Link as LinkIcon } from "lucide-react";
import { type IcalConfig, type IcalUrl } from "@/lib/supaIcal";

interface ConfigurationCardProps {
  config: IcalConfig;
  urls: IcalUrl[];
  onEdit: () => void;
  onDelete: () => void;
  onAddUrl: () => void;
  onEditUrl: (url: IcalUrl) => void;
  onDeleteUrl: (url: IcalUrl) => void;
}

export default function ConfigurationCard({
  config,
  urls,
  onEdit,
  onDelete,
  onAddUrl,
  onEditUrl,
  onDeleteUrl
}: ConfigurationCardProps) {
  const isChannelManager = config.config_type === 'channel_manager';
  const canAddUrls = isChannelManager ? urls.length < 1 : urls.length < 5;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            {isChannelManager ? (
              <Building2 className="w-5 h-5 text-primary" />
            ) : (
              <Globe className="w-5 h-5 text-primary" />
            )}
            {config.channel_manager_name || (isChannelManager ? 'Channel Manager' : 'OTA Direct')}
            <Badge variant={config.is_active ? "default" : "secondary"}>
              {config.is_active ? 'Attivo' : 'Inattivo'}
            </Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Configuration details */}
        {isChannelManager && config.api_endpoint && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-3 h-3" />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {config.api_endpoint}
              </code>
            </div>
            {config.api_key_name && (
              <div className="flex items-center gap-2">
                <Key className="w-3 h-3" />
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {config.api_key_name}
                </code>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* URLs List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              {isChannelManager ? 'URL iCal Master' : 'URLs iCal'} ({urls.length}/{isChannelManager ? 1 : 5})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddUrl}
              disabled={!canAddUrls}
              title={!canAddUrls ? 'Limite URLs raggiunto' : 'Aggiungi URL iCal'}
            >
              Aggiungi URL
            </Button>
          </div>
          
          {urls.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun URL configurato</p>
            </div>
          ) : (
            urls.map((url) => (
              <div
                key={url.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{url.source}</span>
                    {url.is_primary && (
                      <Badge variant="outline" className="text-xs">
                        Principale
                      </Badge>
                    )}
                    <Badge variant={url.is_active ? "secondary" : "outline"} className="text-xs">
                      {url.is_active ? 'Attivo' : 'Inattivo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {url.url}
                  </p>
                </div>
                
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditUrl(url)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteUrl(url)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Additional info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Creato il {new Date(config.created_at).toLocaleDateString('it-IT')}
          {config.provider_config && Object.keys(config.provider_config).length > 0 && (
            <div className="mt-1">
              <details className="cursor-pointer">
                <summary>Configurazione avanzata</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {JSON.stringify(config.provider_config, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Channel {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  count?: number;
}

interface ChannelLegendProps {
  channels: Channel[];
  onToggle?: (channelName: string) => void;
  activeChannels?: string[];
}

const ChannelLegend: React.FC<ChannelLegendProps> = ({ 
  channels, 
  onToggle,
  activeChannels 
}) => {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 text-sm">Canali di Prenotazione</h3>
      <div className="grid grid-cols-2 gap-2">
        {channels.map((channel) => {
          const isActive = !activeChannels || activeChannels.includes(channel.name);
          
          return (
            <button
              key={channel.name}
              onClick={() => onToggle?.(channel.name)}
              className={`
                flex items-center gap-2 p-2 rounded-lg border transition-all
                ${isActive ? 'bg-background border-border' : 'bg-muted/50 opacity-50 border-transparent'}
                hover:scale-105 cursor-pointer
              `}
              title={`${channel.name}${channel.count !== undefined ? ` (${channel.count})` : ''}`}
            >
              <span className="text-lg">{channel.icon}</span>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border-2"
                    style={{ 
                      backgroundColor: channel.bgColor,
                      borderColor: channel.color 
                    }}
                  />
                  <span className="text-xs font-medium">{channel.name}</span>
                </div>
                {channel.count !== undefined && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {channel.count}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default ChannelLegend;

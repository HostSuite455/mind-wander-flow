import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PropertyEditPhotosProps {
  property: {
    id: string;
    nome: string;
  };
}

interface PhotoRequirement {
  id: string;
  room_name: string;
  is_required: boolean;
  display_order: number;
}

export function PropertyEditPhotos({ property }: PropertyEditPhotosProps) {
  const [rooms, setRooms] = useState<PhotoRequirement[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadRooms();
  }, [property.id]);
  
  async function loadRooms() {
    try {
      const { data } = await supabase
        .from('property_photo_requirements')
        .select('*')
        .eq('property_id', property.id)
        .order('display_order');
      
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function addRoom() {
    if (!newRoomName.trim()) {
      toast.error('Inserisci il nome della stanza');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('property_photo_requirements')
        .insert({
          property_id: property.id,
          room_name: newRoomName.trim(),
          is_required: true,
          display_order: rooms.length
        });
      
      if (error) {
        if (error.code === '23505') {
          toast.error('Questa stanza è già presente');
        } else {
          throw error;
        }
      } else {
        toast.success('Stanza aggiunta');
        setNewRoomName('');
        loadRooms();
      }
    } catch (error) {
      console.error('Error adding room:', error);
      toast.error('Errore durante l\'aggiunta');
    }
  }
  
  async function toggleRequired(id: string, currentValue: boolean) {
    try {
      const { error } = await supabase
        .from('property_photo_requirements')
        .update({ is_required: !currentValue })
        .eq('id', id);
      
      if (error) throw error;
      loadRooms();
    } catch (error) {
      console.error('Error toggling required:', error);
      toast.error('Errore durante l\'aggiornamento');
    }
  }
  
  async function deleteRoom(id: string) {
    try {
      const { error } = await supabase
        .from('property_photo_requirements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Stanza rimossa');
      loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Errore durante la rimozione');
    }
  }
  
  if (loading) {
    return <div className="p-6">Caricamento...</div>;
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>📸 Foto richieste per completamento pulizia</CardTitle>
          <CardDescription>
            Configura quali stanze richiedono una foto di verifica dal cleaner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* List existing rooms */}
          {rooms.length > 0 ? (
            <div className="space-y-2">
              {rooms.map(room => (
                <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{room.room_name}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`required-${room.id}`} className="text-sm text-muted-foreground">
                        Obbligatoria
                      </label>
                      <Switch
                        id={`required-${room.id}`}
                        checked={room.is_required}
                        onCheckedChange={() => toggleRequired(room.id, room.is_required)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRoom(room.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessuna stanza configurata. Aggiungi la prima stanza qui sotto.
            </p>
          )}
          
          {/* Add new room */}
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Nome stanza (es. Camera da letto, Bagno, Cucina)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRoom()}
            />
            <Button onClick={addRoom}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

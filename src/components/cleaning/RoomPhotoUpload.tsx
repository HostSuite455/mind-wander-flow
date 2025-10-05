import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle } from 'lucide-react';

interface RoomPhotoUploadProps {
  rooms: string[];
  onPhotosChange: (photos: Array<{ room: string; url: string; uploaded_at: string }>) => void;
}

export function RoomPhotoUpload({ rooms, onPhotosChange }: RoomPhotoUploadProps) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  
  async function handleUpload(room: string, file: File) {
    // Create object URL for preview (in produzione: upload to Supabase Storage)
    const url = URL.createObjectURL(file);
    const newPhotos = { ...photos, [room]: url };
    setPhotos(newPhotos);
    
    // Convert to array format for parent
    const photosArray = Object.entries(newPhotos).map(([room, url]) => ({
      room,
      url,
      uploaded_at: new Date().toISOString()
    }));
    
    onPhotosChange(photosArray);
  }
  
  return (
    <div className="space-y-3">
      {rooms.map(room => (
        <div key={room} className="flex items-center gap-3 p-3 border rounded-lg">
          <span className="flex-1 font-medium">{room}</span>
          {photos[room] ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <img src={photos[room]} className="h-12 w-12 object-cover rounded border" alt={room} />
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(room, e.target.files[0])}
              />
              <Button variant="outline" size="sm" type="button" asChild>
                <span>
                  <Camera className="h-4 w-4 mr-2" />
                  Scatta foto
                </span>
              </Button>
            </label>
          )}
        </div>
      ))}
    </div>
  );
}

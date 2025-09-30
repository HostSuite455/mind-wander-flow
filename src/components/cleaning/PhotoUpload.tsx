import { useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface PhotoUploadProps {
  onPhotoUploaded: (photoUrl: string) => void;
  existingPhoto?: string;
  label?: string;
}

export default function PhotoUpload({ onPhotoUploaded, existingPhoto, label = "Carica Foto" }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un file immagine valido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'immagine deve essere inferiore a 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // In a real implementation, upload to Supabase Storage
      // For now, we'll use a data URL
      setTimeout(() => {
        const dataUrl = URL.createObjectURL(file);
        onPhotoUploaded(dataUrl);
        toast.success('Foto caricata con successo');
        setUploading(false);
      }, 1000);

    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Errore nel caricamento della foto');
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPreview(null);
    onPhotoUploaded('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      {preview ? (
        <Card className="relative overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removePhoto}
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <label
          htmlFor="photo-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
            ) : (
              <>
                <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-semibold">Clicca per caricare</span>
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG fino a 5MB</p>
              </>
            )}
          </div>
          <input
            id="photo-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhotoUploadProps {
  taskId: string;
  onPhotoUploaded: (photoUrl: string) => void;
  existingPhotoUrl?: string;
  disabled?: boolean;
}

export default function PhotoUpload({ 
  taskId, 
  onPhotoUploaded, 
  existingPhotoUrl, 
  disabled = false 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Per favore seleziona un file immagine valido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Il file è troppo grande. Massimo 5MB consentiti');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}-completion-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('task-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-photos')
        .getPublicUrl(data.path);

      // Update task with photo URL
      const { error: updateError } = await supabase
        .from('cleaning_tasks')
        .update({
          completion_photo_url: publicUrl,
          completion_photo_uploaded_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      onPhotoUploaded(publicUrl);
      toast.success('Foto caricata con successo!');

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Errore durante il caricamento della foto');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removePhoto = async () => {
    if (!previewUrl) return;

    try {
      // Update task to remove photo URL
      const { error } = await supabase
        .from('cleaning_tasks')
        .update({
          completion_photo_url: null,
          completion_photo_uploaded_at: null
        })
        .eq('id', taskId);

      if (error) throw error;

      setPreviewUrl(null);
      onPhotoUploaded('');
      toast.success('Foto rimossa');

    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Errore durante la rimozione della foto');
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Foto di completamento</h3>
            {previewUrl && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Caricata</span>
              </div>
            )}
          </div>

          {previewUrl ? (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Foto di completamento" 
                className="w-full h-48 object-cover rounded-lg border"
              />
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-4">
                Carica una foto per completare il task
              </p>
              
              {!disabled && (
                <div className="space-y-2">
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    Scatta foto
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carica da galleria
                  </Button>
                </div>
              )}
            </div>
          )}

          {!previewUrl && (
            <Alert>
              <AlertDescription className="text-xs">
                La foto è obbligatoria per completare il task. Assicurati che mostri chiaramente il lavoro svolto.
              </AlertDescription>
            </Alert>
          )}

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
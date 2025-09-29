import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { validateIcalUrl, updateIcalUrl, createIcalUrl, type IcalUrl } from "@/lib/supaIcal";
import { toast } from "@/hooks/use-toast";

interface IcalUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  icalUrl?: IcalUrl | null;
  icalConfigId: string;
  mode: 'create' | 'edit';
}

const SOURCE_OPTIONS = [
  { value: 'Airbnb', label: 'Airbnb', icon: '🏠' },
  { value: 'Booking.com', label: 'Booking.com', icon: '🔵' },
  { value: 'VRBO', label: 'VRBO', icon: '🏖️' },
  { value: 'Agoda', label: 'Agoda', icon: '🌏' },
  { value: 'TripAdvisor', label: 'TripAdvisor', icon: '🦉' },
  { value: 'Other', label: 'Altro', icon: '🔗' }
];

export default function IcalUrlModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  icalUrl, 
  icalConfigId,
  mode 
}: IcalUrlModalProps) {
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when modal opens or icalUrl changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && icalUrl) {
        setUrl(icalUrl.url || '');
        setSource(icalUrl.source || '');
        setIsActive(icalUrl.is_active ?? true);
        setIsPrimary(icalUrl.is_primary ?? false);
      } else {
        // Reset form for create mode
        setUrl('');
        setSource('');
        setIsActive(true);
        setIsPrimary(false);
      }
    }
  }, [isOpen, mode, icalUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validate URL
    const validation = validateIcalUrl(url);
    if (!validation.isValid) {
      toast({
        title: "Errore di validazione",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }

    if (!source) {
      toast({
        title: "Errore di validazione", 
        description: "Seleziona una sorgente",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      
      if (mode === 'create') {
        result = await createIcalUrl({
          ical_config_id: icalConfigId,
          url,
          source,
          ota_name: source,
          is_active: isActive,
          is_primary: isPrimary
        });
      } else if (icalUrl) {
        result = await updateIcalUrl(icalUrl.id, {
          url,
          source,
          is_active: isActive,
          is_primary: isPrimary
        });
      }

      if (result && !result.error) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving iCal URL:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Aggiungi Link iCal' : 'Modifica Link iCal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Sorgente</Label>
            <Select value={source} onValueChange={setSource} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona sorgente..." />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL iCal</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/calendar.ics"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Attivo</Label>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="is_primary">Principale</Label>
              <p className="text-xs text-muted-foreground">
                Il calendario principale viene utilizzato per la sincronizzazione automatica
              </p>
            </div>
            <Switch
              id="is_primary"
              checked={isPrimary}
              onCheckedChange={setIsPrimary}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-hostsuite-primary hover:bg-hostsuite-primary/90"
            >
              {isSubmitting ? 'Salvando...' : (mode === 'create' ? 'Aggiungi' : 'Salva')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PropertyPickerProps {
  cleanerId: string;
  selectedPropertyId?: string;
  onPropertySelect: (propertyId: string) => void;
}

export default function PropertyPicker({ cleanerId, selectedPropertyId, onPropertySelect }: PropertyPickerProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, [cleanerId]);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaner_assignments')
        .select(`
          property_id,
          active,
          properties (
            id,
            nome,
            address,
            city,
            image_url
          )
        `)
        .eq('cleaner_id', cleanerId)
        .eq('active', true);

      if (error) throw error;

      const propertiesList = data
        ?.map(a => a.properties)
        .filter(p => p !== null) || [];

      setProperties(propertiesList);

      // Auto-select if only one property
      if (propertiesList.length === 1 && !selectedPropertyId && propertiesList[0]) {
        onPropertySelect(propertiesList[0].id);
      }
    } catch (error: any) {
      console.error('Error loading properties:', error);
      toast.error('Errore nel caricamento delle proprietà');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Nessuna Proprietà Assegnata</h3>
        <p className="text-muted-foreground">
          Contatta il tuo host per ricevere un assegnamento
        </p>
      </Card>
    );
  }

  if (properties.length === 1) {
    return null; // Auto-selected, no need to show picker
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        Seleziona Proprietà
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <Card
            key={property.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedPropertyId === property.id
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => onPropertySelect(property.id)}
          >
            {property.image_url && (
              <img
                src={property.image_url}
                alt={property.nome}
                className="w-full h-32 object-cover rounded-t-lg"
              />
            )}
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{property.nome}</h4>
                {selectedPropertyId === property.id && (
                  <Badge className="bg-primary">
                    <Check className="h-3 w-3 mr-1" />
                    Attiva
                  </Badge>
                )}
              </div>
              
              {property.address && (
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{property.address}, {property.city}</span>
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

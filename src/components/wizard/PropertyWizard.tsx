import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import WizardStep1Platform from "./WizardStep1Platform";
import WizardStep2Address from "./WizardStep2Address";
import WizardStep3Details from "./WizardStep3Details";

export default function PropertyWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Wizard data state
  const [wizardData, setWizardData] = useState<{
    platform?: string;
    icalUrl?: string;
    address?: string;
    city?: string;
    country?: string;
    unitNumber?: string;
    lat?: number;
    lng?: number;
    propertyName?: string;
    imageUrl?: string;
    currency?: string;
  }>({});

  const handleStep1Next = (data: { platform: string; icalUrl: string }) => {
    setWizardData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Next = (data: {
    address: string;
    city: string;
    country: string;
    unitNumber: string;
    lat: number;
    lng: number;
    propertyName: string;
    imageUrl?: string;
    currency: string;
  }) => {
    setWizardData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: {
    bedrooms: number;
    beds: number;
    bathrooms: number;
    sizeSqm?: number;
    sizeUnit: "sqm" | "sqft";
    unknownSize: boolean;
    checkInFrom: string;
    checkOutUntil: string;
    description: string;
  }) => {
    try {
      setIsSubmitting(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Devi essere autenticato per creare una proprietà");
      }

      // Create property
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          host_id: user.id,
          nome: wizardData.propertyName || "Proprietà senza nome",
          address: wizardData.address,
          city: wizardData.city,
          country: wizardData.country,
          unit_number: wizardData.unitNumber,
          lat: wizardData.lat,
          lng: wizardData.lng,
          image_url: wizardData.imageUrl,
          currency: wizardData.currency || "EUR",
          bedrooms: data.bedrooms,
          beds: data.beds,
          bathrooms: data.bathrooms,
          size_sqm: data.sizeSqm,
          check_in_from: data.checkInFrom,
          check_out_until: data.checkOutUntil,
          description: data.description,
          status: "active",
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Create iCal configuration (unified system)
      if (wizardData.icalUrl && property) {
        // 1. Create ical_config
        const { data: icalConfig, error: configError } = await supabase
          .from("ical_configs")
          .insert({
            property_id: property.id,
            config_type: "ota_direct",
            is_active: true,
          })
          .select()
          .single();

        if (configError) {
          console.error("Error creating iCal config:", configError);
        } else if (icalConfig) {
          // 2. Create ical_url
          const { error: urlError } = await supabase.from("ical_urls").insert({
            ical_config_id: icalConfig.id,
            url: wizardData.icalUrl,
            ota_name: wizardData.platform || "iCal",
            source: wizardData.platform || "ical",
            is_active: true,
            is_primary: true,
          });

          if (urlError) {
            console.error("Error creating iCal URL:", urlError);
          }
        }
      }

      // Success!
      // Create default photo requirements for the property
      if (property) {
        const defaultRooms = ['Camera', 'Bagno', 'Cucina', 'Soggiorno'];
        await supabase.from('property_photo_requirements').insert(
          defaultRooms.map((room, i) => ({
            property_id: property.id,
            room_name: room,
            is_required: true,
            display_order: i
          }))
        );
      }

      toast({
        title: "La tua proprietà è stata salvata!",
        description: "Ora è possibile aggiungere addetti!",
        className: "bg-green-50 border-green-200",
      });

      // Redirect to properties list with success param
      setTimeout(() => {
        navigate("/dashboard/properties?success=true");
      }, 1500);
    } catch (error) {
      console.error("Error creating property:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description:
          error instanceof Error ? error.message : "Errore nella creazione della proprietà",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                    ${
                      step === currentStep
                        ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                        : step < currentStep
                        ? "bg-primary/70 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded-full transition-all ${
                      step < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardContent className="p-8 lg:p-12">
            {currentStep === 1 && <WizardStep1Platform onNext={handleStep1Next} />}
            {currentStep === 2 && (
              <WizardStep2Address
                onNext={handleStep2Next}
                onBack={() => setCurrentStep(1)}
                initialData={{
                  address: wizardData.address,
                  city: wizardData.city,
                  country: wizardData.country,
                  unitNumber: wizardData.unitNumber,
                  propertyName: wizardData.propertyName,
                  currency: wizardData.currency,
                }}
              />
            )}
            {currentStep === 3 && (
              <WizardStep3Details
                onSubmit={handleStep3Submit}
                onBack={() => setCurrentStep(2)}
                isSubmitting={isSubmitting}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

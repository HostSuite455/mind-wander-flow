import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/logo.png";

const GuestLogin = () => {
  const [guestCode, setGuestCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isFormValid = guestCode.length >= 6;

  const verifyGuestCode = async (code: string) => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('guest_codes')
      .select('code, property_id, check_in, check_out')
      .eq('code', code.toUpperCase())
      .lte('check_in', now)
      .gte('check_out', now)
      .maybeSingle();

    return { data, error };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await verifyGuestCode(guestCode);
      
      if (error) {
        setError("Errore durante la verifica del codice");
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Errore durante la verifica del codice",
        });
        return;
      }

      if (!data) {
        setError("Codice non valido o scaduto");
        toast({
          variant: "destructive",
          title: "Codice non valido",
          description: "Il codice inserito non è valido o è scaduto",
        });
        return;
      }

      // Save guest session
      const guestSession = {
        code: data.code,
        property_id: data.property_id,
        expires_at: data.check_out,
      };
      
      localStorage.setItem('guest_session', JSON.stringify(guestSession));
      
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto! Accesso come ospite confermato.",
      });
      
      navigate("/guest-dashboard");
    } catch (err) {
      const errorMessage = "Errore durante la verifica. Riprova.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Errore",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hostsuite-secondary/30 to-hostsuite-light/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo e Link Home */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={logoImage} alt="HostSuite" className="h-12 mx-auto mb-4" />
          </Link>
        </div>

        <Card className="shadow-elegant border-hostsuite-secondary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-hostsuite-primary">Accesso Ospiti</CardTitle>
            <CardDescription className="text-hostsuite-text">
              Inserisci il codice ricevuto dal tuo host
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="guestCode" className="text-hostsuite-primary font-medium">
                  Guest Code
                </Label>
                <Input
                  id="guestCode"
                  type="text"
                  placeholder="Inserisci il tuo guest code"
                  value={guestCode}
                  onChange={(e) => setGuestCode(e.target.value.toUpperCase())}
                  className="border-hostsuite-secondary/30 focus:border-hostsuite-secondary text-center font-mono text-lg tracking-wider"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-hostsuite-text">
                  Il codice deve essere di almeno 6 caratteri
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-hostsuite-secondary to-hostsuite-primary hover:scale-105 transition-transform"
                disabled={!isFormValid || isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifica in corso...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Entra
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-hostsuite-secondary/10 rounded-lg">
              <p className="text-xs text-hostsuite-text text-center">
                Il guest code è generato e verificato tramite Supabase.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-hostsuite-secondary hover:text-hostsuite-primary transition-colors">
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuestLogin;
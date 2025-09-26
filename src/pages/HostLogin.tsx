import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Home as HomeIcon, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/logo.png";

const HostLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const isFormValid = isValidEmail(email) && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // First try to sign in
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If user doesn't exist, try to create account
      if (error && error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          toast({
            variant: "destructive",
            title: "Errore di registrazione",
            description: signUpError.message,
          });
          return;
        }

        if (signUpData.user) {
          toast({
            title: "Account creato",
            description: "Account creato con successo! Accesso effettuato.",
          });
          navigate("/dashboard");
          return;
        }
      }

      if (error) {
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Errore di accesso",
          description: error.message,
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Accesso effettuato",
          description: "Benvenuto nella tua dashboard!",
        });
        navigate("/dashboard");
      }
    } catch (err) {
      const errorMessage = "Errore durante l'accesso. Riprova.";
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
    <div className="min-h-screen bg-gradient-to-br from-hostsuite-light/30 to-hostsuite-secondary/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo e Link Home */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={logoImage} alt="HostSuite" className="h-12 mx-auto mb-4" />
          </Link>
        </div>

        <Card className="shadow-elegant border-hostsuite-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-hostsuite-primary">Area Host</CardTitle>
            <CardDescription className="text-hostsuite-text">
              Accedi alla tua dashboard di gestione
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-hostsuite-primary font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-hostsuite-primary/30 focus:border-hostsuite-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-hostsuite-primary font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-hostsuite-primary/30 focus:border-hostsuite-primary"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-hostsuite text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={!isFormValid || isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  <>
                    <HomeIcon className="w-4 h-4 mr-2" />
                    Accedi
                  </>
                )}
              </Button>

              <div className="text-center">
                <a href="#" className="text-sm text-hostsuite-secondary hover:text-hostsuite-primary transition-colors">
                  Password dimenticata?
                </a>
              </div>
            </form>

            <div className="mt-6 p-4 bg-hostsuite-light/20 rounded-lg">
              <p className="text-xs text-hostsuite-text text-center">
                Autenticazione sicura powered by Supabase.
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

export default HostLogin;
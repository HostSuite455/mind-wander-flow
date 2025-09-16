import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Home as HomeIcon } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";

const HostLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isFormValid = isValidEmail(email) && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    
    // TODO: Collega Supabase qui per l'autenticazione host
    // await supabase.auth.signInWithPassword({ email, password });
    
    // Simulazione caricamento
    setTimeout(() => {
      setIsLoading(false);
      console.log("Login simulato per:", email);
    }, 2000);
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

              <Button
                type="submit"
                className="w-full bg-gradient-hostsuite hover:scale-105 transition-transform"
                disabled={!isFormValid || isLoading}
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
                L'autenticazione sarà collegata a Supabase (in arrivo).
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
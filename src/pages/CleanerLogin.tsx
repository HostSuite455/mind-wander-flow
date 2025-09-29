import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import logoImage from '@/assets/logo.png';

export default function CleanerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email e password sono obbligatori');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Accesso effettuato con successo!');
      navigate('/cleaner');
    } catch (error: any) {
      const errorMessage = error.message || 'Errore durante il login';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo e Link Home */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={logoImage} alt="HostSuite" className="h-12 mx-auto mb-4" />
          </Link>
        </div>

        <Card className="shadow-lg border-blue-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Area Cleaner
            </CardTitle>
            <CardDescription className="text-blue-700">
              Accedi al tuo account per gestire i task di pulizia
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-900 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-blue-300 focus:border-blue-500"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-900 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-blue-300 focus:border-blue-500"
                  disabled={loading}
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Accedi
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50/50 rounded-lg">
              <p className="text-xs text-blue-700 text-center">
                Autenticazione sicura powered by Supabase.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
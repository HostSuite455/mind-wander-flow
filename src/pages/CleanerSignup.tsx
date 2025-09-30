import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, User, Mail, Lock, Phone, CreditCard, ArrowRight } from 'lucide-react';
import logoImage from '@/assets/logo.png';

export default function CleanerSignup() {
  const [searchParams] = useSearchParams();
  const invitationCode = searchParams.get('code');
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);

  // Step 1: Account data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Profile data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3: Payment method
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');

  useEffect(() => {
    if (invitationCode) {
      loadInvitation();
    } else {
      toast.error('Codice invito mancante');
      navigate('/cleaner-login');
    }
  }, [invitationCode]);

  const loadInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaner_invitations')
        .select(`
          *,
          properties (
            nome,
            address,
            city
          )
        `)
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .single();

      if (error) throw error;

      if (new Date(data.expires_at) < new Date()) {
        toast.error('Invito scaduto');
        navigate('/cleaner-login');
        return;
      }

      setInvitation(data);
      if (data.email) setEmail(data.email);
      if (data.phone) setPhone(data.phone);
    } catch (error: any) {
      console.error('Error loading invitation:', error);
      toast.error('Invito non valido');
      navigate('/cleaner-login');
    }
  };

  const handleStep1 = async () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Compila tutti i campi');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Le password non corrispondono');
      return;
    }

    if (password.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri');
      return;
    }

    setStep(2);
  };

  const handleStep2 = () => {
    if (!firstName || !lastName || !phone) {
      toast.error('Compila tutti i campi');
      return;
    }
    setStep(3);
  };

  const handleStep3 = async () => {
    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Create cleaner profile
      const { error: cleanerError } = await supabase
        .from('cleaners')
        .insert({
          user_id: authData.user.id,
          owner_id: invitation.host_id,
          name: `${firstName} ${lastName}`,
          email,
          phone,
          whatsapp_number: phone,
        });

      if (cleanerError) throw cleanerError;

      // 3. Get cleaner ID
      const { data: cleanerData } = await supabase
        .from('cleaners')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (!cleanerData) throw new Error('Cleaner profile not found');

      // 4. Create assignment
      const { error: assignmentError } = await supabase
        .from('cleaner_assignments')
        .insert({
          cleaner_id: cleanerData.id,
          property_id: invitation.property_id,
          active: true,
        });

      if (assignmentError) throw assignmentError;

      // 5. Update invitation status
      await supabase
        .from('cleaner_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          cleaner_id: cleanerData.id,
        })
        .eq('id', invitation.id);

      // 6. Store payment method if provided
      if (paymentMethod && paymentDetails) {
        // This could be stored in a payment_methods table in the future
        console.log('Payment method:', paymentMethod, paymentDetails);
      }

      toast.success('Account creato con successo!');
      navigate('/cleaner-dashboard');
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error(error.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={logoImage} alt="HostSuite" className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-blue-900">Crea il tuo Account Cleaner</h1>
          <p className="text-blue-700 mt-2">
            Sei stato invitato a: <strong>{invitation.properties?.nome}</strong>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Dati Account'}
              {step === 2 && 'Profilo Personale'}
              {step === 3 && 'Metodo di Pagamento'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Crea le tue credenziali di accesso'}
              {step === 2 && 'Inserisci i tuoi dati anagrafici'}
              {step === 3 && 'Come vuoi ricevere i pagamenti?'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@esempio.com"
                    disabled={!!invitation.email}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Almeno 6 caratteri"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Conferma Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti la password"
                  />
                </div>

                <Button onClick={handleStep1} className="w-full" size="lg">
                  Continua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      <User className="w-4 h-4 inline mr-2" />
                      Nome
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Mario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Cognome</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Rossi"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefono / WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+39 123 456 7890"
                    disabled={!!invitation.phone}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Indietro
                  </Button>
                  <Button onClick={handleStep2} className="flex-1">
                    Continua
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Metodo di Pagamento
                  </Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Seleziona metodo (opzionale)</option>
                    <option value="iban">Bonifico Bancario (IBAN)</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Contanti</option>
                  </select>
                </div>

                {paymentMethod && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentDetails">
                      {paymentMethod === 'iban' && 'IBAN'}
                      {paymentMethod === 'paypal' && 'Email PayPal'}
                      {paymentMethod === 'cash' && 'Note'}
                    </Label>
                    <Input
                      id="paymentDetails"
                      value={paymentDetails}
                      onChange={(e) => setPaymentDetails(e.target.value)}
                      placeholder={
                        paymentMethod === 'iban'
                          ? 'IT60X0542811101000000123456'
                          : paymentMethod === 'paypal'
                          ? 'nome@esempio.com'
                          : 'Dettagli pagamento'
                      }
                    />
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Puoi modificare queste informazioni in seguito dal tuo profilo
                </p>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                    Indietro
                  </Button>
                  <Button
                    onClick={handleStep3}
                    disabled={loading}
                    className="flex-1"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creazione account...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Completa Registrazione
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/cleaner-login" className="text-sm text-blue-600 hover:text-blue-800">
            Hai già un account? Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}

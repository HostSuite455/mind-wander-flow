import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function CleanerInviteAccept() {
  const { invitationCode } = useParams<{ invitationCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvitation();
  }, [invitationCode]);

  const loadInvitation = async () => {
    try {
      if (!invitationCode) {
        setError('Codice invito mancante');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_invitation_info', {
        p_code: invitationCode
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('Invito non trovato, già utilizzato o scaduto');
        return;
      }

      const invitationData = data[0];
      setInvitation({
        id: invitationData.invitation_id,
        property_id: invitationData.property_id,
        host_id: invitationData.host_id,
        properties: {
          nome: invitationData.property_name,
          address: invitationData.property_address,
          city: invitationData.property_city,
        }
      });
    } catch (err: any) {
      console.error('Error loading invitation:', err);
      setError(err.message || 'Errore nel caricamento dell\'invito');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.info('Crea il tuo account per accettare l\'invito');
        navigate(`/cleaner-signup?code=${invitationCode}`);
        return;
      }

      const { data, error } = await supabase.rpc('accept_cleaner_invitation', {
        p_code: invitationCode
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Errore accettazione');

      toast.success('Invito accettato! Benvenuto nel team.');
      navigate('/cleaner-dashboard');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Errore nell\'accettazione dell\'invito');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invito Non Valido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/cleaner-login')} className="w-full">
              Vai al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <CardTitle>Invito al Team di Pulizia</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Proprietà</p>
            <p className="font-semibold">{invitation.properties?.nome || 'Proprietà'}</p>
            {invitation.properties?.address && (
              <p className="text-sm mt-1">{invitation.properties.address}{invitation.properties.city && `, ${invitation.properties.city}`}</p>
            )}
          </div>
          <Button onClick={acceptInvitation} disabled={loading} className="w-full">
            {loading ? 'Accettazione...' : 'Accetta Invito'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

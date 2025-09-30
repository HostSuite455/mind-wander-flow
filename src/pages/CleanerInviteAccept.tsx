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

      const { data, error } = await supabase
        .from('cleaner_invitations')
        .select(`
          *,
          properties:property_id (
            nome,
            address,
            city
          )
        `)
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        setError('Invito non trovato o scaduto');
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError('Questo invito è scaduto');
        return;
      }

      console.log('Invitation loaded:', data);
      setInvitation(data);
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
        // Not authenticated → redirect to signup with invitation code
        toast.info('Crea il tuo account per accettare l\'invito');
        navigate(`/cleaner-signup?code=${invitationCode}`);
        return;
      }

      // Check if user already has a cleaner profile
      const { data: existingCleaner, error: cleanerCheckError } = await supabase
        .from('cleaners')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cleanerCheckError) {
        console.error('Error checking cleaner:', cleanerCheckError);
        throw new Error('Errore nel controllo del profilo');
      }

      let cleanerId: string;
      let isNewCleaner = false;

      if (existingCleaner) {
        // User is already a cleaner, just add new assignment
        cleanerId = existingCleaner.id;
        toast.info(`Bentornato ${existingCleaner.name}! Aggiunta nuova proprietà al tuo profilo.`);
      } else {
        // Create cleaner profile from user's profile data
        isNewCleaner = true;
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .maybeSingle();

        const cleanerName = profile && (profile.first_name || profile.last_name)
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          : user.email?.split('@')[0] || 'Cleaner';

        const { data: newCleaner, error: cleanerError } = await supabase
          .from('cleaners')
          .insert({
            user_id: user.id,
            owner_id: invitation.host_id,
            name: cleanerName,
            email: user.email,
            phone: profile?.phone || invitation.phone,
          })
          .select('id')
          .single();

        if (cleanerError) {
          console.error('Error creating cleaner:', cleanerError);
          throw new Error('Errore nella creazione del profilo: ' + cleanerError.message);
        }
        cleanerId = newCleaner.id;
      }

      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('cleaner_assignments')
        .select('id, active')
        .eq('cleaner_id', cleanerId)
        .eq('property_id', invitation.property_id)
        .maybeSingle();

      if (existingAssignment) {
        if (!existingAssignment.active) {
          // Reactivate existing assignment
          const { error: reactivateError } = await supabase
            .from('cleaner_assignments')
            .update({ active: true })
            .eq('id', existingAssignment.id);
          
          if (reactivateError) throw reactivateError;
          toast.success('Assegnazione riattivata!');
        } else {
          toast.info('Sei già assegnato a questa proprietà');
        }
      } else {
        // Create new assignment
        const { error: assignmentError } = await supabase
          .from('cleaner_assignments')
          .insert({
            cleaner_id: cleanerId,
            property_id: invitation.property_id,
            active: true,
          });

        if (assignmentError) {
          console.error('Error creating assignment:', assignmentError);
          throw new Error('Errore nell\'assegnazione: ' + assignmentError.message);
        }
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('cleaner_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          cleaner_id: cleanerId,
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        // Non bloccare il flusso per questo errore
      }

      if (isNewCleaner) {
        toast.success('Benvenuto nel team! Profilo creato con successo.');
      } else {
        toast.success('Invito accettato! Nuova proprietà aggiunta.');
      }
      
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
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento invito...</p>
        </div>
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
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Proprietà</p>
              <p className="font-semibold">
                {invitation.properties?.nome || 'Proprietà'}
              </p>
            </div>
            {invitation.properties?.address && (
              <div>
                <p className="text-sm text-muted-foreground">Indirizzo</p>
                <p className="text-sm">
                  {invitation.properties.address}
                  {invitation.properties.city && `, ${invitation.properties.city}`}
                </p>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Sei stato invitato a far parte del team di pulizia per questa proprietà.</p>
            <p className="mt-2">Accettando l'invito potrai:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Visualizzare i tuoi turni e task assegnati</li>
              <li>Completare checklist di pulizia</li>
              <li>Comunicare direttamente con il proprietario</li>
              <li>Gestire i tuoi pagamenti</li>
            </ul>
          </div>

          <Button 
            onClick={acceptInvitation} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Accettazione...' : 'Accetta Invito'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

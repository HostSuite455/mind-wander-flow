import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Mail, MessageSquare } from 'lucide-react';

interface InviteCleanerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName: string;
}

export default function InviteCleanerModal({ 
  open, 
  onOpenChange, 
  propertyId,
  propertyName 
}: InviteCleanerModalProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const generateInvite = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      // Call function to generate invitation code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_invitation_code');
      
      if (codeError) throw codeError;
      
      const invitationCode = codeData;

      // Create invitation record
      const { error: insertError } = await supabase
        .from('cleaner_invitations')
        .insert({
          host_id: user.id,
          property_id: propertyId,
          invitation_code: invitationCode,
          email: email || null,
          phone: phone || null,
          status: 'pending'
        });

      if (insertError) throw insertError;

      const link = `${window.location.origin}/invite/cleaner/${invitationCode}`;
      setInviteLink(link);

      toast.success('Invito generato con successo!');
    } catch (error: any) {
      console.error('Error generating invite:', error);
      toast.error('Errore nella generazione dell\'invito: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copiato negli appunti!');
  };

  const sendViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Ciao! Sei stato invitato a entrare nel team di pulizia per ${propertyName}. Accetta l'invito qui: ${inviteLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invita un Cleaner</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Stai invitando un cleaner per: <span className="font-semibold text-foreground">{propertyName}</span>
            </p>
          </div>

          {!inviteLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email (opzionale)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cleaner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono (opzionale)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+39 123 456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Button 
                onClick={generateInvite} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generazione...' : 'Genera Link Invito'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Link Invito Generato</Label>
                <div className="flex gap-2">
                  <Input 
                    value={inviteLink} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Il link scade tra 7 giorni
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={sendViaWhatsApp}
                  variant="outline"
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  onClick={() => {
                    window.location.href = `mailto:${email}?subject=Invito Team Pulizia&body=${encodeURIComponent(`Accetta l'invito: ${inviteLink}`)}`;
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={!email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>

              <Button 
                onClick={() => {
                  setInviteLink('');
                  setEmail('');
                  setPhone('');
                  onOpenChange(false);
                }}
                variant="secondary"
                className="w-full"
              >
                Chiudi
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

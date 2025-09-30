// Legacy component for PuliziePage
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamManagerProps {
  propertyId: string | null;
}

export default function TeamManager({ propertyId }: TeamManagerProps) {
  if (!propertyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestione Team</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Seleziona una proprietà</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Team</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funzionalità gestione team in arrivo...
        </p>
      </CardContent>
    </Card>
  );
}

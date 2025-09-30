import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface Props {
  property: Property;
}

export function PropertyEditTeam({ property }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Addetti</CardTitle>
        <CardDescription>
          Gestisci il team di addetti per questa proprietà
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium mb-2">
            Al momento non ci sono addetti nella tua squadra
          </h3>
          <p className="text-muted-foreground mb-6">
            Invita addetti alle pulizie per assegnare loro i compiti
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

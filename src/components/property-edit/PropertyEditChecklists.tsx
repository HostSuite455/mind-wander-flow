import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

interface Props {
  property: Property;
}

export function PropertyEditChecklists({ property }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste di Controllo</CardTitle>
        <CardDescription>
          Gestisci le checklist per questa proprietà
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium mb-2">Nessuna lista di controllo</h3>
          <p className="text-muted-foreground mb-6">
            Le liste di controllo aiutano gli addetti a completare tutte le attività
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

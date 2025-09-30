import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

interface Props {
  property: Property;
}

export function PropertyEditInventory({ property }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventario</CardTitle>
        <CardDescription>
          Gestisci l'inventario della proprietà
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium mb-2">
            Non ci sono oggetti nell'inventario
          </h3>
          <p className="text-muted-foreground mb-6">
            Gli inventari sono ottimi per assicurarsi che non manchi nulla per il
            prossimo ospite
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

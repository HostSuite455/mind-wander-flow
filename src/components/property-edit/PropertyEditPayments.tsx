import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

interface Props {
  property: Property;
}

export function PropertyEditPayments({ property }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamenti</CardTitle>
        <CardDescription>
          Configura i metodi di pagamento per gli addetti
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium mb-2">
            Non hai ancora aggiunto un metodo di pagamento
          </h3>
          <p className="text-muted-foreground mb-6">
            Configura i pagamenti automatici per i tuoi addetti
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

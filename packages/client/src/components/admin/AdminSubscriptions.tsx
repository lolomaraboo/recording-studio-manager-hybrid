import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CreditCard, Plus } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export function AdminSubscriptions() {
  const { data, isLoading } = trpc.admin.getSubscriptions.useQuery();

  if (isLoading) {
    return <div className="text-center py-12">Chargement des abonnements...</div>;
  }

  const plans = data?.plans || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plans d'abonnement</CardTitle>
            <CardDescription>
              Gérez les plans et les tarifs disponibles
            </CardDescription>
          </div>
          <Button onClick={() => toast.info("Fonctionnalité à venir")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau plan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Fonctionnalités</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan: Plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {plan.name}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {plan.id}
                  </code>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(plan.price / 100)}
                  <span className="text-muted-foreground text-sm">/mois</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {plan.features.map((feature: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {plans.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucun plan d'abonnement trouvé
          </div>
        )}
      </CardContent>
    </Card>
  );
}

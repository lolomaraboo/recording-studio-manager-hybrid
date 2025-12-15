/**
 * Subscription Page - Coming Soon
 *
 * Subscription management will be implemented in a future phase.
 */

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function Subscription() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Abonnement</CardTitle>
                <CardDescription>
                  Gerez votre abonnement et votre facturation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                La gestion des abonnements sera disponible dans une prochaine mise a jour.
                Vous pourrez gerer votre plan, voir vos factures et modifier vos informations de paiement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

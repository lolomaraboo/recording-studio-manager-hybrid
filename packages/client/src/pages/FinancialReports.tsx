/**
 * Financial Reports Page - Coming Soon
 *
 * Financial reports functionality will be implemented in a future phase.
 */

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function FinancialReports() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Rapports Financiers</CardTitle>
                <CardDescription>
                  Analysez vos revenus et performances financieres
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Les rapports financiers detailles seront disponibles dans une prochaine mise a jour.
                Vous pourrez suivre vos revenus, taux de recouvrement et tendances.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

/**
 * Analytics Page - Coming Soon
 *
 * Analytics dashboard will be implemented in a future phase.
 */

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Analysez les performances de votre studio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Le tableau de bord analytique sera disponible dans une prochaine mise a jour.
                Vous pourrez suivre vos KPIs, revenus et tendances.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

/**
 * Client Dashboard Page - Coming Soon
 *
 * Client dashboard will be implemented in a future phase.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function ClientDashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Home className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Tableau de bord Client</CardTitle>
                <CardDescription>
                  Bienvenue sur votre espace personnel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Le tableau de bord client sera disponible dans une prochaine mise a jour.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

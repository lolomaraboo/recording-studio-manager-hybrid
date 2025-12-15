/**
 * Rooms Page - Coming Soon
 *
 * Room management will be implemented in a future phase.
 */

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function Rooms() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Home className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Salles</CardTitle>
                <CardDescription>
                  Gerez vos salles d'enregistrement et leurs equipements
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                La gestion des salles sera disponible dans une prochaine mise a jour.
                Vous pourrez configurer vos espaces, tarifs et disponibilites.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

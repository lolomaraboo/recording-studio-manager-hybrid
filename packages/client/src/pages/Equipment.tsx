/**
 * Equipment Page - Coming Soon
 *
 * Equipment management will be implemented in a future phase.
 */

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function Equipment() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Equipement</CardTitle>
                <CardDescription>
                  Gerez votre inventaire de materiel audio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                La gestion d'equipement sera disponible dans une prochaine mise a jour.
                Vous pourrez inventorier votre materiel, suivre la maintenance et les reservations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

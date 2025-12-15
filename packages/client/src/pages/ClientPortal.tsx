/**
 * Client Portal Dashboard - Coming Soon
 *
 * Client portal will be implemented in a future phase.
 */

import { ClientPortalLayout } from "@/components/ClientPortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function ClientPortal() {
  return (
    <ClientPortalLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Home className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Portail Client</CardTitle>
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
              Le portail client complet sera disponible dans une prochaine mise a jour.
              Vous pourrez acceder a vos sessions, fichiers et factures.
            </p>
          </div>
        </CardContent>
      </Card>
    </ClientPortalLayout>
  );
}

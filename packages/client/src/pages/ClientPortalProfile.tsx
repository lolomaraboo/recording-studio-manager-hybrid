/**
 * Client Portal Profile Page - Coming Soon
 *
 * Client profile management will be implemented in a future phase.
 */

import { ClientPortalLayout } from "@/components/ClientPortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function ClientPortalProfile() {
  return (
    <ClientPortalLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <User className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Mon Profil</CardTitle>
              <CardDescription>
                Gerez vos informations personnelles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              La gestion de votre profil sera disponible dans une prochaine mise a jour.
            </p>
          </div>
        </CardContent>
      </Card>
    </ClientPortalLayout>
  );
}

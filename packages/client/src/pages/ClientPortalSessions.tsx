/**
 * Client Portal Sessions Page - Coming Soon
 *
 * Client sessions view will be implemented in a future phase.
 */

import { ClientPortalLayout } from "@/components/ClientPortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function ClientPortalSessions() {
  return (
    <ClientPortalLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Mes Sessions</CardTitle>
              <CardDescription>
                Consultez vos sessions d'enregistrement
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              La consultation de vos sessions sera disponible dans une prochaine mise a jour.
            </p>
          </div>
        </CardContent>
      </Card>
    </ClientPortalLayout>
  );
}

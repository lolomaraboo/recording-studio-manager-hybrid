/**
 * Client Portal Booking Page - Coming Soon
 *
 * Client booking will be implemented in a future phase.
 */

import { ClientPortalLayout } from "@/components/ClientPortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";

export default function ClientPortalBooking() {
  return (
    <ClientPortalLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CalendarPlus className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Reserver</CardTitle>
              <CardDescription>
                Reservez une session d'enregistrement
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CalendarPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              La reservation de sessions sera disponible dans une prochaine mise a jour.
            </p>
          </div>
        </CardContent>
      </Card>
    </ClientPortalLayout>
  );
}

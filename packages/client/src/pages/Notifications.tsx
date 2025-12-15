/**
 * Notifications Page - Coming Soon
 *
 * Notifications center will be implemented in a future phase.
 */

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Centre de notifications et alertes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Le centre de notifications sera disponible dans une prochaine mise a jour.
                Vous pourrez voir toutes vos alertes, rappels et messages systeme.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

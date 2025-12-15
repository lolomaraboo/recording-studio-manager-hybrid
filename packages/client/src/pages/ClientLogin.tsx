/**
 * Client Login Page - Coming Soon
 *
 * Client login will be implemented in a future phase.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function ClientLogin() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <LogIn className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Connexion Client</CardTitle>
              <CardDescription>
                Accedez a votre espace personnel
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LogIn className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              La connexion client sera disponible dans une prochaine mise a jour.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

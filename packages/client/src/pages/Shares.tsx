/**
 * Shares Page - Coming Soon
 *
 * File sharing functionality will be implemented in a future phase.
 */

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2 } from "lucide-react";

export default function Shares() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Share2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Partages</CardTitle>
                <CardDescription>
                  Gerez vos liens de partage securises
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Share2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Le partage de fichiers sera disponible dans une prochaine mise a jour.
                Vous pourrez creer des liens securises pour partager vos projets et fichiers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

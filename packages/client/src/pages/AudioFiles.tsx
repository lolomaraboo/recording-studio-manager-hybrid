/**
 * Audio Files Page - Coming Soon
 *
 * Audio file management will be implemented in a future phase.
 */

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio } from "lucide-react";

export default function AudioFiles() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <FileAudio className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Fichiers Audio</CardTitle>
                <CardDescription>
                  Gerez vos fichiers audio et enregistrements
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileAudio className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                La gestion des fichiers audio sera disponible dans une prochaine mise a jour.
                Vous pourrez uploader, organiser et partager vos enregistrements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

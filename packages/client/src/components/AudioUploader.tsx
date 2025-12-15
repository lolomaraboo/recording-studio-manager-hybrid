/**
 * Audio Uploader Component - Coming Soon
 *
 * Audio file upload functionality will be available in a future update.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface AudioUploaderProps {
  projectId: number;
  onSuccess?: () => void;
}

export function AudioUploader({ projectId: _projectId, onSuccess: _onSuccess }: AudioUploaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Audio
        </CardTitle>
        <CardDescription>
          Uploadez vos fichiers audio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Bientot disponible</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            L'upload de fichiers audio sera disponible dans une prochaine mise a jour.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

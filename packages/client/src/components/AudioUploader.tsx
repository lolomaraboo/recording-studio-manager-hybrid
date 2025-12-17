import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileAudio } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AudioUploaderProps {
  projectId: number;
  onSuccess?: () => void;
}

export function AudioUploader({ projectId, onSuccess }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("raw");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createFileMutation = trpc.files.create.useMutation({
    onSuccess: () => {
      toast.success("Fichier uploadé avec succès");
      setFile(null);
      setDescription("");
      setVersion("");
      setUploadProgress(0);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
      setUploading(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier le type de fichier
    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
      "audio/ogg",
      "audio/flac",
      "audio/aac",
      "audio/m4a",
    ];

    if (!allowedTypes.some((type) => selectedFile.type.includes(type.split("/")[1]))) {
      toast.error("Type de fichier non supporté. Formats acceptés: MP3, WAV, OGG, FLAC, AAC, M4A");
      return;
    }

    // Vérifier la taille (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("Le fichier est trop volumineux (max 500MB)");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simuler la progression de l'upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Générer un nom de fichier sécurisé (mock)
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = file.name.split(".").pop();
      const fileKey = `audio/${projectId}/${timestamp}-${random}.${ext}`;
      const fileUrl = `https://mock-s3-bucket.s3.amazonaws.com/${fileKey}`;

      // Simuler un délai d'upload
      await new Promise((resolve) => setTimeout(resolve, 1500));

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Créer l'entrée en base de données (mock)
      await createFileMutation.mutateAsync({
        projectId,
        fileName: file.name,
        fileKey,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        category: category as any,
        description: description || undefined,
        version: version || undefined,
      });

      setUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload du fichier");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Zone de sélection de fichier */}
      <div>
        <Label>Fichier audio *</Label>
        <div className="mt-2">
          {!file ? (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Cliquez pour sélectionner un fichier audio
              </p>
              <p className="text-xs text-muted-foreground">
                MP3, WAV, OGG, FLAC, AAC, M4A (max 500MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileAudio className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {uploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Upload en cours... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Métadonnées */}
      {file && !uploading && (
        <>
          <div>
            <Label>Catégorie *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Brut (Raw)</SelectItem>
                <SelectItem value="mixed">Mixé (Mixed)</SelectItem>
                <SelectItem value="mastered">Masterisé (Mastered)</SelectItem>
                <SelectItem value="reference">Référence</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Version</Label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1, v2, final..."
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Notes sur ce fichier..."
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? "Upload en cours..." : "Uploader le fichier"}
          </Button>
        </>
      )}
    </div>
  );
}

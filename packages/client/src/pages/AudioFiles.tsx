import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Download, Trash2, FileAudio, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { AudioUploader } from "@/components/AudioUploader";

export default function AudioFiles() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [playingFileId, setPlayingFileId] = useState<number | null>(null);

  const { data: files, refetch } = trpc.files.list.useQuery({
    category: categoryFilter === "all" ? undefined : (categoryFilter as any),
    search: searchQuery || undefined,
  });

  const { data: stats } = trpc.files.getStats.useQuery({});
  const { data: projects } = trpc.projects.list.useQuery({});

  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      toast.success("Fichier supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { refetch: getDownloadUrl } = trpc.files.getDownloadUrl.useQuery(
    { id: 0 },
    { enabled: false }
  );

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const result = await getDownloadUrl({ id: fileId });
      if (result.data?.url) {
        const link = document.createElement("a");
        link.href = result.data.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      raw: { variant: "secondary", label: "Brut" },
      mixed: { variant: "default", label: "Mixé" },
      mastered: { variant: "default", label: "Masterisé" },
      reference: { variant: "outline", label: "Référence" },
      other: { variant: "secondary", label: "Autre" },
    };

    const config = variants[category] || variants.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <AppLayout>
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fichiers Audio</h1>
          <p className="text-muted-foreground">
            Gérez vos fichiers audio et enregistrements
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Uploader un fichier
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Taille totale</CardDescription>
              <CardTitle className="text-3xl">
                {formatFileSize(stats.totalSize)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bruts</CardDescription>
              <CardTitle className="text-3xl">{stats.byCategory.raw}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Masterisés</CardDescription>
              <CardTitle className="text-3xl">
                {stats.byCategory.mastered}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="raw">Brut</SelectItem>
                  <SelectItem value="mixed">Mixé</SelectItem>
                  <SelectItem value="mastered">Masterisé</SelectItem>
                  <SelectItem value="reference">Référence</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rechercher</Label>
              <Input
                placeholder="Nom de fichier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fichiers */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des fichiers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files?.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileAudio className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{file.fileName}</p>
                        {file.description && (
                          <p className="text-xs text-muted-foreground">
                            {file.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(file.category)}</TableCell>
                  <TableCell>{file.version || "-"}</TableCell>
                  <TableCell>{formatFileSize(file.fileSize || 0)}</TableCell>
                  <TableCell>
                    {new Date(file.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownload(file.id, file.fileName)
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!files || files.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Aucun fichier trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog d'upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uploader un fichier audio</DialogTitle>
            <DialogDescription>
              Sélectionnez un projet et uploadez votre fichier audio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Projet *</Label>
              <Select
                value={selectedProjectId?.toString() || ""}
                onValueChange={(value) => setSelectedProjectId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProjectId && (
              <AudioUploader
                projectId={selectedProjectId}
                onSuccess={() => {
                  refetch();
                  setIsUploadDialogOpen(false);
                  setSelectedProjectId(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
}

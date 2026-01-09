import { useState } from "react";
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
import { Plus, Download, Trash2, FileAudio, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AudioUploader } from "@/components/AudioUploader";
import { Link } from "react-router-dom";

export default function AudioFiles() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    fileName: "",
    category: "",
    version: "",
    description: "",
  });

  const { data: files, refetch } = trpc.files.list.useQuery({
    category: categoryFilter === "all" ? undefined : (categoryFilter as any),
    search: searchQuery || undefined,
  });

  const { data: stats } = trpc.files.getStats.useQuery({});
  const { data: projects } = trpc.projects.list.useQuery();

  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      toast.success("Fichier supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.files.update.useMutation({
    onSuccess: () => {
      toast.success("Fichier mis à jour");
      refetch();
      setIsEditDialogOpen(false);
      setEditingFile(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { refetch: getDownloadUrl } = trpc.files.getDownloadUrl.useQuery(
    { id: 0 },
    { enabled: false }
  );

  const handleEdit = (file: any) => {
    setEditingFile(file);
    setEditFormData({
      fileName: file.fileName,
      category: file.category,
      version: file.version || "",
      description: file.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateFile = () => {
    if (!editingFile) return;

    updateMutation.mutate({
      id: editingFile.id,
      fileName: editFormData.fileName,
      category: editFormData.category as any,
      version: editFormData.version || undefined,
      description: editFormData.description || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDownload = async (_fileId: number, _fileName: string) => {
    try {
      const result = await getDownloadUrl();
      if (result.data?.url) {
        // Mock: In real implementation, this would download from S3
        toast.info("Téléchargement simulé (intégration S3 à venir)");
        console.log("Download URL:", result.data.url);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <FileAudio className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Fichiers Audio</h1>
            </div>
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uploader un fichier
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-6">
          {/* Statistiques */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-4">
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
          <Card>
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
                            onClick={() => handleEdit(file)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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
        </div>
      </main>

      {/* Dialog d'upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uploader un fichier audio</DialogTitle>
            <DialogDescription>
              Sélectionnez un projet et uploadez votre fichier audio (mock - intégration S3 à venir)
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le fichier audio</DialogTitle>
            <DialogDescription>
              Modifiez les métadonnées du fichier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fileName">Nom du fichier *</Label>
              <Input
                id="fileName"
                value={editFormData.fileName}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, fileName: e.target.value })
                }
                placeholder="ex: vocals_final.wav"
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={editFormData.category}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">Brut</SelectItem>
                  <SelectItem value="mixed">Mixé</SelectItem>
                  <SelectItem value="mastered">Masterisé</SelectItem>
                  <SelectItem value="reference">Référence</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={editFormData.version}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, version: e.target.value })
                }
                placeholder="ex: v1, final, draft..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Notes sur ce fichier..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingFile(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateFile}
              disabled={
                !editFormData.fileName ||
                !editFormData.category ||
                updateMutation.isPending
              }
            >
              {updateMutation.isPending ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

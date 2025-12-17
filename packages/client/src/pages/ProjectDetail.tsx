import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Music,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  DollarSign,
  User,
  Disc,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const projectTypeLabels: Record<string, string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  demo: "Demo",
  soundtrack: "Bande originale",
  podcast: "Podcast",
};

const statusLabels: Record<string, { label: string; variant: any }> = {
  pre_production: { label: "Pré-production", variant: "outline" },
  recording: { label: "Enregistrement", variant: "default" },
  editing: { label: "Édition", variant: "default" },
  mixing: { label: "Mixage", variant: "secondary" },
  mastering: { label: "Mastering", variant: "secondary" },
  completed: { label: "Terminé", variant: "default" },
  delivered: { label: "Livré", variant: "default" },
  archived: { label: "Archivé", variant: "outline" },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch project data with tracks
  const { data: project, isLoading, refetch } = trpc.projects.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch clients for dropdown
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });

  // Mutations
  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Projet mis à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Projet supprimé");
      navigate("/projects");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    artistName: "",
    description: "",
    genre: "",
    type: "album" as "album" | "ep" | "single" | "demo" | "soundtrack" | "podcast",
    status: "pre_production" as
      | "pre_production"
      | "recording"
      | "editing"
      | "mixing"
      | "mastering"
      | "completed"
      | "delivered"
      | "archived",
    targetDeliveryDate: "",
    actualDeliveryDate: "",
    budget: "",
    totalCost: "",
    label: "",
    notes: "",
  });

  // Update form when project loads
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        artistName: project.artistName || "",
        description: project.description || "",
        genre: project.genre || "",
        type: project.type,
        status: project.status,
        targetDeliveryDate: project.targetDeliveryDate
          ? new Date(project.targetDeliveryDate).toISOString().split("T")[0]
          : "",
        actualDeliveryDate: project.actualDeliveryDate
          ? new Date(project.actualDeliveryDate).toISOString().split("T")[0]
          : "",
        budget: project.budget || "",
        totalCost: project.totalCost || "",
        label: project.label || "",
        notes: project.notes || "",
      });
    }
  }, [project]);

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      ...formData,
      targetDeliveryDate: formData.targetDeliveryDate
        ? new Date(formData.targetDeliveryDate)
        : undefined,
      actualDeliveryDate: formData.actualDeliveryDate
        ? new Date(formData.actualDeliveryDate)
        : undefined,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const client = clients?.find((c) => c.id === project?.clientId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="container py-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Projet introuvable</h1>
          </div>
        </header>
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Ce projet n'existe pas ou a été supprimé.</p>
              <Button className="mt-4" asChild>
                <Link to="/projects">Retour aux projets</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">
                {project.artistName ? `${project.artistName} • ` : ""}Projet #{project.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Project Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du projet</CardTitle>
                <CardDescription>Détails et paramètres du projet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom du projet</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="artistName">Artiste</Label>
                        <Input
                          id="artistName"
                          value={formData.artistName}
                          onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger id="type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(projectTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="genre">Genre</Label>
                        <Input
                          id="genre"
                          value={formData.genre}
                          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                          placeholder="Rock, Pop, Jazz..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                          id="label"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="targetDeliveryDate">Date de livraison prévue</Label>
                        <Input
                          id="targetDeliveryDate"
                          type="date"
                          value={formData.targetDeliveryDate}
                          onChange={(e) =>
                            setFormData({ ...formData, targetDeliveryDate: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="actualDeliveryDate">Date de livraison réelle</Label>
                        <Input
                          id="actualDeliveryDate"
                          type="date"
                          value={formData.actualDeliveryDate}
                          onChange={(e) =>
                            setFormData({ ...formData, actualDeliveryDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget (€)</Label>
                        <Input
                          id="budget"
                          type="number"
                          step="0.01"
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="totalCost">Coût total (€)</Label>
                        <Input
                          id="totalCost"
                          type="number"
                          step="0.01"
                          value={formData.totalCost}
                          onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{project.description || "Aucune description"}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Type</p>
                        <Badge variant="outline">{projectTypeLabels[project.type]}</Badge>
                      </div>

                      {project.genre && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Genre</p>
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            <span className="text-sm">{project.genre}</span>
                          </div>
                        </div>
                      )}

                      {project.label && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Label</p>
                          <div className="flex items-center gap-2">
                            <Disc className="h-4 w-4" />
                            <span className="text-sm">{project.label}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {project.targetDeliveryDate && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Livraison prévue</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <p className="text-sm">
                              {format(new Date(project.targetDeliveryDate), "dd MMMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {project.actualDeliveryDate && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Livré le</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <p className="text-sm">
                              {format(new Date(project.actualDeliveryDate), "dd MMMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {(project.budget || project.totalCost) && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {project.budget && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Budget</p>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <p className="text-lg font-semibold">{project.budget} €</p>
                            </div>
                          </div>
                        )}

                        {project.totalCost && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Coût total</p>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <p className="text-lg font-semibold">{project.totalCost} €</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tracks Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pistes</CardTitle>
                    <CardDescription>
                      {project.tracks?.length || 0} piste(s) dans ce projet
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une piste
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.tracks && project.tracks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Piste</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.tracks.map((track: any) => (
                        <TableRow key={track.id}>
                          <TableCell className="font-medium">#{track.trackNumber}</TableCell>
                          <TableCell>{track.title}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {track.duration || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{track.status || "pending"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/tracks/${track.id}`}>Détails</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Aucune piste dans ce projet</p>
                    <p className="text-sm">Ajoutez votre première piste pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            {(project.notes || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={6}
                      placeholder="Notes sur le projet..."
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {project.notes || "Aucune note"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Statut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut du projet</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Badge variant={statusLabels[project.status].variant}>
                      {statusLabels[project.status].label}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Info */}
            {client && (
              <Card>
                <CardHeader>
                  <CardTitle>Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <Link to={`/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meta Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID</p>
                  <p className="text-sm font-medium">#{project.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Créé le</p>
                  <p className="text-sm">
                    {format(new Date(project.createdAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mis à jour</p>
                  <p className="text-sm">
                    {format(new Date(project.updatedAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/projects">Retour aux projets</Link>
                </Button>
                {client && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/clients/${client.id}`}>Voir le client</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le projet</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible et
              supprimera également toutes les pistes associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

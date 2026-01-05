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
import { FileUploadButton } from "@/components/FileUploadButton";

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
  const [showCreateTrackDialog, setShowCreateTrackDialog] = useState(false);

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

  const createTrackMutation = trpc.projects.tracks.create.useMutation({
    onSuccess: () => {
      toast.success("Piste créée");
      setShowCreateTrackDialog(false);
      setTrackFormData({
        title: "",
        trackNumber: (project?.tracks?.length || 0) + 1,
        duration: 0,
        isrc: "",
        status: "recording",
        bpm: undefined,
        key: "",
        lyrics: "",
        demoUrl: "",
        roughMixUrl: "",
        finalMixUrl: "",
        masterUrl: "",
        composer: "",
        lyricist: "",
        copyrightHolder: "",
        copyrightYear: undefined,
        genreTags: "",
        mood: "",
        language: "fr",
        explicitContent: false,
        patchPreset: "",
        instrumentsUsed: "",
        microphonesUsed: "",
        effectsChain: "",
        dawSessionPath: "",
        notes: "",
        technicalNotes: "",
      });
      refetch();
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

  // Track form state
  const [trackFormData, setTrackFormData] = useState({
    title: "",
    trackNumber: 1,
    duration: 0,
    isrc: "",
    status: "recording" as "recording" | "editing" | "mixing" | "mastering" | "completed",
    bpm: undefined as number | undefined,
    key: "",
    lyrics: "",
    // Versioning (4 fields)
    demoUrl: "",
    roughMixUrl: "",
    finalMixUrl: "",
    masterUrl: "",
    // Copyright Metadata (8 fields)
    composer: "",
    lyricist: "",
    copyrightHolder: "",
    copyrightYear: undefined as number | undefined,
    genreTags: "", // JSON array as string
    mood: "",
    language: "fr",
    explicitContent: false,
    // Technical Details (5 fields)
    patchPreset: "", // JSON as string
    instrumentsUsed: "", // JSON array as string
    microphonesUsed: "", // JSON array as string
    effectsChain: "", // JSON as string
    dawSessionPath: "",
    notes: "",
    technicalNotes: "",
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

  const handleCreateTrack = () => {
    createTrackMutation.mutate({
      projectId: Number(id),
      ...trackFormData,
      duration: trackFormData.duration || undefined,
      bpm: trackFormData.bpm || undefined,
      copyrightYear: trackFormData.copyrightYear || undefined,
    });
  };

  const client = clients?.find((c) => c.id === project?.clientId);

  if (isLoading) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Projet introuvable</h1>
          </div>
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Ce projet n'existe pas ou a été supprimé.</p>
              <Button size="sm" asChild>
                <Link to="/projects">Retour aux projets</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                {project.name}
              </h2>
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

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Project Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informations du projet</CardTitle>
                <CardDescription className="text-sm">Détails et paramètres du projet</CardDescription>
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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Pistes</CardTitle>
                    <CardDescription className="text-sm">
                      {project.tracks?.length || 0} piste(s) dans ce projet
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setTrackFormData({
                      ...trackFormData,
                      trackNumber: (project.tracks?.length || 0) + 1,
                    });
                    setShowCreateTrackDialog(true);
                  }}>
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
                  <div className="text-center py-6">
                    <Music className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="text-sm font-medium mb-1">Aucune piste dans ce projet</h3>
                    <p className="text-sm text-muted-foreground">Ajoutez votre première piste pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            {(project.notes || isEditing) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notes</CardTitle>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Statut</CardTitle>
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
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Client</CardTitle>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informations</CardTitle>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions rapides</CardTitle>
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

        {/* Create Track Dialog */}
        <Dialog open={showCreateTrackDialog} onOpenChange={setShowCreateTrackDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une piste</DialogTitle>
            <DialogDescription>
              Créer une nouvelle piste dans le projet {project?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Informations de base</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="track-title">Titre *</Label>
                  <Input
                    id="track-title"
                    value={trackFormData.title}
                    onChange={(e) => setTrackFormData({ ...trackFormData, title: e.target.value })}
                    placeholder="Nom de la piste"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-number">Numéro de piste</Label>
                  <Input
                    id="track-number"
                    type="number"
                    min="1"
                    value={trackFormData.trackNumber}
                    onChange={(e) => setTrackFormData({ ...trackFormData, trackNumber: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-duration">Durée (secondes)</Label>
                  <Input
                    id="track-duration"
                    type="number"
                    min="0"
                    value={trackFormData.duration}
                    onChange={(e) => setTrackFormData({ ...trackFormData, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-isrc">ISRC</Label>
                  <Input
                    id="track-isrc"
                    value={trackFormData.isrc}
                    onChange={(e) => setTrackFormData({ ...trackFormData, isrc: e.target.value })}
                    placeholder="Code ISRC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-bpm">BPM</Label>
                  <Input
                    id="track-bpm"
                    type="number"
                    min="1"
                    max="300"
                    value={trackFormData.bpm || ""}
                    onChange={(e) => setTrackFormData({ ...trackFormData, bpm: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-key">Tonalité</Label>
                  <Input
                    id="track-key"
                    value={trackFormData.key}
                    onChange={(e) => setTrackFormData({ ...trackFormData, key: e.target.value })}
                    placeholder="C, Am, F#..."
                  />
                </div>
              </div>
            </div>

            {/* Versioning URLs */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Versioning (Upload de fichiers audio)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="track-demo-url">Demo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="track-demo-url"
                      value={trackFormData.demoUrl}
                      onChange={(e) => setTrackFormData({ ...trackFormData, demoUrl: e.target.value })}
                      placeholder="URL généré après upload..."
                      readOnly
                    />
                    <FileUploadButton
                      versionType="demo"
                      currentUrl={trackFormData.demoUrl}
                      onUploadSuccess={(url) => setTrackFormData({ ...trackFormData, demoUrl: url })}
                      onUploadError={(error) => toast.error(error)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-rough-mix-url">Rough Mix</Label>
                  <div className="flex gap-2">
                    <Input
                      id="track-rough-mix-url"
                      value={trackFormData.roughMixUrl}
                      onChange={(e) => setTrackFormData({ ...trackFormData, roughMixUrl: e.target.value })}
                      placeholder="URL généré après upload..."
                      readOnly
                    />
                    <FileUploadButton
                      versionType="roughMix"
                      currentUrl={trackFormData.roughMixUrl}
                      onUploadSuccess={(url) => setTrackFormData({ ...trackFormData, roughMixUrl: url })}
                      onUploadError={(error) => toast.error(error)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-final-mix-url">Final Mix</Label>
                  <div className="flex gap-2">
                    <Input
                      id="track-final-mix-url"
                      value={trackFormData.finalMixUrl}
                      onChange={(e) => setTrackFormData({ ...trackFormData, finalMixUrl: e.target.value })}
                      placeholder="URL généré après upload..."
                      readOnly
                    />
                    <FileUploadButton
                      versionType="finalMix"
                      currentUrl={trackFormData.finalMixUrl}
                      onUploadSuccess={(url) => setTrackFormData({ ...trackFormData, finalMixUrl: url })}
                      onUploadError={(error) => toast.error(error)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-master-url">Master</Label>
                  <div className="flex gap-2">
                    <Input
                      id="track-master-url"
                      value={trackFormData.masterUrl}
                      onChange={(e) => setTrackFormData({ ...trackFormData, masterUrl: e.target.value })}
                      placeholder="URL généré après upload..."
                      readOnly
                    />
                    <FileUploadButton
                      versionType="master"
                      currentUrl={trackFormData.masterUrl}
                      onUploadSuccess={(url) => setTrackFormData({ ...trackFormData, masterUrl: url })}
                      onUploadError={(error) => toast.error(error)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright Metadata */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Copyright & Métadonnées</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="track-composer">Compositeur</Label>
                  <Input
                    id="track-composer"
                    value={trackFormData.composer}
                    onChange={(e) => setTrackFormData({ ...trackFormData, composer: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-lyricist">Parolier</Label>
                  <Input
                    id="track-lyricist"
                    value={trackFormData.lyricist}
                    onChange={(e) => setTrackFormData({ ...trackFormData, lyricist: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-copyright-holder">Détenteur des droits</Label>
                  <Input
                    id="track-copyright-holder"
                    value={trackFormData.copyrightHolder}
                    onChange={(e) => setTrackFormData({ ...trackFormData, copyrightHolder: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-copyright-year">Année copyright</Label>
                  <Input
                    id="track-copyright-year"
                    type="number"
                    min="1900"
                    max="2100"
                    value={trackFormData.copyrightYear || ""}
                    onChange={(e) => setTrackFormData({ ...trackFormData, copyrightYear: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-genre-tags">Genres (JSON array)</Label>
                  <Input
                    id="track-genre-tags"
                    value={trackFormData.genreTags}
                    onChange={(e) => setTrackFormData({ ...trackFormData, genreTags: e.target.value })}
                    placeholder='["Rock", "Indie"]'
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-mood">Ambiance</Label>
                  <Input
                    id="track-mood"
                    value={trackFormData.mood}
                    onChange={(e) => setTrackFormData({ ...trackFormData, mood: e.target.value })}
                    placeholder="Energetic, Melancholic..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-language">Langue (ISO 639-1)</Label>
                  <Input
                    id="track-language"
                    value={trackFormData.language}
                    onChange={(e) => setTrackFormData({ ...trackFormData, language: e.target.value })}
                    placeholder="fr, en, es..."
                    maxLength={2}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="track-explicit-content"
                    checked={trackFormData.explicitContent}
                    onChange={(e) => setTrackFormData({ ...trackFormData, explicitContent: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="track-explicit-content">Contenu explicite</Label>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Détails Techniques</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="track-instruments-used">Instruments utilisés (JSON array)</Label>
                  <Input
                    id="track-instruments-used"
                    value={trackFormData.instrumentsUsed}
                    onChange={(e) => setTrackFormData({ ...trackFormData, instrumentsUsed: e.target.value })}
                    placeholder='["Fender Stratocaster", "Prophet-5"]'
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track-microphones-used">Microphones utilisés (JSON array)</Label>
                  <Input
                    id="track-microphones-used"
                    value={trackFormData.microphonesUsed}
                    onChange={(e) => setTrackFormData({ ...trackFormData, microphonesUsed: e.target.value })}
                    placeholder='["Neumann U87", "Shure SM57"]'
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="track-daw-session-path">Chemin de session DAW</Label>
                  <Input
                    id="track-daw-session-path"
                    value={trackFormData.dawSessionPath}
                    onChange={(e) => setTrackFormData({ ...trackFormData, dawSessionPath: e.target.value })}
                    placeholder="/path/to/project.als"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="track-patch-preset">Patch/Preset (JSON)</Label>
                  <Textarea
                    id="track-patch-preset"
                    value={trackFormData.patchPreset}
                    onChange={(e) => setTrackFormData({ ...trackFormData, patchPreset: e.target.value })}
                    placeholder='{"synth": "Prophet-5", "patch": "Brass Lead"}'
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="track-effects-chain">Chaîne d'effets (JSON)</Label>
                  <Textarea
                    id="track-effects-chain"
                    value={trackFormData.effectsChain}
                    onChange={(e) => setTrackFormData({ ...trackFormData, effectsChain: e.target.value })}
                    placeholder='{"pre": ["Comp"], "post": ["Reverb"], "master": []}'
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Notes</h3>
              <div className="space-y-2">
                <Label htmlFor="track-notes">Notes générales</Label>
                <Textarea
                  id="track-notes"
                  value={trackFormData.notes}
                  onChange={(e) => setTrackFormData({ ...trackFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="track-technical-notes">Notes techniques</Label>
                <Textarea
                  id="track-technical-notes"
                  value={trackFormData.technicalNotes}
                  onChange={(e) => setTrackFormData({ ...trackFormData, technicalNotes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTrackDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTrack} disabled={createTrackMutation.isPending || !trackFormData.title}>
              <Plus className="mr-2 h-4 w-4" />
              Créer la piste
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

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
    </div>
  );
}

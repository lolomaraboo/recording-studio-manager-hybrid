/**
 * Page Gestion de Projets Musicaux
 *
 * Fonctionnalités :
 * - Liste des projets avec filtres et recherche
 * - Création/édition de projets
 * - Gestion des crédits/musiciens
 * - Suivi des étapes de production
 * - Upload et gestion de fichiers audio
 * - Gestion des tracks (NOUVEAU)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  Music,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type ProjectStatus = "pre_production" | "recording" | "editing" | "mixing" | "mastering" | "completed" | "delivered" | "archived";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Récupérer la liste des projets
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();

  // Récupérer les clients pour le formulaire
  const { data: clients } = trpc.clients.list.useQuery();

  // Mutations
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Projet créé avec succès");
      setShowCreateDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Projet supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filtrer les projets
  const filteredProjects = projects?.filter((project: any) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (formData: any) => {
    createProjectMutation.mutate(formData);
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      deleteProjectMutation.mutate({ id: projectId });
    }
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Music className="h-8 w-8 text-primary" />
              Projets Musicaux
            </h2>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Projet
          </Button>
        </div>
        {/* Filtres */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre ou artiste..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pre_production">Pré-production</SelectItem>
                  <SelectItem value="recording">Enregistrement</SelectItem>
                  <SelectItem value="editing">Édition</SelectItem>
                  <SelectItem value="mixing">Mixage</SelectItem>
                  <SelectItem value="mastering">Mastering</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des projets */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project: any) => (
              <Card key={project.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                      {project.artistName && (
                        <CardDescription className="text-sm truncate">{project.artistName}</CardDescription>
                      )}
                    </div>
                    {getStatusBadge(project.status as ProjectStatus)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informations principales */}
                  <div className="space-y-2 text-sm">
                    {project.genre && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Music className="h-4 w-4" />
                        <span>{project.genre}</span>
                      </div>
                    )}
                    {project.startDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(project.startDate), "dd MMM yyyy", { locale: fr })}</span>
                      </div>
                    )}
                    {project.budget && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{(project.budget / 100).toFixed(2)} €</span>
                      </div>
                    )}
                  </div>

                  {/* Progression */}
                  {project.status !== "cancelled" && project.status !== "completed" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link to={`/projects/${project.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Détails
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <Music className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-medium mb-1">Aucun projet trouvé</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {searchQuery || statusFilter !== "all"
                  ? "Aucun projet ne correspond à vos critères de recherche"
                  : "Créez votre premier projet musical pour commencer"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setShowCreateDialog(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un projet
                </Button>
              )}
          </CardContent>
        </Card>
        )}
      </div>

      {/* Dialog Création de Projet */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        clients={clients || []}
        onSubmit={handleCreateProject}
        isLoading={createProjectMutation.isPending}
      />

    </div>
  );
}

/**
 * Dialog de création de projet
 */
function CreateProjectDialog({
  open,
  onOpenChange,
  clients,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    clientId: "",
    name: "",
    artistName: "",
    genre: "",
    description: "",
    status: "pre_production" as ProjectStatus,
    startDate: "",
    budget: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      clientId: parseInt(formData.clientId),
      name: formData.name,
      artistName: formData.artistName || undefined,
      genre: formData.genre || undefined,
      description: formData.description || undefined,
      status: formData.status,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
          <DialogDescription>
            Renseignez les informations du projet musical
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="client">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Titre du projet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Album 'Nouveau Départ'"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistName">Artiste</Label>
              <Input
                id="artistName"
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                placeholder="Ex: Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="Ex: Rock, Pop, Hip-Hop"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_production">Pré-production</SelectItem>
                  <SelectItem value="recording">Enregistrement</SelectItem>
                  <SelectItem value="editing">Édition</SelectItem>
                  <SelectItem value="mixing">Mixage</SelectItem>
                  <SelectItem value="mastering">Mastering</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (€)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="Ex: 5000.00"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du projet, objectifs, notes..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Création..." : "Créer le projet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// Helper pour obtenir le badge de statut
function getStatusBadge(status: ProjectStatus) {
  const config: Record<ProjectStatus, { variant: "default" | "secondary" | "destructive" | "outline", label: string, icon: any }> = {
    pre_production: { variant: "outline", label: "Pré-production", icon: Clock },
    recording: { variant: "default", label: "Enregistrement", icon: Music },
    editing: { variant: "default", label: "Édition", icon: Music },
    mixing: { variant: "secondary", label: "Mixage", icon: Music },
    mastering: { variant: "secondary", label: "Mastering", icon: Music },
    completed: { variant: "default", label: "Terminé", icon: CheckCircle2 },
    delivered: { variant: "default", label: "Livré", icon: CheckCircle2 },
    archived: { variant: "outline", label: "Archivé", icon: XCircle },
  };

  const { variant, label, icon: Icon } = config[status];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

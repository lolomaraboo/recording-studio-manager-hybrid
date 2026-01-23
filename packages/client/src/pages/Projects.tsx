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

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import {
  Music,
  Plus,
  Search,
  Trash2,
  ArrowLeft,
  Eye,
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
  const filteredProjects = useMemo(() => {
    let result = projects?.slice() || [];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (project: any) =>
          project.name?.toLowerCase().includes(query) ||
          project.artistName?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((project: any) => project.status === statusFilter);
    }

    // Sort by start date (most recent first)
    result.sort((a: any, b: any) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [projects, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!projects) return { total: 0, inProgress: 0, completed: 0 };

    const total = projects.length;
    const inProgress = projects.filter((p: any) =>
      ["pre_production", "recording", "editing", "mixing", "mastering"].includes(p.status)
    ).length;
    const completed = projects.filter((p: any) =>
      ["completed", "delivered"].includes(p.status)
    ).length;

    return { total, inProgress, completed };
  }, [projects]);

  const handleCreateProject = (formData: any) => {
    createProjectMutation.mutate(formData);
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      deleteProjectMutation.mutate({ id: projectId });
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const config: Record<ProjectStatus, { label: string; className: string }> = {
      pre_production: { label: "Pre-production", className: "bg-gray-100 text-gray-700 border-gray-200" },
      recording: { label: "Enregistrement", className: "bg-blue-100 text-blue-700 border-blue-200" },
      editing: { label: "Edition", className: "bg-blue-100 text-blue-700 border-blue-200" },
      mixing: { label: "Mixage", className: "bg-purple-100 text-purple-700 border-purple-200" },
      mastering: { label: "Mastering", className: "bg-purple-100 text-purple-700 border-purple-200" },
      completed: { label: "Termine", className: "bg-green-100 text-green-700 border-green-200" },
      delivered: { label: "Livre", className: "bg-green-100 text-green-700 border-green-200" },
      archived: { label: "Archive", className: "bg-gray-100 text-gray-500 border-gray-200" },
    };

    const statusConfig = config[status] || config.archived;
    return <Badge variant="outline" className={statusConfig.className}>{statusConfig.label}</Badge>;
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

        {/* Stats */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total projets</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Tous statuts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>En cours</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{stats.inProgress}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {stats.inProgress === 1 ? "projet" : "projets"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Termines</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {stats.completed === 1 ? "projet" : "projets"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projects List */}
        <div>
          <div className="pb-2">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre ou artiste..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-40 h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pre_production">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      Pre-production
                    </span>
                  </SelectItem>
                  <SelectItem value="recording">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Enregistrement
                    </span>
                  </SelectItem>
                  <SelectItem value="editing">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Edition
                    </span>
                  </SelectItem>
                  <SelectItem value="mixing">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      Mixage
                    </span>
                  </SelectItem>
                  <SelectItem value="mastering">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      Mastering
                    </span>
                  </SelectItem>
                  <SelectItem value="completed">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Termine
                    </span>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Livre
                    </span>
                  </SelectItem>
                  <SelectItem value="archived">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      Archive
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projet</TableHead>
                      <TableHead>Artiste</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date debut</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project: any) => (
                      <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.artistName || "-"}</TableCell>
                        <TableCell>{project.genre || "-"}</TableCell>
                        <TableCell>
                          {project.type === "album" && "Album"}
                          {project.type === "ep" && "EP"}
                          {project.type === "single" && "Single"}
                          {project.type === "demo" && "Demo"}
                          {project.type === "soundtrack" && "Bande originale"}
                          {project.type === "podcast" && "Podcast"}
                        </TableCell>
                        <TableCell>
                          {project.startDate
                            ? format(new Date(project.startDate), "dd MMM yyyy", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(project.status as ProjectStatus)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/projects/${project.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <Music className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">Aucun projet</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Commencez par créer votre premier projet
                </p>
                <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Projet
                </Button>
              </div>
            )}
          </div>
        </div>
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

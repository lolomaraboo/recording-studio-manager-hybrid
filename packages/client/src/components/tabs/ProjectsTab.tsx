import { useState, useEffect } from "react";
import { useNavigate } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutGrid,
  List,
  Table2,
  Trello,
  FolderOpen,
  Music,
  Clock,
  Euro,
} from "lucide-react";

interface ProjectsTabProps {
  clientId: number;
}

type ViewMode = "cards" | "liste" | "table" | "kanban";

const STATUS_LABELS = {
  pre_production: "Planifié",
  recording: "En cours",
  editing: "Editing",
  mixing: "Mixing",
  mastering: "Mastering",
  completed: "Livré",
  delivered: "Livré",
  archived: "Archivé",
} as const;

const STATUS_COLORS = {
  pre_production: "bg-gray-500",
  recording: "bg-blue-500",
  editing: "bg-yellow-500",
  mixing: "bg-orange-500",
  mastering: "bg-purple-500",
  completed: "bg-green-500",
  delivered: "bg-green-500",
  archived: "bg-gray-400",
} as const;

export function ProjectsTab({ clientId }: ProjectsTabProps) {
  const navigate = useNavigate();

  // Load view mode from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("projects-view-mode");
    return (stored as ViewMode) || "cards";
  });

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem("projects-view-mode", viewMode);
  }, [viewMode]);

  // Fetch projects with stats
  const { data: projects, isLoading } = trpc.clients.getProjects.useQuery({ clientId });

  const formatBudget = (budget: string | null, spent: string | null) => {
    if (!budget && !spent) return null;
    const budgetNum = parseFloat(budget || "0");
    const spentNum = parseFloat(spent || "0");
    return `${spentNum}€ / ${budgetNum}€`;
  };

  // Empty state
  if (!isLoading && (!projects || projects.length === 0)) {
    return (
      <div className="py-12 text-center">
        <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Aucun projet pour ce client</p>
        <p className="text-sm text-muted-foreground mb-6">
          Créez un projet pour commencer à enregistrer des sessions.
        </p>
        <Button onClick={() => navigate(`/projects/new?clientId=${clientId}`)}>
          Créer un projet
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "cards" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("cards")}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Cards
        </Button>
        <Button
          variant={viewMode === "liste" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("liste")}
        >
          <List className="h-4 w-4 mr-2" />
          Liste
        </Button>
        <Button
          variant={viewMode === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("table")}
        >
          <Table2 className="h-4 w-4 mr-2" />
          Table
        </Button>
        <Button
          variant={viewMode === "kanban" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("kanban")}
        >
          <Trello className="h-4 w-4 mr-2" />
          Kanban
        </Button>
      </div>

      {/* Cards Mode (Default) */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge className={STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]}>
                    {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <span>{project.tracksCount} tracks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{project.hoursRecorded}h enregistrées</span>
                  </div>
                  {formatBudget(project.budget, project.totalCost) && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      <span>{formatBudget(project.budget, project.totalCost)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Liste Mode */}
      {viewMode === "liste" && (
        <div className="space-y-2">
          {projects?.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="font-medium">{project.name}</span>
                <Badge className={STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]}>
                  {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {project.createdAt
                    ? new Date(project.createdAt).toLocaleDateString("fr-FR")
                    : "-"}
                </span>
                <Button variant="ghost" size="sm">
                  Voir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === "table" && (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Titre</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-left p-3 font-medium">Tracks</th>
                <th className="text-left p-3 font-medium">Sessions</th>
                <th className="text-left p-3 font-medium">Budget</th>
                <th className="text-left p-3 font-medium">Genre</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects?.map((project) => (
                <tr
                  key={project.id}
                  className="border-t hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="p-3 font-medium">{project.name}</td>
                  <td className="p-3">
                    <Badge className={STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]}>
                      {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                  </td>
                  <td className="p-3">{project.tracksCount}</td>
                  <td className="p-3">{project.hoursRecorded}h</td>
                  <td className="p-3">{formatBudget(project.budget, project.totalCost) || "-"}</td>
                  <td className="p-3">{project.genre || "-"}</td>
                  <td className="p-3">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString("fr-FR")
                      : "-"}
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm">
                      Voir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban Mode */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Planifié Column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">
              Planifié
            </h3>
            {projects
              ?.filter((p) => p.status === "pre_production")
              .map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{project.name}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{project.tracksCount} tracks</div>
                      <div>{project.hoursRecorded}h</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* En cours Column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">
              En cours
            </h3>
            {projects
              ?.filter((p) => p.status === "recording" || p.status === "editing")
              .map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{project.name}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{project.tracksCount} tracks</div>
                      <div>{project.hoursRecorded}h</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Mixing Column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">
              Mixing
            </h3>
            {projects
              ?.filter((p) => p.status === "mixing")
              .map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{project.name}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{project.tracksCount} tracks</div>
                      <div>{project.hoursRecorded}h</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Mastering Column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">
              Mastering
            </h3>
            {projects
              ?.filter((p) => p.status === "mastering")
              .map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{project.name}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{project.tracksCount} tracks</div>
                      <div>{project.hoursRecorded}h</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Livré Column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">
              Livré
            </h3>
            {projects
              ?.filter((p) => p.status === "completed" || p.status === "delivered")
              .map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{project.name}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{project.tracksCount} tracks</div>
                      <div>{project.hoursRecorded}h</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

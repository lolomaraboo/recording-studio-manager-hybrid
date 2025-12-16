/**
 * Page Tracks - Vue Globale
 *
 * Affiche TOUTES les tracks de TOUS les projets avec:
 * - Stats globales (total, par status)
 * - Filtres (projet, status, recherche)
 * - Table avec colonne projet
 * - CRUD complet
 *
 * NOTE: Nécessite endpoints tRPC:
 * - projects.tracks.listAll
 * - projects.tracks.getStats
 * (cf. TRACKS_ARCHITECTURE.md lignes 266-320)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Music, Plus, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";

type TrackStatus = "recording" | "editing" | "mixing" | "mastering" | "completed";

export default function Tracks() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Implémenter ces endpoints dans le backend
  // const { data: allTracks } = trpc.projects.tracks.listAll.useQuery();
  // const { data: stats } = trpc.projects.tracks.getStats.useQuery();

  // Fallback: Liste des projets pour le dropdown
  const { data: projects } = trpc.projects.list.useQuery();

  // Données mock pour démonstration
  const allTracks: any[] = [];
  const stats = {
    total: 0,
    recording: 0,
    editing: 0,
    mixing: 0,
    mastering: 0,
    completed: 0,
  };

  // Filtrage client-side
  const filteredTracks = allTracks?.filter((track) => {
    const matchesProject = projectFilter === "all" || track.projectId.toString() === projectFilter;
    const matchesStatus = statusFilter === "all" || track.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: TrackStatus) => {
    const variants: Record<TrackStatus, "default" | "secondary" | "outline"> = {
      recording: "outline",
      editing: "secondary",
      mixing: "default",
      mastering: "secondary",
      completed: "default",
    };
    const labels: Record<TrackStatus, string> = {
      recording: "Recording",
      editing: "Editing",
      mixing: "Mixing",
      mastering: "Mastering",
      completed: "Completed",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Tracks</h1>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Track
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Globales */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tracks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Recording
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recording}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">
                Mixing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mixing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">
                Mastering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mastering}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-64">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrer par projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les status</SelectItem>
                  <SelectItem value="recording">Recording</SelectItem>
                  <SelectItem value="editing">Editing</SelectItem>
                  <SelectItem value="mixing">Mixing</SelectItem>
                  <SelectItem value="mastering">Mastering</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un titre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Tracks */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Tracks</CardTitle>
            <CardDescription>
              {filteredTracks?.length || 0} track(s) affichée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!allTracks || allTracks.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Music className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <p className="font-semibold mb-1">Endpoints tRPC manquants</p>
                  <p className="text-sm text-muted-foreground">
                    Implémenter <code>projects.tracks.listAll</code> et{" "}
                    <code>projects.tracks.getStats</code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    (cf. TRACKS_ARCHITECTURE.md lignes 266-320)
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead>#</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>BPM</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTracks?.map((track: any) => (
                    <TableRow key={track.id}>
                      <TableCell>
                        <Link
                          to={`/projects/${track.projectId}`}
                          className="text-primary hover:underline"
                        >
                          {track.project?.title}
                        </Link>
                      </TableCell>
                      <TableCell>{track.trackNumber}</TableCell>
                      <TableCell className="font-medium">{track.title}</TableCell>
                      <TableCell>{track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : "—"}</TableCell>
                      <TableCell>{getStatusBadge(track.status)}</TableCell>
                      <TableCell>{track.bpm || "—"}</TableCell>
                      <TableCell>{track.key || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

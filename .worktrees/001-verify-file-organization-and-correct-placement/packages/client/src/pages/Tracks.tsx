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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Music, Plus, Search, Filter, ArrowLeft } from "lucide-react";

type TrackStatus = "recording" | "editing" | "mixing" | "mastering" | "completed";

export default function Tracks() {
  const utils = trpc.useUtils();

  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTrack, setNewTrack] = useState({
    projectId: "",
    title: "",
    trackNumber: "",
    status: "recording" as TrackStatus,
    duration: "",
    bpm: "",
    key: "",
    isrc: "",
    lyrics: "",
    notes: "",
  });

  // Queries tRPC (endpoints implémentés!)
  const { data: allTracks } = trpc.projects.tracks.listAll.useQuery({});
  const { data: statsData } = trpc.projects.tracks.getStats.useQuery();

  // Liste des projets pour le dropdown
  const { data: projects } = trpc.projects.list.useQuery();

  // Create mutation
  const createTrackMutation = trpc.projects.tracks.create.useMutation({
    onSuccess: () => {
      utils.projects.tracks.listAll.invalidate();
      utils.projects.tracks.getStats.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setNewTrack({
      projectId: "",
      title: "",
      trackNumber: "",
      status: "recording",
      duration: "",
      bpm: "",
      key: "",
      isrc: "",
      lyrics: "",
      notes: "",
    });
  };

  const handleCreateTrack = () => {
    const payload: any = {
      projectId: parseInt(newTrack.projectId),
      title: newTrack.title,
      status: newTrack.status,
    };

    if (newTrack.trackNumber) payload.trackNumber = parseInt(newTrack.trackNumber);
    if (newTrack.duration) payload.duration = parseInt(newTrack.duration);
    if (newTrack.bpm) payload.bpm = parseInt(newTrack.bpm);
    if (newTrack.key) payload.key = newTrack.key;
    if (newTrack.isrc) payload.isrc = newTrack.isrc;
    if (newTrack.lyrics) payload.lyrics = newTrack.lyrics;
    if (newTrack.notes) payload.notes = newTrack.notes;

    createTrackMutation.mutate(payload);
  };

  // Stats avec valeurs par défaut
  const stats = statsData || {
    total: 0,
    byStatus: {
      recording: 0,
      editing: 0,
      mixing: 0,
      mastering: 0,
      completed: 0,
    },
    totalDuration: 0,
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Tracks</h1>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
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
              <div className="text-2xl font-bold">{stats.byStatus.recording}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">
                Mixing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.mixing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">
                Mastering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.mastering}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.completed}</div>
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
                  <p className="font-semibold mb-1">Aucune track enregistrée</p>
                  <p className="text-sm text-muted-foreground">
                    Créez votre première track pour commencer
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

      {/* Create Track Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Track</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle track à un projet
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Projet (required) */}
            <div className="grid gap-2">
              <Label htmlFor="projectId">Projet *</Label>
              <Select
                value={newTrack.projectId}
                onValueChange={(value) =>
                  setNewTrack({ ...newTrack, projectId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title (required) */}
            <div className="grid gap-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={newTrack.title}
                onChange={(e) =>
                  setNewTrack({ ...newTrack, title: e.target.value })
                }
                placeholder="ex: Intro, Verse 1, Chorus..."
              />
            </div>

            {/* Track Number & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="trackNumber">Numéro de track</Label>
                <Input
                  id="trackNumber"
                  type="number"
                  value={newTrack.trackNumber}
                  onChange={(e) =>
                    setNewTrack({ ...newTrack, trackNumber: e.target.value })
                  }
                  placeholder="1"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newTrack.status}
                  onValueChange={(value) =>
                    setNewTrack({ ...newTrack, status: value as TrackStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recording">Recording</SelectItem>
                    <SelectItem value="editing">Editing</SelectItem>
                    <SelectItem value="mixing">Mixing</SelectItem>
                    <SelectItem value="mastering">Mastering</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration, BPM, Key */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Durée (secondes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newTrack.duration}
                  onChange={(e) =>
                    setNewTrack({ ...newTrack, duration: e.target.value })
                  }
                  placeholder="180"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bpm">BPM</Label>
                <Input
                  id="bpm"
                  type="number"
                  value={newTrack.bpm}
                  onChange={(e) =>
                    setNewTrack({ ...newTrack, bpm: e.target.value })
                  }
                  placeholder="120"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="key">Tonalité</Label>
                <Input
                  id="key"
                  value={newTrack.key}
                  onChange={(e) =>
                    setNewTrack({ ...newTrack, key: e.target.value })
                  }
                  placeholder="C Major"
                />
              </div>
            </div>

            {/* ISRC */}
            <div className="grid gap-2">
              <Label htmlFor="isrc">ISRC</Label>
              <Input
                id="isrc"
                value={newTrack.isrc}
                onChange={(e) =>
                  setNewTrack({ ...newTrack, isrc: e.target.value })
                }
                placeholder="ex: USRC17607839"
              />
            </div>

            {/* Lyrics */}
            <div className="grid gap-2">
              <Label htmlFor="lyrics">Paroles</Label>
              <Textarea
                id="lyrics"
                value={newTrack.lyrics}
                onChange={(e) =>
                  setNewTrack({ ...newTrack, lyrics: e.target.value })
                }
                placeholder="Paroles de la chanson..."
                rows={4}
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newTrack.notes}
                onChange={(e) =>
                  setNewTrack({ ...newTrack, notes: e.target.value })
                }
                placeholder="Notes techniques, idées..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateTrack}
              disabled={!newTrack.projectId || !newTrack.title || createTrackMutation.isPending}
            >
              {createTrackMutation.isPending ? "Création..." : "Créer la track"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

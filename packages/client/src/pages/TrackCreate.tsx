import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function TrackCreate() {
  const navigate = useNavigate();

  // Fetch projects
  const { data: projects } = trpc.projects.list.useQuery();

  // Create mutation
  const createMutation = trpc.projects.tracks.create.useMutation({
    onSuccess: (data) => {
      toast.success("Piste créée avec succès");
      navigate(`/tracks/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    projectId: 0,
    title: "",
    trackNumber: "",
    duration: "",
    isrc: "",
    status: "recording" as const,
    bpm: "",
    key: "",
    lyrics: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.projectId) {
      toast.error("Le projet est requis");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    // Submit
    createMutation.mutate({
      projectId: formData.projectId,
      title: formData.title,
      trackNumber: formData.trackNumber ? Number(formData.trackNumber) : undefined,
      duration: formData.duration ? Number(formData.duration) : undefined,
      isrc: formData.isrc || undefined,
      status: formData.status,
      bpm: formData.bpm ? Number(formData.bpm) : undefined,
      key: formData.key || undefined,
      lyrics: formData.lyrics || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/tracks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Nouvelle Piste</h1>
            <p className="text-muted-foreground">Ajouter une piste à un projet</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
                <CardDescription>Détails de la piste audio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project & Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectId">
                      Projet <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.projectId.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, projectId: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Titre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titre de la piste"
                      required
                    />
                  </div>
                </div>

                {/* Track Number & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trackNumber">N° Piste</Label>
                    <Input
                      id="trackNumber"
                      type="number"
                      min="1"
                      value={formData.trackNumber}
                      onChange={(e) => setFormData({ ...formData, trackNumber: e.target.value })}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: typeof formData.status) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recording">Enregistrement</SelectItem>
                        <SelectItem value="editing">Édition</SelectItem>
                        <SelectItem value="mixing">Mixage</SelectItem>
                        <SelectItem value="mastering">Mastering</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Duration & ISRC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée (secondes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="0"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="240"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isrc">
                      ISRC
                      <span className="text-xs text-muted-foreground ml-2">
                        (International Standard Recording Code)
                      </span>
                    </Label>
                    <Input
                      id="isrc"
                      value={formData.isrc}
                      onChange={(e) => setFormData({ ...formData, isrc: e.target.value })}
                      placeholder="USRC17607839"
                      maxLength={50}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Musical Details */}
            <Card>
              <CardHeader>
                <CardTitle>Détails musicaux</CardTitle>
                <CardDescription>Informations techniques et artistiques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* BPM & Key */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bpm">BPM</Label>
                    <Input
                      id="bpm"
                      type="number"
                      min="0"
                      max="300"
                      value={formData.bpm}
                      onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                      placeholder="120"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key">Tonalité</Label>
                    <Input
                      id="key"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      placeholder="C Major, Am, etc."
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* Lyrics */}
                <div className="space-y-2">
                  <Label htmlFor="lyrics">Paroles</Label>
                  <Textarea
                    id="lyrics"
                    value={formData.lyrics}
                    onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                    rows={6}
                    placeholder="Paroles de la chanson..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Notes générales et techniques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* General Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes générales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Notes, idées, références..."
                  />
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? "Création..." : "Créer la piste"}
                </Button>

                <Link to="/tracks" className="block">
                  <Button type="button" variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>Aide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Projet :</strong> Sélectionnez le projet
                  auquel appartient cette piste.
                </p>
                <p>
                  <strong className="text-foreground">ISRC :</strong> Code international
                  d'identification des enregistrements sonores.
                </p>
                <p>
                  <strong className="text-foreground">Tonalité :</strong> Exemples : C Major, D
                  Minor, F# Minor, etc.
                </p>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Les champs marqués d'un <span className="text-red-500">*</span> sont
                  obligatoires.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

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
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Music, Edit, Trash2, Save, X, Clock, Hash, Download, FileAudio, Copyright, Wrench } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { FileUploadButton } from "@/components/FileUploadButton";
import { AudioPlayer } from "@/components/AudioPlayer";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import { TrackComments } from "@/components/TrackComments";
import type { CommentMarker } from "@/components/WaveformPlayer";

const statusLabels: Record<string, { label: string; variant: any }> = {
  recording: { label: "Enregistrement", variant: "outline" },
  editing: { label: "Édition", variant: "secondary" },
  mixing: { label: "Mixage", variant: "default" },
  mastering: { label: "Mastering", variant: "secondary" },
  completed: { label: "Terminée", variant: "default" },
};

export default function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Comments state
  const [selectedVersion, setSelectedVersion] = useState<'demo' | 'roughMix' | 'finalMix' | 'master'>('master');
  const [newCommentTimestamp, setNewCommentTimestamp] = useState<number | null>(null);
  const [waveformPlayerRef, setWaveformPlayerRef] = useState<any>(null);

  // Fetch track data
  const { data: track, isLoading, refetch } = trpc.projects.tracks.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch project data for the track
  const { data: project } = trpc.projects.get.useQuery(
    { id: track?.projectId || 0 },
    { enabled: !!track?.projectId }
  );

  // Mutation for updating version URL after upload
  const updateVersionUrlMutation = trpc.projects.tracks.updateVersionUrl.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutations
  const updateMutation = trpc.projects.tracks.update.useMutation({
    onSuccess: () => {
      toast.success("Piste mise à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.projects.tracks.delete.useMutation({
    onSuccess: () => {
      toast.success("Piste supprimée");
      navigate("/tracks");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    trackNumber: 1,
    duration: 0,
    status: "recording" as "recording" | "editing" | "mixing" | "mastering" | "completed",
    bpm: undefined as number | undefined,
    key: "",
    lyrics: "",
    notes: "",
  });

  // Update form when track loads
  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title,
        trackNumber: track.trackNumber || 1,
        duration: track.duration || 0,
        status: track.status as "recording" | "editing" | "mixing" | "mastering" | "completed",
        bpm: track.bpm || undefined,
        key: track.key || "",
        lyrics: track.lyrics || "",
        notes: track.notes || "",
      });
    }
  }, [track]);

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      ...formData,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

  if (!track) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/tracks">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Piste introuvable</h1>
          </div>
        </header>
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Cette piste n'existe pas ou a été supprimée.</p>
              <Button className="mt-4" asChild>
                <Link to="/tracks">Retour aux pistes</Link>
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
              <Link to="/tracks">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{track.title}</h1>
              <p className="text-sm text-muted-foreground">
                Piste #{track.trackNumber} • Track ID #{track.id}
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
            {/* Track Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de la piste</CardTitle>
                <CardDescription>Détails et métadonnées de la piste</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trackNumber">Numéro de piste</Label>
                        <Input
                          id="trackNumber"
                          type="number"
                          min="1"
                          value={formData.trackNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, trackNumber: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Durée (secondes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="0"
                          value={formData.duration}
                          onChange={(e) =>
                            setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bpm">BPM</Label>
                        <Input
                          id="bpm"
                          type="number"
                          min="1"
                          max="300"
                          value={formData.bpm || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bpm: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="key">Tonalité</Label>
                        <Input
                          id="key"
                          value={formData.key}
                          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                          placeholder="C, Am, F#..."
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Numéro de piste</p>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          <span className="text-lg font-semibold">{track.trackNumber}</span>
                        </div>
                      </div>

                      {track.duration && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Durée</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="text-lg font-semibold">{formatDuration(track.duration)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(track.bpm || track.key) && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {track.bpm && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">BPM</p>
                            <div className="flex items-center gap-2">
                              <Music className="h-4 w-4" />
                              <span className="text-sm">{track.bpm}</span>
                            </div>
                          </div>
                        )}

                        {track.key && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Tonalité</p>
                            <div className="flex items-center gap-2">
                              <Music className="h-4 w-4" />
                              <span className="text-sm">{track.key}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {track.isrc && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">ISRC</p>
                        <p className="text-sm font-mono">{track.isrc}</p>
                      </div>
                    )}

                    {/* Featured Audio Player - Show latest version */}
                    {!isEditing && (track.masterUrl || track.finalMixUrl || track.roughMixUrl || track.demoUrl) && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-3">
                          Écouter: {track.masterUrl ? 'Master' : track.finalMixUrl ? 'Final Mix' : track.roughMixUrl ? 'Rough Mix' : 'Demo'}
                        </p>
                        <AudioPlayer
                          src={track.masterUrl || track.finalMixUrl || track.roughMixUrl || track.demoUrl || ''}
                          title={track.title}
                          showTime
                          showVolume
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lyrics Card */}
            {(track.lyrics || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle>Paroles</CardTitle>
                  <CardDescription>Texte de la chanson</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.lyrics}
                      onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                      rows={12}
                      placeholder="Paroles de la chanson..."
                      className="font-mono text-sm"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap font-mono">
                      {track.lyrics || "Aucune parole"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes Card */}
            {(track.notes || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Notes de production et commentaires</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={6}
                      placeholder="Notes sur la piste..."
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{track.notes || "Aucune note"}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Versioning Card - Phase 5 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5" />
                  <CardTitle>Versioning</CardTitle>
                </div>
                <CardDescription>Différentes versions de la piste durant la production</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Demo */}
                <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Demo</p>
                      <p className="text-xs text-muted-foreground">Version démo initiale</p>
                    </div>
                    <div className="flex gap-2">
                      {track.demoUrl ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={track.demoUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </a>
                        </Button>
                      ) : null}
                      <FileUploadButton
                        versionType="demo"
                        trackId={track.id}
                        currentUrl={track.demoUrl || undefined}
                        onUploadSuccess={(url) => {
                          updateVersionUrlMutation.mutate({
                            id: track.id,
                            versionType: "demo",
                            url,
                          });
                          toast.success("Demo uploadé !");
                        }}
                        onUploadError={(error) => toast.error(error)}
                      />
                    </div>
                  </div>
                  {track.demoUrl && (
                    <AudioPlayer src={track.demoUrl} compact showTime={false} showVolume={false} />
                  )}
                </div>

                {/* Rough Mix */}
                <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Rough Mix</p>
                      <p className="text-xs text-muted-foreground">Mixage brut</p>
                    </div>
                    <div className="flex gap-2">
                      {track.roughMixUrl ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={track.roughMixUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </a>
                        </Button>
                      ) : null}
                      <FileUploadButton
                        versionType="roughMix"
                        trackId={track.id}
                        currentUrl={track.roughMixUrl || undefined}
                        onUploadSuccess={(url) => {
                          updateVersionUrlMutation.mutate({
                            id: track.id,
                            versionType: "roughMix",
                            url,
                          });
                          toast.success("Rough Mix uploadé !");
                        }}
                        onUploadError={(error) => toast.error(error)}
                      />
                    </div>
                  </div>
                  {track.roughMixUrl && (
                    <AudioPlayer src={track.roughMixUrl} compact showTime={false} showVolume={false} />
                  )}
                </div>

                {/* Final Mix */}
                <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Final Mix</p>
                      <p className="text-xs text-muted-foreground">Mixage final</p>
                    </div>
                    <div className="flex gap-2">
                      {track.finalMixUrl ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={track.finalMixUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </a>
                        </Button>
                      ) : null}
                      <FileUploadButton
                        versionType="finalMix"
                        trackId={track.id}
                        currentUrl={track.finalMixUrl || undefined}
                        onUploadSuccess={(url) => {
                          updateVersionUrlMutation.mutate({
                            id: track.id,
                            versionType: "finalMix",
                            url,
                          });
                          toast.success("Final Mix uploadé !");
                        }}
                        onUploadError={(error) => toast.error(error)}
                      />
                    </div>
                  </div>
                  {track.finalMixUrl && (
                    <AudioPlayer src={track.finalMixUrl} compact showTime={false} showVolume={false} />
                  )}
                </div>

                {/* Master */}
                <div className="space-y-2 p-3 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Master</p>
                      <p className="text-xs text-green-700 dark:text-green-300">Version masterisée finale</p>
                    </div>
                    <div className="flex gap-2">
                      {track.masterUrl ? (
                        <Button size="sm" variant="outline" className="border-green-300 dark:border-green-800" asChild>
                          <a href={track.masterUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </a>
                        </Button>
                      ) : null}
                      <FileUploadButton
                        versionType="master"
                        trackId={track.id}
                        currentUrl={track.masterUrl || undefined}
                        onUploadSuccess={(url) => {
                          updateVersionUrlMutation.mutate({
                            id: track.id,
                            versionType: "master",
                            url,
                          });
                          toast.success("Master uploadé !");
                        }}
                        onUploadError={(error) => toast.error(error)}
                      />
                    </div>
                  </div>
                  {track.masterUrl && (
                    <AudioPlayer src={track.masterUrl} compact showTime={false} showVolume={false} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Copyright Metadata Card - Phase 5 */}
            {(track.composer || track.lyricist || track.copyrightHolder || track.copyrightYear || track.genreTags || track.mood || track.language || track.explicitContent) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Copyright className="h-5 w-5" />
                    <CardTitle>Copyright & Métadonnées</CardTitle>
                  </div>
                  <CardDescription>Informations pour la distribution et gestion des droits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {track.composer && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Compositeur</p>
                        <p className="text-sm font-medium">{track.composer}</p>
                      </div>
                    )}

                    {track.lyricist && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Parolier</p>
                        <p className="text-sm font-medium">{track.lyricist}</p>
                      </div>
                    )}

                    {track.copyrightHolder && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Détenteur des droits</p>
                        <p className="text-sm font-medium">{track.copyrightHolder}</p>
                      </div>
                    )}

                    {track.copyrightYear && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Année copyright</p>
                        <p className="text-sm font-medium">© {track.copyrightYear}</p>
                      </div>
                    )}
                  </div>

                  {track.genreTags && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Genres</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const genres = JSON.parse(track.genreTags);
                            return genres.map((genre: string, i: number) => (
                              <Badge key={i} variant="secondary">{genre}</Badge>
                            ));
                          } catch {
                            return <span className="text-sm">{track.genreTags}</span>;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {track.mood && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Ambiance</p>
                        <Badge variant="outline">{track.mood}</Badge>
                      </div>
                    )}

                    {track.language && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Langue</p>
                        <Badge variant="outline">{track.language.toUpperCase()}</Badge>
                      </div>
                    )}
                  </div>

                  {track.explicitContent && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
                      <Badge variant="destructive">Explicit</Badge>
                      <p className="text-xs text-red-700 dark:text-red-300">Contenu explicite</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Technical Details Card - Phase 5 */}
            {(track.patchPreset || track.instrumentsUsed || track.microphonesUsed || track.effectsChain || track.dawSessionPath) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    <CardTitle>Détails Techniques</CardTitle>
                  </div>
                  <CardDescription>Informations de production pour référence studio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {track.instrumentsUsed && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Instruments utilisés</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const instruments = JSON.parse(track.instrumentsUsed);
                            return instruments.map((instrument: string, i: number) => (
                              <Badge key={i} variant="outline">{instrument}</Badge>
                            ));
                          } catch {
                            return <span className="text-sm">{track.instrumentsUsed}</span>;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {track.microphonesUsed && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Microphones utilisés</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const microphones = JSON.parse(track.microphonesUsed);
                            return microphones.map((mic: string, i: number) => (
                              <Badge key={i} variant="outline">{mic}</Badge>
                            ));
                          } catch {
                            return <span className="text-sm">{track.microphonesUsed}</span>;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {track.patchPreset && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Patch/Preset</p>
                      <div className="p-3 bg-muted rounded-md">
                        <pre className="text-xs overflow-x-auto">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(track.patchPreset), null, 2);
                            } catch {
                              return track.patchPreset;
                            }
                          })()}
                        </pre>
                      </div>
                    </div>
                  )}

                  {track.effectsChain && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Chaîne d'effets</p>
                      <div className="p-3 bg-muted rounded-md">
                        <pre className="text-xs overflow-x-auto">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(track.effectsChain), null, 2);
                            } catch {
                              return track.effectsChain;
                            }
                          })()}
                        </pre>
                      </div>
                    </div>
                  )}

                  {track.dawSessionPath && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Session DAW</p>
                      <p className="text-xs font-mono bg-muted p-2 rounded-md break-all">{track.dawSessionPath}</p>
                    </div>
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
              <CardContent>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut de la piste</Label>
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
                  <Badge variant={statusLabels[track.status].variant}>
                    {statusLabels[track.status].label}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Project Info */}
            {project && (
              <Card>
                <CardHeader>
                  <CardTitle>Projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                    {project.artistName && (
                      <p className="text-sm text-muted-foreground">{project.artistName}</p>
                    )}
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
                  <p className="text-sm font-medium">#{track.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Créée le</p>
                  <p className="text-sm">
                    {format(new Date(track.createdAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mise à jour</p>
                  <p className="text-sm">
                    {format(new Date(track.updatedAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Waveform & Comments */}
            {(track.demoUrl || track.roughMixUrl || track.finalMixUrl || track.masterUrl) && (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Waveform & Commentaires</CardTitle>
                  <CardDescription>
                    Écoutez et commentez à des moments précis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Version selector */}
                  <div className="flex items-center gap-2">
                    <Label>Version:</Label>
                    <div className="flex gap-2">
                      {track.demoUrl && (
                        <Button
                          size="sm"
                          variant={selectedVersion === 'demo' ? 'default' : 'outline'}
                          onClick={() => setSelectedVersion('demo')}
                        >
                          Demo
                        </Button>
                      )}
                      {track.roughMixUrl && (
                        <Button
                          size="sm"
                          variant={selectedVersion === 'roughMix' ? 'default' : 'outline'}
                          onClick={() => setSelectedVersion('roughMix')}
                        >
                          Rough Mix
                        </Button>
                      )}
                      {track.finalMixUrl && (
                        <Button
                          size="sm"
                          variant={selectedVersion === 'finalMix' ? 'default' : 'outline'}
                          onClick={() => setSelectedVersion('finalMix')}
                        >
                          Final Mix
                        </Button>
                      )}
                      {track.masterUrl && (
                        <Button
                          size="sm"
                          variant={selectedVersion === 'master' ? 'default' : 'outline'}
                          onClick={() => setSelectedVersion('master')}
                        >
                          Master
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Waveform Player */}
                  {(() => {
                    const versionUrls = {
                      demo: track.demoUrl,
                      roughMix: track.roughMixUrl,
                      finalMix: track.finalMixUrl,
                      master: track.masterUrl,
                    };
                    const currentUrl = versionUrls[selectedVersion];

                    if (!currentUrl) return null;

                    return (
                      <WaveformPlayer
                        src={currentUrl}
                        title={`${track.title} - ${selectedVersion}`}
                        onAddCommentAtTime={setNewCommentTimestamp}
                        showComments
                      />
                    );
                  })()}

                  {/* Comments section */}
                  <TrackComments
                    trackId={track.id}
                    versionType={selectedVersion}
                    newCommentTimestamp={newCommentTimestamp}
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/tracks">Retour aux pistes</Link>
                </Button>
                {project && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/projects/${project.id}`}>Voir le projet</Link>
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
            <DialogTitle>Supprimer la piste</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette piste ? Cette action est irréversible.
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

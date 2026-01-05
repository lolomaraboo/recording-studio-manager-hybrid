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
import {
  ArrowLeft,
  Music,
  Edit,
  Trash2,
  Save,
  X,
  Mail,
  Phone,
  Globe,
  User,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { TALENT_TYPE_LABELS, type TalentType } from "@rsm/shared";

export default function TalentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch talent data
  const { data: talent, isLoading, refetch } = trpc.musicians.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Mutations
  const updateMutation = trpc.musicians.update.useMutation({
    onSuccess: () => {
      toast.success("Talent mis à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.musicians.delete.useMutation({
    onSuccess: () => {
      toast.success("Talent supprimé");
      navigate("/talents");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    stageName: "",
    email: "",
    phone: "",
    bio: "",
    talentType: "musician" as TalentType,
    website: "",
    spotifyUrl: "",
    instruments: "",
    genres: "",
    notes: "",
  });

  // Update form when talent loads
  useEffect(() => {
    if (talent) {
      setFormData({
        name: talent.name,
        stageName: talent.stageName || "",
        email: talent.email || "",
        phone: talent.phone || "",
        bio: talent.bio || "",
        talentType: talent.talentType,
        website: talent.website || "",
        spotifyUrl: talent.spotifyUrl || "",
        instruments: talent.instruments || "",
        genres: talent.genres || "",
        notes: talent.notes || "",
      });
    }
  }, [talent]);

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      ...formData,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  // Parse JSON arrays for display
  const parseJsonArray = (jsonString: string | null) => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/talents">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Music className="h-8 w-8 text-primary" />
              Talent introuvable
            </h2>
          </div>
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Ce talent n'existe pas ou a été supprimé.</p>
              <Button size="sm" asChild>
                <Link to="/talents">Retour aux talents</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const instruments = parseJsonArray(talent.instruments);
  const genres = parseJsonArray(talent.genres);

  return (
    <>
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/talents">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Music className="h-8 w-8 text-primary" />
              {talent.stageName || talent.name}
            </h2>
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
            {/* Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profil</CardTitle>
                <CardDescription className="text-sm">Informations personnelles et artistiques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stageName">Nom de scène</Label>
                        <Input
                          id="stageName"
                          value={formData.stageName}
                          onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="talentType">Type</Label>
                      <Select
                        value={formData.talentType}
                        onValueChange={(value: any) => setFormData({ ...formData, talentType: value })}
                      >
                        <SelectTrigger id="talentType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="musician">{TALENT_TYPE_LABELS.musician}</SelectItem>
                          <SelectItem value="actor">{TALENT_TYPE_LABELS.actor}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Biographie</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        placeholder="Biographie de l'artiste..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Type</p>
                      <Badge variant="outline">{TALENT_TYPE_LABELS[talent.talentType]}</Badge>
                    </div>

                    {(talent.email || talent.phone) && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {talent.email && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Email</p>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${talent.email}`} className="text-sm hover:underline">
                                {talent.email}
                              </a>
                            </div>
                          </div>
                        )}

                        {talent.phone && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Téléphone</p>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${talent.phone}`} className="text-sm hover:underline">
                                {talent.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {talent.bio && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Biographie</p>
                        <p className="text-sm whitespace-pre-wrap">{talent.bio}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Skills Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compétences</CardTitle>
                <CardDescription className="text-sm">Instruments et genres musicaux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="instruments">Instruments (séparés par des virgules)</Label>
                      <Input
                        id="instruments"
                        value={formData.instruments}
                        onChange={(e) => setFormData({ ...formData, instruments: e.target.value })}
                        placeholder="Guitare, Piano, Batterie..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="genres">Genres (séparés par des virgules)</Label>
                      <Input
                        id="genres"
                        value={formData.genres}
                        onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                        placeholder="Rock, Jazz, Blues..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {instruments.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Instruments</p>
                        <div className="flex flex-wrap gap-2">
                          {instruments.map((instrument: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              <Music className="mr-1 h-3 w-3" />
                              {instrument}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {genres.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Genres</p>
                        <div className="flex flex-wrap gap-2">
                          {genres.map((genre: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {instruments.length === 0 && genres.length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucune compétence renseignée</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Links Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Liens</CardTitle>
                <CardDescription className="text-sm">Site web et réseaux sociaux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="website">Site web</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotifyUrl">Spotify</Label>
                      <Input
                        id="spotifyUrl"
                        type="url"
                        value={formData.spotifyUrl}
                        onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                        placeholder="https://open.spotify.com/artist/..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {talent.website && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Site web</p>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <a
                            href={talent.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline flex items-center gap-1"
                          >
                            {talent.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {talent.spotifyUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Spotify</p>
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          <a
                            href={talent.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline flex items-center gap-1"
                          >
                            Profil Spotify
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {!talent.website && !talent.spotifyUrl && (
                      <p className="text-sm text-muted-foreground">Aucun lien renseigné</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            {(talent.notes || isEditing) && (
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
                      placeholder="Notes internes..."
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {talent.notes || "Aucune note"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Meta Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID</p>
                  <p className="text-sm font-medium">#{talent.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Créé le</p>
                  <p className="text-sm">
                    {format(new Date(talent.createdAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mis à jour</p>
                  <p className="text-sm">
                    {format(new Date(talent.updatedAt), "dd MMM yyyy", { locale: fr })}
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
                  <Link to="/talents">Retour aux talents</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le talent</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce talent ? Cette action est irréversible.
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
    </>
  );
}

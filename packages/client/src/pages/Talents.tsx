import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit, Trash2, Music, Mail, Phone, Globe } from "lucide-react";
import { toast } from "sonner";
import { TALENT_TYPES, TALENT_TYPE_LABELS } from "@rsm/shared/types/talent";
import type { TalentType } from "@rsm/shared/types/talent";

export default function Talents() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<TalentType | "all">("all");

  const { data: talents, refetch } = trpc.musicians.list.useQuery(
    selectedType === "all" ? undefined : { talentType: selectedType }
  );

  const { data: stats } = trpc.musicians.getStats.useQuery();

  const deleteMutation = trpc.musicians.delete.useMutation({
    onSuccess: () => {
      toast.success("Talent supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (talent: any) => {
    setSelectedTalent(talent);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce talent ?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Client-side search filter
  const filteredTalents = talents?.filter((talent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      talent.name?.toLowerCase().includes(query) ||
      talent.stageName?.toLowerCase().includes(query) ||
      talent.email?.toLowerCase().includes(query) ||
      talent.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Talents</h1>
          <p className="text-muted-foreground">
            Gérez votre base de données de talents (musiciens, artistes, etc.)
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau talent
        </Button>
      </div>

      {/* Filtres par catégorie */}
      <div className="mb-6">
        <Tabs value={selectedType} onValueChange={(val) => setSelectedType(val as TalentType | "all")}>
          <TabsList>
            <TabsTrigger value="all">
              Tous ({talents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value={TALENT_TYPES.MUSICIAN}>
              {TALENT_TYPE_LABELS[TALENT_TYPES.MUSICIAN]}
            </TabsTrigger>
            <TabsTrigger value={TALENT_TYPES.ACTOR}>
              {TALENT_TYPE_LABELS[TALENT_TYPES.ACTOR]}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avec email</CardDescription>
              <CardTitle className="text-3xl">{stats.withEmail}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avec téléphone</CardDescription>
              <CardTitle className="text-3xl">{stats.withPhone}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avec site web</CardDescription>
              <CardTitle className="text-3xl">{stats.withWebsite || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Recherche */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Rechercher</Label>
              <Input
                placeholder="Nom, nom de scène, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des talents */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des talents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Nom de scène</TableHead>
                <TableHead>Instruments</TableHead>
                <TableHead>Genres</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTalents?.map((talent) => (
                <TableRow key={talent.id}>
                  <TableCell className="font-medium">{talent.name}</TableCell>
                  <TableCell>{talent.stageName || "-"}</TableCell>
                  <TableCell>
                    {talent.instruments ? (
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {(() => {
                            try {
                              const parsed = JSON.parse(talent.instruments);
                              return Array.isArray(parsed) ? parsed.join(", ") : talent.instruments;
                            } catch {
                              return talent.instruments;
                            }
                          })()}
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {talent.genres ? (
                      <span className="text-sm">
                        {(() => {
                          try {
                            const parsed = JSON.parse(talent.genres);
                            return Array.isArray(parsed) ? parsed.join(", ") : talent.genres;
                          } catch {
                            return talent.genres;
                          }
                        })()}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {talent.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {talent.email}
                        </div>
                      )}
                      {talent.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {talent.phone}
                        </div>
                      )}
                      {talent.website && (
                        <div className="flex items-center gap-1 text-sm">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={talent.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Site web
                          </a>
                        </div>
                      )}
                      {!talent.email && !talent.phone && !talent.website && "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(talent)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(talent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredTalents || filteredTalents.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Aucun talent trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <TalentFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setIsCreateDialogOpen(false);
        }}
      />

      {/* Dialog d'édition */}
      {selectedTalent && (
        <TalentFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          talent={selectedTalent}
          onSuccess={() => {
            refetch();
            setIsEditDialogOpen(false);
            setSelectedTalent(null);
          }}
        />
      )}
    </div>
  );
}

// Composant de formulaire de talent
function TalentFormDialog({
  open,
  onOpenChange,
  talent,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent?: any;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(talent?.name || "");
  const [stageName, setStageName] = useState(talent?.stageName || "");
  const [email, setEmail] = useState(talent?.email || "");
  const [phone, setPhone] = useState(talent?.phone || "");
  const [bio, setBio] = useState(talent?.bio || "");
  const [talentType, setTalentType] = useState<TalentType>(talent?.talentType || TALENT_TYPES.MUSICIAN);
  const [website, setWebsite] = useState(talent?.website || "");
  const [spotifyUrl, setSpotifyUrl] = useState(talent?.spotifyUrl || "");
  const [instruments, setInstruments] = useState(() => {
    if (!talent?.instruments) return "";
    try {
      const parsed = JSON.parse(talent.instruments);
      return Array.isArray(parsed) ? parsed.join(", ") : talent.instruments;
    } catch {
      return talent.instruments;
    }
  });
  const [genres, setGenres] = useState(() => {
    if (!talent?.genres) return "";
    try {
      const parsed = JSON.parse(talent.genres);
      return Array.isArray(parsed) ? parsed.join(", ") : talent.genres;
    } catch {
      return talent.genres;
    }
  });
  const [notes, setNotes] = useState(talent?.notes || "");

  const createMutation = trpc.musicians.create.useMutation({
    onSuccess: () => {
      toast.success("Talent créé avec succès");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.musicians.update.useMutation({
    onSuccess: () => {
      toast.success("Talent mis à jour avec succès");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!name) {
      toast.error("Le nom est obligatoire");
      return;
    }

    // Convert comma-separated strings to JSON arrays
    const instrumentsArray = instruments
      ? instruments.split(",").map((i: string) => i.trim()).filter(Boolean)
      : [];
    const genresArray = genres
      ? genres.split(",").map((g: string) => g.trim()).filter(Boolean)
      : [];

    const data = {
      name,
      stageName: stageName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      bio: bio || undefined,
      talentType,
      website: website || undefined,
      spotifyUrl: spotifyUrl || undefined,
      instruments: instrumentsArray.length > 0 ? JSON.stringify(instrumentsArray) : undefined,
      genres: genresArray.length > 0 ? JSON.stringify(genresArray) : undefined,
      notes: notes || undefined,
    };

    if (talent) {
      updateMutation.mutate({ id: talent.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {talent ? "Modifier le talent" : "Nouveau talent"}
          </DialogTitle>
          <DialogDescription>
            {talent
              ? "Modifiez les informations du talent"
              : "Ajoutez un nouveau talent à votre base de données"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label>Nom de scène</Label>
              <Input
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="DJ John"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label>Téléphone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Instruments (séparés par virgule)</Label>
              <Input
                value={instruments}
                onChange={(e) => setInstruments(e.target.value)}
                placeholder="Guitare, Piano, Batterie"
              />
            </div>

            <div>
              <Label>Genres (séparés par virgule)</Label>
              <Input
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Rock, Jazz, Pop"
              />
            </div>
          </div>

          <div>
            <Label>Biographie</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Biographie du talent..."
            />
          </div>

          <div>
            <Label>Type de talent *</Label>
            <Select value={talentType} onValueChange={(val) => setTalentType(val as TalentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TALENT_TYPES.MUSICIAN}>
                  {TALENT_TYPE_LABELS[TALENT_TYPES.MUSICIAN]}
                </SelectItem>
                <SelectItem value={TALENT_TYPES.ACTOR}>
                  {TALENT_TYPE_LABELS[TALENT_TYPES.ACTOR]}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Site web</Label>
              <Input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label>Spotify URL</Label>
              <Input
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes internes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {talent ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

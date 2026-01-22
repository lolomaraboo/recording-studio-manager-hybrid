import { useState, useEffect } from "react";
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
import { Link } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Music, Mail, Phone, Globe, ArrowLeft, TableIcon, Grid, Columns, Copy, Star } from "lucide-react";
import { toast } from "sonner";
import { TALENT_TYPES, TALENT_TYPE_LABELS, type TalentType } from "@rsm/shared";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ViewMode = 'table' | 'grid' | 'kanban';
type SortField = 'name' | 'talentType' | 'sessions' | 'lastSession';
type SortOrder = 'asc' | 'desc';

/**
 * Copy button for email/phone with toast feedback
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié!`);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 p-0"
      onClick={handleCopy}
      title={`Copier ${label.toLowerCase()}`}
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}

export default function Talents() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<TalentType | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('talentsViewMode');
    return (saved as ViewMode) || 'table';
  });
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('talentsViewMode', viewMode);
  }, [viewMode]);

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
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Music className="h-8 w-8 text-primary" />
              Talents
            </h2>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau talent
        </Button>
      </div>

      {/* Filtres par catégorie */}
      <div>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Total talents</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Performers VIP</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {stats.vipPerformers}
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Total crédits</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCredits}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Dernière activité</CardDescription>
              <CardTitle className="text-lg">
                {stats.lastActivityDate ?
                  format(new Date(stats.lastActivityDate), "dd MMM yyyy", { locale: fr })
                  : "Jamais"
                }
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Recherche */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recherche</CardTitle>
          <CardDescription className="text-sm">Filtrer les talents par nom, email ou téléphone</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Liste des talents</CardTitle>
              <CardDescription className="text-sm">Gérez votre base de données de talents</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <Columns className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' && (
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
                    className="text-center py-6"
                  >
                    <p className="text-sm text-muted-foreground">Aucun talent trouvé</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
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

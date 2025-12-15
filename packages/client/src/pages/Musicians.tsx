import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function Musicians() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMusician, setSelectedMusician] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: musicians, refetch } = trpc.musicians.list.useQuery({
    search: searchQuery || undefined,
  });

  const { data: stats } = trpc.musicians.getStats.useQuery();

  const deleteMutation = trpc.musicians.delete.useMutation({
    onSuccess: () => {
      toast.success("Musicien supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (musician: any) => {
    setSelectedMusician(musician);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce musicien ?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <AppLayout>
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Musiciens</h1>
          <p className="text-muted-foreground">
            Gérez votre base de données de musiciens
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau musicien
        </Button>
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
              <CardDescription>Instruments</CardDescription>
              <CardTitle className="text-3xl">
                {Object.keys(stats.instrumentCounts).length}
              </CardTitle>
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
                placeholder="Nom, nom d'artiste, instrument..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des musiciens */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des musiciens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Nom d'artiste</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {musicians?.map((musician) => (
                <TableRow key={musician.id}>
                  <TableCell className="font-medium">{musician.name}</TableCell>
                  <TableCell>{musician.artistName || "-"}</TableCell>
                  <TableCell>
                    {musician.instrument && (
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        {musician.instrument}
                      </div>
                    )}
                    {!musician.instrument && "-"}
                  </TableCell>
                  <TableCell>{musician.role || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {musician.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {musician.email}
                        </div>
                      )}
                      {musician.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {musician.phone}
                        </div>
                      )}
                      {!musician.email && !musician.phone && "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(musician)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(musician.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!musicians || musicians.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Aucun musicien trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <MusicianFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setIsCreateDialogOpen(false);
        }}
      />

      {/* Dialog d'édition */}
      {selectedMusician && (
        <MusicianFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          musician={selectedMusician}
          onSuccess={() => {
            refetch();
            setIsEditDialogOpen(false);
            setSelectedMusician(null);
          }}
        />
      )}
    </div>
    </AppLayout>
  );
}

// Composant de formulaire de musicien
function MusicianFormDialog({
  open,
  onOpenChange,
  musician,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  musician?: any;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(musician?.name || "");
  const [artistName, setArtistName] = useState(musician?.artistName || "");
  const [email, setEmail] = useState(musician?.email || "");
  const [phone, setPhone] = useState(musician?.phone || "");
  const [instrument, setInstrument] = useState(musician?.instrument || "");
  const [role, setRole] = useState(musician?.role || "");
  const [bio, setBio] = useState(musician?.bio || "");
  const [website, setWebsite] = useState(musician?.website || "");
  const [socialMedia, setSocialMedia] = useState(musician?.socialMedia || "");

  const createMutation = trpc.musicians.create.useMutation({
    onSuccess: () => {
      toast.success("Musicien créé avec succès");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.musicians.update.useMutation({
    onSuccess: () => {
      toast.success("Musicien mis à jour avec succès");
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

    const data = {
      name,
      artistName: artistName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      instrument: instrument || undefined,
      role: role || undefined,
      bio: bio || undefined,
      website: website || undefined,
      socialMedia: socialMedia || undefined,
    };

    if (musician) {
      updateMutation.mutate({ id: musician.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {musician ? "Modifier le musicien" : "Nouveau musicien"}
          </DialogTitle>
          <DialogDescription>
            {musician
              ? "Modifiez les informations du musicien"
              : "Ajoutez un nouveau musicien à votre base de données"}
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
              <Label>Nom d'artiste</Label>
              <Input
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
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
              <Label>Instrument</Label>
              <Input
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                placeholder="Guitare, Piano, Batterie..."
              />
            </div>

            <div>
              <Label>Rôle</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Guitariste, Chanteur..."
              />
            </div>
          </div>

          <div>
            <Label>Biographie</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Biographie du musicien..."
            />
          </div>

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
            <Label>Réseaux sociaux (JSON)</Label>
            <Textarea
              value={socialMedia}
              onChange={(e) => setSocialMedia(e.target.value)}
              rows={2}
              placeholder='{"instagram": "@john", "twitter": "@john"}'
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
            {musician ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

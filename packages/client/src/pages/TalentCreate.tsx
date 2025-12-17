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

export default function TalentCreate() {
  const navigate = useNavigate();

  // Create mutation
  const createMutation = trpc.musicians.create.useMutation({
    onSuccess: (data) => {
      toast.success("Talent créé avec succès");
      navigate(`/talents/${data.id}`);
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
    talentType: "musician" as const,
    website: "",
    spotifyUrl: "",
    instruments: "",
    genres: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    // Submit
    createMutation.mutate({
      name: formData.name,
      stageName: formData.stageName || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      talentType: formData.talentType,
      website: formData.website || undefined,
      spotifyUrl: formData.spotifyUrl || undefined,
      instruments: formData.instruments || undefined,
      genres: formData.genres || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/talents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Nouveau Talent</h1>
            <p className="text-muted-foreground">Ajouter un nouveau talent au studio</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du talent</CardTitle>
            <CardDescription>Profil du musicien ou acteur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Name & Stage Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom complet <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stageName">Nom de scène</Label>
                <Input
                  id="stageName"
                  value={formData.stageName}
                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                  placeholder="Ex: JDoe"
                />
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>

            {/* Row 3: Talent Type */}
            <div className="space-y-2">
              <Label htmlFor="talentType">Type</Label>
              <Select
                value={formData.talentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, talentType: value as typeof formData.talentType })
                }
              >
                <SelectTrigger id="talentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="musician">Musicien</SelectItem>
                  <SelectItem value="actor">Acteur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: Website & Spotify */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
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
            </div>

            {/* Row 5: Instruments & Genres (JSON) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instruments">Instruments (JSON)</Label>
                <Input
                  id="instruments"
                  value={formData.instruments}
                  onChange={(e) => setFormData({ ...formData, instruments: e.target.value })}
                  placeholder='["Guitar", "Piano"]'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genres">Genres (JSON)</Label>
                <Input
                  id="genres"
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  placeholder='["Rock", "Jazz"]'
                />
              </div>
            </div>

            {/* Row 6: Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Bio du talent..."
                rows={3}
              />
            </div>

            {/* Row 7: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes privées..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer le talent"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/talents")}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

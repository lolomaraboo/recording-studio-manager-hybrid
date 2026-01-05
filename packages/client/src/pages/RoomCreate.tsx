import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Building } from "lucide-react";
import { toast } from "sonner";

export default function RoomCreate() {
  const navigate = useNavigate();

  // Create mutation
  const createMutation = trpc.rooms.create.useMutation({
    onSuccess: (data) => {
      toast.success("Salle créée avec succès");
      navigate(`/rooms/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "recording" as const,
    hourlyRate: 0,
    halfDayRate: 0,
    fullDayRate: 0,
    capacity: 1,
    size: 0,
    hasIsolationBooth: false,
    hasLiveRoom: false,
    hasControlRoom: false,
    equipmentList: "",
    isActive: true,
    isAvailableForBooking: true,
    color: "",
    imageUrl: "",
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
      description: formData.description || undefined,
      type: formData.type,
      hourlyRate: formData.hourlyRate,
      halfDayRate: formData.halfDayRate,
      fullDayRate: formData.fullDayRate,
      capacity: formData.capacity,
      size: formData.size || undefined,
      hasIsolationBooth: formData.hasIsolationBooth,
      hasLiveRoom: formData.hasLiveRoom,
      hasControlRoom: formData.hasControlRoom,
      equipmentList: formData.equipmentList || undefined,
      isActive: formData.isActive,
      isAvailableForBooking: formData.isAvailableForBooking,
      color: formData.color || undefined,
      imageUrl: formData.imageUrl || undefined,
    });
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/rooms">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building className="h-8 w-8 text-primary" />
                Nouvelle Salle
              </h1>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations de la salle</CardTitle>
              <CardDescription className="text-sm">Configurez les détails de la salle</CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Name & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Studio A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as typeof formData.type })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recording">Enregistrement</SelectItem>
                    <SelectItem value="mixing">Mixage</SelectItem>
                    <SelectItem value="mastering">Mastering</SelectItem>
                    <SelectItem value="rehearsal">Répétition</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Rates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Tarif horaire (€)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="halfDayRate">Demi-journée (€)</Label>
                <Input
                  id="halfDayRate"
                  type="number"
                  value={formData.halfDayRate}
                  onChange={(e) => setFormData({ ...formData, halfDayRate: parseFloat(e.target.value) })}
                  placeholder="200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDayRate">Journée complète (€)</Label>
                <Input
                  id="fullDayRate"
                  type="number"
                  value={formData.fullDayRate}
                  onChange={(e) => setFormData({ ...formData, fullDayRate: parseFloat(e.target.value) })}
                  placeholder="350"
                />
              </div>
            </div>

            {/* Row 3: Capacity & Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité (personnes)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  placeholder="4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Superficie (m²)</Label>
                <Input
                  id="size"
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: parseFloat(e.target.value) })}
                  placeholder="25"
                />
              </div>
            </div>

            {/* Row 4: Checkboxes */}
            <div className="space-y-3">
              <Label>Configuration</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasIsolationBooth"
                    checked={formData.hasIsolationBooth}
                    onChange={(e) =>
                      setFormData({ ...formData, hasIsolationBooth: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="hasIsolationBooth" className="text-sm cursor-pointer">
                    Cabine d'isolation
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasLiveRoom"
                    checked={formData.hasLiveRoom}
                    onChange={(e) =>
                      setFormData({ ...formData, hasLiveRoom: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="hasLiveRoom" className="text-sm cursor-pointer">
                    Live room
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasControlRoom"
                    checked={formData.hasControlRoom}
                    onChange={(e) =>
                      setFormData({ ...formData, hasControlRoom: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="hasControlRoom" className="text-sm cursor-pointer">
                    Régie
                  </label>
                </div>
              </div>
            </div>

            {/* Row 5: Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la salle..."
                rows={3}
              />
            </div>

            {/* Row 6: Equipment List */}
            <div className="space-y-2">
              <Label htmlFor="equipmentList">Liste d'équipements (JSON)</Label>
              <Textarea
                id="equipmentList"
                value={formData.equipmentList}
                onChange={(e) => setFormData({ ...formData, equipmentList: e.target.value })}
                placeholder='["SSL Console", "Neumann U87", ...]'
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer la salle"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/rooms")}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
      </div>
    </div>
  );
}

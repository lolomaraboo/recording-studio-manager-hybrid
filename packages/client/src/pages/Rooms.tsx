import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Plus, Pencil, Trash2, DoorOpen, CheckCircle2, XCircle } from "lucide-react";

type RoomFormData = {
  name: string;
  description: string;
  type: "recording" | "mixing" | "mastering" | "rehearsal" | "live";
  hourlyRate: number;
  halfDayRate: number;
  fullDayRate: number;
  capacity: number;
  size?: number;
  hasIsolationBooth: boolean;
  hasLiveRoom: boolean;
  hasControlRoom: boolean;
  isActive: boolean;
  isAvailableForBooking: boolean;
  imageUrl?: string;
};

const defaultFormData: RoomFormData = {
  name: "",
  description: "",
  type: "recording",
  hourlyRate: 0,
  halfDayRate: 0,
  fullDayRate: 0,
  capacity: 1,
  hasIsolationBooth: false,
  hasLiveRoom: false,
  hasControlRoom: false,
  isActive: true,
  isAvailableForBooking: true,
};

const roomTypeLabels = {
  recording: "Enregistrement",
  mixing: "Mixage",
  mastering: "Mastering",
  rehearsal: "Répétition",
  live: "Live",
};

export default function Rooms() {
  const [, setLocation] = useLocation();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(defaultFormData);

  useEffect(() => {
    const storedOrgId = localStorage.getItem("selectedOrganizationId");
    if (storedOrgId) {
      setSelectedOrgId(parseInt(storedOrgId));
    } else {
      setLocation("/select-organization");
    }
  }, [setLocation]);

  const utils = trpc.useUtils();
  const { data: rooms, isLoading } = trpc.rooms.getAll.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: selectedOrgId !== null }
  );

  const createMutation = trpc.rooms.create.useMutation({
    onSuccess: () => {
      utils.rooms.getAll.invalidate();
      setIsDialogOpen(false);
      setFormData(defaultFormData);
    },
  });

  const updateMutation = trpc.rooms.update.useMutation({
    onSuccess: () => {
      utils.rooms.getAll.invalidate();
      setIsDialogOpen(false);
      setEditingRoom(null);
      setFormData(defaultFormData);
    },
  });

  const deleteMutation = trpc.rooms.delete.useMutation({
    onSuccess: () => {
      utils.rooms.getAll.invalidate();
    },
  });

  const handleCreate = () => {
    setEditingRoom(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room.id);
    setFormData({
      name: room.name,
      description: room.description || "",
      type: room.type,
      hourlyRate: room.hourlyRate,
      halfDayRate: room.halfDayRate,
      fullDayRate: room.fullDayRate,
      capacity: room.capacity,
      size: room.size || undefined,
      hasIsolationBooth: room.hasIsolationBooth,
      hasLiveRoom: room.hasLiveRoom,
      hasControlRoom: room.hasControlRoom,
      isActive: room.isActive,
      isAvailableForBooking: room.isAvailableForBooking,
      imageUrl: room.imageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) {
      if (!selectedOrgId) return;
      deleteMutation.mutate({ id, organizationId: selectedOrgId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      if (!selectedOrgId) return;
      updateMutation.mutate({ id: editingRoom, organizationId: selectedOrgId, ...formData });
    } else {
      if (!selectedOrgId) return;
      createMutation.mutate({ organizationId: selectedOrgId, ...formData });
    }
  };

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(2)} €`;
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Salles</h1>
          <p className="text-muted-foreground">
            Gérez vos salles d'enregistrement et leurs caractéristiques
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle salle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des salles</CardTitle>
          <CardDescription>
            {rooms?.length || 0} salle(s) enregistrée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : !rooms || rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DoorOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Aucune salle enregistrée</p>
              <p className="text-sm">Créez votre première salle pour commencer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacité</TableHead>
                  <TableHead>Tarif/h</TableHead>
                  <TableHead>Demi-journée</TableHead>
                  <TableHead>Journée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{roomTypeLabels[room.type]}</TableCell>
                    <TableCell>{room.capacity} pers.</TableCell>
                    <TableCell>{formatPrice(room.hourlyRate)}</TableCell>
                    <TableCell>{formatPrice(room.halfDayRate)}</TableCell>
                    <TableCell>{formatPrice(room.fullDayRate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {room.isActive ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {room.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(room)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Modifier la salle" : "Nouvelle salle"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de la salle
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roomTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacité (personnes) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="hourlyRate">Tarif horaire (€)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate / 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyRate: Math.round(parseFloat(e.target.value) * 100) || 0,
                      })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="halfDayRate">Demi-journée (€)</Label>
                  <Input
                    id="halfDayRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.halfDayRate / 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        halfDayRate: Math.round(parseFloat(e.target.value) * 100) || 0,
                      })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fullDayRate">Journée complète (€)</Label>
                  <Input
                    id="fullDayRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fullDayRate / 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fullDayRate: Math.round(parseFloat(e.target.value) * 100) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="size">Taille (m²)</Label>
                <Input
                  id="size"
                  type="number"
                  min="0"
                  value={formData.size || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      size: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-4">
                <Label>Équipements</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasIsolationBooth" className="font-normal">
                    Cabine d'isolation
                  </Label>
                  <Switch
                    id="hasIsolationBooth"
                    checked={formData.hasIsolationBooth}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasIsolationBooth: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasLiveRoom" className="font-normal">
                    Salle live
                  </Label>
                  <Switch
                    id="hasLiveRoom"
                    checked={formData.hasLiveRoom}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasLiveRoom: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasControlRoom" className="font-normal">
                    Régie
                  </Label>
                  <Switch
                    id="hasControlRoom"
                    checked={formData.hasControlRoom}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasControlRoom: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Statut</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="font-normal">
                    Salle active
                  </Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isAvailableForBooking" className="font-normal">
                    Disponible pour réservation
                  </Label>
                  <Switch
                    id="isAvailableForBooking"
                    checked={formData.isAvailableForBooking}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isAvailableForBooking: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingRoom ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}

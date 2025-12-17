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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, DoorOpen, Edit, Trash2, Save, X, CheckCircle2, XCircle, Users, Maximize } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const roomTypeLabels: Record<string, string> = {
  recording: "Enregistrement",
  mixing: "Mixage",
  mastering: "Mastering",
  rehearsal: "Répétition",
  live: "Live",
};

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch room data
  const { data: room, isLoading, refetch } = trpc.rooms.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Mutations
  const updateMutation = trpc.rooms.update.useMutation({
    onSuccess: () => {
      toast.success("Salle mise à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.rooms.delete.useMutation({
    onSuccess: () => {
      toast.success("Salle supprimée");
      navigate("/rooms");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "recording" as "recording" | "mixing" | "mastering" | "rehearsal" | "live",
    hourlyRate: 0,
    halfDayRate: 0,
    fullDayRate: 0,
    capacity: 1,
    size: undefined as number | undefined,
    hasIsolationBooth: false,
    hasLiveRoom: false,
    hasControlRoom: false,
    isActive: true,
    isAvailableForBooking: true,
    imageUrl: "",
  });

  // Update form when room loads
  useEffect(() => {
    if (room) {
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
    }
  }, [room]);

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      ...formData,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(2)} €`;
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

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/rooms">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Salle introuvable</h1>
          </div>
        </header>
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Cette salle n'existe pas ou a été supprimée.</p>
              <Button className="mt-4" asChild>
                <Link to="/rooms">Retour aux salles</Link>
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
              <Link to="/rooms">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{room.name}</h1>
              <p className="text-sm text-muted-foreground">Salle #{room.id}</p>
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
            {/* Room Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de la salle</CardTitle>
                <CardDescription>Détails et caractéristiques de la salle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger id="type">
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

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacité (personnes)</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          value={formData.capacity}
                          onChange={(e) =>
                            setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Taille (m²)</Label>
                      <Input
                        id="size"
                        type="number"
                        min="0"
                        value={formData.size || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, size: parseInt(e.target.value) || undefined })
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
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

                      <div className="space-y-2">
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

                      <div className="space-y-2">
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
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{room.description || "Aucune description"}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Type</p>
                        <Badge variant="outline">{roomTypeLabels[room.type]}</Badge>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Capacité</p>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">{room.capacity} personnes</span>
                        </div>
                      </div>
                    </div>

                    {room.size && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Taille</p>
                        <div className="flex items-center gap-2">
                          <Maximize className="h-4 w-4" />
                          <span className="text-sm">{room.size} m²</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tarifs</p>
                      <div className="grid gap-2 md:grid-cols-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Horaire</p>
                          <p className="text-lg font-semibold">{formatPrice(room.hourlyRate)}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Demi-journée</p>
                          <p className="text-lg font-semibold">{formatPrice(room.halfDayRate)}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Journée</p>
                          <p className="text-lg font-semibold">{formatPrice(room.fullDayRate)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Equipment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Équipements</CardTitle>
                <CardDescription>Caractéristiques et équipements de la salle</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
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
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">Cabine d'isolation</span>
                      {room.hasIsolationBooth ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">Salle live</span>
                      {room.hasLiveRoom ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">Régie</span>
                      {room.hasControlRoom ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Statut</CardTitle>
                <CardDescription>État et disponibilité de la salle</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
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
                          setFormData({ ...formData, isAvailableForBooking: checked })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">Salle active</span>
                      <div className="flex items-center gap-2">
                        {room.isActive ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <Badge variant="secondary">Active</Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <Badge variant="outline">Inactive</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">Disponible pour réservation</span>
                      <div className="flex items-center gap-2">
                        {room.isAvailableForBooking ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <Badge variant="secondary">Disponible</Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <Badge variant="outline">Indisponible</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID</p>
                  <p className="text-sm font-medium">#{room.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Créée le</p>
                  <p className="text-sm">
                    {format(new Date(room.createdAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mise à jour</p>
                  <p className="text-sm">
                    {format(new Date(room.updatedAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/sessions">Voir les sessions</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/calendar">Voir le calendrier</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/rooms">Retour aux salles</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la salle</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible.
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

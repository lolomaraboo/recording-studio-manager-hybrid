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
import { ArrowLeft, Package, Edit, Trash2, Save, X, Calendar, DollarSign, Wrench } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  microphone: "Microphone",
  preamp: "Préampli",
  interface: "Interface audio",
  outboard: "Outboard",
  instrument: "Instrument",
  monitoring: "Monitoring",
  computer: "Ordinateur",
  cable: "Câble",
  accessory: "Accessoire",
  other: "Autre",
};

const statusLabels: Record<string, { label: string; variant: any }> = {
  operational: { label: "Opérationnel", variant: "default" },
  maintenance: { label: "Maintenance", variant: "outline" },
  out_of_service: { label: "Hors service", variant: "destructive" },
  rented: { label: "Loué", variant: "secondary" },
};

const conditionLabels: Record<string, string> = {
  excellent: "Excellent",
  good: "Bon",
  fair: "Correct",
  poor: "Mauvais",
};

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch equipment data
  const { data: equipment, isLoading, refetch } = trpc.equipment.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Mutations
  const updateMutation = trpc.equipment.update.useMutation({
    onSuccess: () => {
      toast.success("Équipement mis à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      toast.success("Équipement supprimé");
      navigate("/equipment");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    serialNumber: "",
    category: "microphone" as
      | "microphone"
      | "preamp"
      | "interface"
      | "outboard"
      | "instrument"
      | "monitoring"
      | "computer"
      | "cable"
      | "accessory"
      | "other",
    description: "",
    specifications: "",
    purchaseDate: "",
    purchasePrice: "",
    warrantyUntil: "",
    status: "operational" as "operational" | "maintenance" | "out_of_service" | "rented",
    condition: "good" as "excellent" | "good" | "fair" | "poor",
    lastMaintenanceAt: "",
    nextMaintenanceAt: "",
    maintenanceNotes: "",
    location: "",
    isAvailable: true,
    notes: "",
  });

  // Update form when equipment loads
  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        brand: equipment.brand || "",
        model: equipment.model || "",
        serialNumber: equipment.serialNumber || "",
        category: equipment.category,
        description: equipment.description || "",
        specifications: equipment.specifications || "",
        purchaseDate: equipment.purchaseDate
          ? new Date(equipment.purchaseDate).toISOString().split("T")[0]
          : "",
        purchasePrice: equipment.purchasePrice || "",
        warrantyUntil: equipment.warrantyUntil
          ? new Date(equipment.warrantyUntil).toISOString().split("T")[0]
          : "",
        status: equipment.status,
        condition: equipment.condition,
        lastMaintenanceAt: equipment.lastMaintenanceAt
          ? new Date(equipment.lastMaintenanceAt).toISOString().split("T")[0]
          : "",
        nextMaintenanceAt: equipment.nextMaintenanceAt
          ? new Date(equipment.nextMaintenanceAt).toISOString().split("T")[0]
          : "",
        maintenanceNotes: equipment.maintenanceNotes || "",
        location: equipment.location || "",
        isAvailable: equipment.isAvailable,
        notes: equipment.notes || "",
      });
    }
  }, [equipment]);

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      ...formData,
      purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
      warrantyUntil: formData.warrantyUntil ? new Date(formData.warrantyUntil) : undefined,
      lastMaintenanceAt: formData.lastMaintenanceAt ? new Date(formData.lastMaintenanceAt) : undefined,
      nextMaintenanceAt: formData.nextMaintenanceAt ? new Date(formData.nextMaintenanceAt) : undefined,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
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

  if (!equipment) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/equipment">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Équipement introuvable</h1>
          </div>
        </header>
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Cet équipement n'existe pas ou a été supprimé.</p>
              <Button className="mt-4" asChild>
                <Link to="/equipment">Retour aux équipements</Link>
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
              <Link to="/equipment">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{equipment.name}</h1>
              <p className="text-sm text-muted-foreground">Équipement #{equipment.id}</p>
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
            {/* Equipment Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Détails et spécifications de l'équipement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger id="category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Marque</Label>
                        <Input
                          id="brand"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="model">Modèle</Label>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serialNumber">N° de série</Label>
                        <Input
                          id="serialNumber"
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        />
                      </div>
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

                    <div className="space-y-2">
                      <Label htmlFor="specifications">Spécifications</Label>
                      <Textarea
                        id="specifications"
                        value={formData.specifications}
                        onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Emplacement</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Studio A, Rack 1"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Catégorie</p>
                        <Badge variant="outline">{categoryLabels[equipment.category]}</Badge>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">N° de série</p>
                        <p className="text-sm">{equipment.serialNumber || "N/A"}</p>
                      </div>
                    </div>

                    {(equipment.brand || equipment.model) && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Marque & Modèle</p>
                        <p className="text-sm">
                          {[equipment.brand, equipment.model].filter(Boolean).join(" ")}
                        </p>
                      </div>
                    )}

                    {equipment.description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{equipment.description}</p>
                      </div>
                    )}

                    {equipment.specifications && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Spécifications</p>
                        <p className="text-sm whitespace-pre-wrap">{equipment.specifications}</p>
                      </div>
                    )}

                    {equipment.location && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Emplacement</p>
                        <p className="text-sm">{equipment.location}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Purchase & Warranty Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <CardTitle>Achat & Garantie</CardTitle>
                </div>
                <CardDescription>Informations d'achat et de garantie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="purchaseDate">Date d'achat</Label>
                        <Input
                          id="purchaseDate"
                          type="date"
                          value={formData.purchaseDate}
                          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purchasePrice">Prix d'achat (€)</Label>
                        <Input
                          id="purchasePrice"
                          type="number"
                          step="0.01"
                          value={formData.purchasePrice}
                          onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warrantyUntil">Garantie jusqu'au</Label>
                      <Input
                        id="warrantyUntil"
                        type="date"
                        value={formData.warrantyUntil}
                        onChange={(e) => setFormData({ ...formData, warrantyUntil: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      {equipment.purchaseDate && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Date d'achat</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <p className="text-sm">
                              {format(new Date(equipment.purchaseDate), "dd MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>
                      )}

                      {equipment.purchasePrice && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Prix d'achat</p>
                          <p className="text-lg font-semibold">{equipment.purchasePrice} €</p>
                        </div>
                      )}
                    </div>

                    {equipment.warrantyUntil && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Garantie</p>
                        <p className="text-sm">
                          Jusqu'au {format(new Date(equipment.warrantyUntil), "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Maintenance Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  <CardTitle>Maintenance</CardTitle>
                </div>
                <CardDescription>Historique et planification de la maintenance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="lastMaintenanceAt">Dernière maintenance</Label>
                        <Input
                          id="lastMaintenanceAt"
                          type="date"
                          value={formData.lastMaintenanceAt}
                          onChange={(e) =>
                            setFormData({ ...formData, lastMaintenanceAt: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nextMaintenanceAt">Prochaine maintenance</Label>
                        <Input
                          id="nextMaintenanceAt"
                          type="date"
                          value={formData.nextMaintenanceAt}
                          onChange={(e) =>
                            setFormData({ ...formData, nextMaintenanceAt: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maintenanceNotes">Notes de maintenance</Label>
                      <Textarea
                        id="maintenanceNotes"
                        value={formData.maintenanceNotes}
                        onChange={(e) =>
                          setFormData({ ...formData, maintenanceNotes: e.target.value })
                        }
                        rows={4}
                        placeholder="Notes sur la maintenance..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      {equipment.lastMaintenanceAt && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Dernière maintenance</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <p className="text-sm">
                              {format(new Date(equipment.lastMaintenanceAt), "dd MMMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {equipment.nextMaintenanceAt && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Prochaine maintenance</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <p className="text-sm">
                              {format(new Date(equipment.nextMaintenanceAt), "dd MMMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {equipment.maintenanceNotes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{equipment.maintenanceNotes}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            {(equipment.notes || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes additionnelles</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      placeholder="Notes supplémentaires..."
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {equipment.notes || "Aucune note"}
                    </p>
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
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
                      >
                        <SelectTrigger id="condition">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(conditionLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Statut</p>
                      <Badge variant={statusLabels[equipment.status].variant}>
                        {statusLabels[equipment.status].label}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Condition</p>
                      <p className="text-sm">{conditionLabels[equipment.condition]}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Disponibilité</p>
                      <Badge variant={equipment.isAvailable ? "default" : "outline"}>
                        {equipment.isAvailable ? "Disponible" : "Indisponible"}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Meta Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID</p>
                  <p className="text-sm font-medium">#{equipment.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Créé le</p>
                  <p className="text-sm">
                    {format(new Date(equipment.createdAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mis à jour</p>
                  <p className="text-sm">
                    {format(new Date(equipment.updatedAt), "dd MMM yyyy", { locale: fr })}
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
                  <Link to="/equipment">Retour aux équipements</Link>
                </Button>
                {equipment.roomId && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/rooms/${equipment.roomId}`}>Voir la salle</Link>
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
            <DialogTitle>Supprimer l'équipement</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.
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

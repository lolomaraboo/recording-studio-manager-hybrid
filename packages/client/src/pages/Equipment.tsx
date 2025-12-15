import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export default function Equipment() {
  const organizationId = parseInt(localStorage.getItem("selectedOrganizationId") || "0");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "microphone" as "microphone" | "preamp" | "interface" | "outboard" | "instrument" | "monitoring" | "computer" | "cable" | "accessory" | "other",
    status: "operational" as "operational" | "maintenance" | "out_of_service" | "rented",
    purchaseDate: "",
    purchasePrice: "",
    serialNumber: "",
    maintenanceNotes: "",
  });

  const utils = trpc.useUtils();
  const { data: equipment, isLoading } = trpc.equipment.list.useQuery(
    { organizationId: organizationId! },
    { enabled: !!organizationId }
  );

  const createMutation = trpc.equipment.create.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Équipement ajouté avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.equipment.update.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedEquipment(null);
      resetForm();
      toast.success("Équipement mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      toast.success("Équipement supprimé avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "microphone",
      status: "operational",
      purchaseDate: "",
      purchasePrice: "",
      serialNumber: "",
      maintenanceNotes: "",
    });
  };

  const handleAdd = () => {
    if (!organizationId) return;
    createMutation.mutate({
      organizationId,
      name: formData.name,
      category: formData.category,
      status: formData.status,
      purchasePrice: formData.purchasePrice ? parseInt(formData.purchasePrice) : 0,
      serialNumber: formData.serialNumber || undefined,
      maintenanceNotes: formData.maintenanceNotes || undefined,
    });
  };

  const handleEdit = () => {
    if (!selectedEquipment || !organizationId) return;
    updateMutation.mutate({
      id: selectedEquipment.id,
      organizationId,
      name: formData.name,
      status: formData.status,
      maintenanceNotes: formData.maintenanceNotes || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (!organizationId) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
      deleteMutation.mutate({ id, organizationId });
    }
  };

  const openEditDialog = (item: any) => {
    setSelectedEquipment(item);
    setFormData({
      name: item.name,
      category: item.category,
      status: item.status,
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split("T")[0] : "",
      purchasePrice: item.purchasePrice?.toString() || "",
      serialNumber: item.serialNumber || "",
      maintenanceNotes: item.maintenanceNotes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      operational: "default",
      maintenance: "outline",
      out_of_service: "destructive",
      rented: "secondary",
    };
    const labels: Record<string, string> = {
      operational: "Opérationnel",
      maintenance: "Maintenance",
      out_of_service: "Hors service",
      rented: "Loué",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Équipement</h1>
            <p className="text-muted-foreground mt-2">
              Gérez votre inventaire d'équipement de studio
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un équipement
          </Button>
        </div>

        {equipment && equipment.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Aucun équipement</CardTitle>
              <CardDescription className="mb-4">
                Commencez par ajouter votre premier équipement
              </CardDescription>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un équipement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Liste de l'équipement</CardTitle>
              <CardDescription>
                {equipment?.length} équipement(s) au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>N° de série</TableHead>
                    <TableHead>Prix d'achat</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.serialNumber || "—"}
                      </TableCell>
                      <TableCell>
                        {item.purchasePrice
                          ? `${item.purchasePrice.toLocaleString("fr-FR")} €`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Dialog Ajouter */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un équipement</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel équipement à votre inventaire
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Neumann U87"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="microphone">Microphone</SelectItem>
                      <SelectItem value="preamp">Préampli</SelectItem>
                      <SelectItem value="interface">Interface audio</SelectItem>
                      <SelectItem value="outboard">Outboard</SelectItem>
                      <SelectItem value="instrument">Instrument</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="computer">Ordinateur</SelectItem>
                      <SelectItem value="cable">Câble</SelectItem>
                      <SelectItem value="accessory">Accessoire</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Opérationnel</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="out_of_service">Hors service</SelectItem>
                      <SelectItem value="rented">Loué</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">N° de série</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="SN123456"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    placeholder="2500.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceNotes">Notes de maintenance</Label>
                <Input
                  id="maintenanceNotes"
                  value={formData.maintenanceNotes}
                  onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })}
                  placeholder="Informations de maintenance..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.category}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Modifier */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'équipement</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l'équipement
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="microphone">Microphone</SelectItem>
                      <SelectItem value="preamp">Préampli</SelectItem>
                      <SelectItem value="interface">Interface audio</SelectItem>
                      <SelectItem value="outboard">Outboard</SelectItem>
                      <SelectItem value="instrument">Instrument</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="computer">Ordinateur</SelectItem>
                      <SelectItem value="cable">Câble</SelectItem>
                      <SelectItem value="accessory">Accessoire</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Opérationnel</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="out_of_service">Hors service</SelectItem>
                      <SelectItem value="rented">Loué</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-serialNumber">N° de série</Label>
                  <Input
                    id="edit-serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-purchaseDate">Date d'achat</Label>
                  <Input
                    id="edit-purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-purchasePrice">Prix d'achat (€)</Label>
                  <Input
                    id="edit-purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maintenanceNotes">Notes de maintenance</Label>
                <Input
                  id="edit-maintenanceNotes"
                  value={formData.maintenanceNotes}
                  onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleEdit} disabled={!formData.name || !formData.category}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

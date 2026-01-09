import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router-dom";
import { Package, Plus, Search, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ServiceCategory = "Studio" | "Post-production" | "Location matériel" | "Autre";

interface ServiceFormData {
  name: string;
  description: string;
  category: ServiceCategory;
  unitPrice: string;
  taxRate: string;
  defaultQuantity: string;
}

const INITIAL_FORM_DATA: ServiceFormData = {
  name: "",
  description: "",
  category: "Studio",
  unitPrice: "",
  taxRate: "20",
  defaultQuantity: "1.00",
};

export default function Services() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<number | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_FORM_DATA);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const utils = trpc.useUtils();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const { data: services, isLoading } = trpc.serviceCatalog.list.useQuery({
    search: debouncedSearch,
    category: categoryFilter === "all" ? undefined : (categoryFilter as ServiceCategory),
  });

  // Mutations
  const createMutation = trpc.serviceCatalog.create.useMutation({
    onSuccess: () => {
      utils.serviceCatalog.list.invalidate();
      toast.success("Service créé avec succès");
      closeModal();
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du service");
      console.error(error);
    },
  });

  const updateMutation = trpc.serviceCatalog.update.useMutation({
    onSuccess: () => {
      utils.serviceCatalog.list.invalidate();
      toast.success("Service mis à jour avec succès");
      closeModal();
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du service");
      console.error(error);
    },
  });

  const deleteMutation = trpc.serviceCatalog.delete.useMutation({
    onSuccess: () => {
      utils.serviceCatalog.list.invalidate();
      toast.success("Service supprimé");
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression du service");
      console.error(error);
    },
  });

  // Form handlers
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ServiceFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "Le nom est requis";
    } else if (formData.name.length > 255) {
      errors.name = "Le nom ne peut pas dépasser 255 caractères";
    }

    const unitPrice = parseFloat(formData.unitPrice);
    if (!formData.unitPrice || isNaN(unitPrice) || unitPrice < 0) {
      errors.unitPrice = "Le prix unitaire doit être un nombre positif";
    }

    const taxRate = parseFloat(formData.taxRate);
    if (!formData.taxRate || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      errors.taxRate = "Le taux de TVA doit être entre 0 et 100";
    }

    const defaultQuantity = parseFloat(formData.defaultQuantity);
    if (!formData.defaultQuantity || isNaN(defaultQuantity) || defaultQuantity <= 0) {
      errors.defaultQuantity = "La quantité par défaut doit être supérieure à 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      category: formData.category,
      unitPrice: formData.unitPrice,
      taxRate: formData.taxRate,
      defaultQuantity: formData.defaultQuantity,
    };

    if (editingService !== null) {
      await updateMutation.mutateAsync({ id: editingService, ...data } as any);
    } else {
      await createMutation.mutateAsync(data as any);
    }
  };

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingService(null);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (service: any) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category,
      unitPrice: service.unitPrice.toString(),
      taxRate: service.taxRate.toString(),
      defaultQuantity: service.defaultQuantity.toString(),
    });
    setEditingService(service.id);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setEditingService(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (deleteConfirmId !== null) {
      await deleteMutation.mutateAsync({ id: deleteConfirmId });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatTax = (taxRate: number) => {
    return `${taxRate}%`;
  };

  const serviceToDelete = services?.find((s) => s.id === deleteConfirmId);

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Services
            </h2>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau service
          </Button>
        </div>

        {/* Filters */}
        <Card className="pb-3">
          <CardHeader>
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-64">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="Post-production">Post-production</SelectItem>
                    <SelectItem value="Location matériel">Location matériel</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card className="pb-3">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground">Chargement...</div>
            ) : !services || services.length === 0 ? (
              <div className="py-6 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucun service</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Créez votre premier service pour commencer
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Qté défaut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{service.category}</TableCell>
                      <TableCell className="text-right">{formatPrice(parseFloat(service.unitPrice))}</TableCell>
                      <TableCell className="text-right">{formatTax(parseFloat(service.taxRate))}</TableCell>
                      <TableCell className="text-right">{service.defaultQuantity}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(service.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingService !== null ? "Modifier le service" : "Nouveau service"}
            </DialogTitle>
            <DialogDescription>
              {editingService !== null
                ? "Modifiez les informations du service"
                : "Créez un nouveau service pour votre catalogue"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Session d'enregistrement 1h"
                maxLength={255}
                autoFocus
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle du service"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">
                Catégorie <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: ServiceCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="Post-production">Post-production</SelectItem>
                  <SelectItem value="Location matériel">Location matériel</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unitPrice">
                  Prix unitaire (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0.00"
                />
                {formErrors.unitPrice && (
                  <p className="text-sm text-destructive">{formErrors.unitPrice}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="taxRate">
                  TVA (%) <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.taxRate}
                  onValueChange={(value) => setFormData({ ...formData, taxRate: value })}
                >
                  <SelectTrigger id="taxRate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20% (Standard)</SelectItem>
                    <SelectItem value="10">10% (Réduit)</SelectItem>
                    <SelectItem value="5.5">5.5% (Réduit)</SelectItem>
                    <SelectItem value="5">5% (Super réduit)</SelectItem>
                    <SelectItem value="2.1">2.1% (Super réduit)</SelectItem>
                    <SelectItem value="0">0% (Exonéré)</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.taxRate && (
                  <p className="text-sm text-destructive">{formErrors.taxRate}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="defaultQuantity">
                Quantité par défaut <span className="text-destructive">*</span>
              </Label>
              <Input
                id="defaultQuantity"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.defaultQuantity}
                onChange={(e) => setFormData({ ...formData, defaultQuantity: e.target.value })}
                placeholder="1.00"
              />
              {formErrors.defaultQuantity && (
                <p className="text-sm text-destructive">{formErrors.defaultQuantity}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Enregistrement..."
                : editingService !== null
                ? "Mettre à jour"
                : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le service "{serviceToDelete?.name}" ?
              <br />
              <br />
              Cette action est irréversible. Les devis existants utilisant ce service ne seront
              pas affectés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

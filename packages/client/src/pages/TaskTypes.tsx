import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Settings, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TaskTypeFormData {
  name: string;
  description?: string;
  hourlyRate: string;
  category: "billable" | "non-billable";
  color?: string;
  sortOrder: number;
}

const INITIAL_FORM_DATA: TaskTypeFormData = {
  name: "",
  description: "",
  hourlyRate: "",
  category: "billable",
  color: "#3B82F6",
  sortOrder: 0,
};

export default function TaskTypes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<number | null>(null);
  const [formData, setFormData] = useState<TaskTypeFormData>(INITIAL_FORM_DATA);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TaskTypeFormData, string>>>({});

  const utils = trpc.useUtils();

  // Queries
  const { data: taskTypes, isLoading } = trpc.timeTracking.taskTypes.list.useQuery();

  // Mutations
  const createMutation = trpc.timeTracking.taskTypes.create.useMutation({
    onSuccess: () => {
      utils.timeTracking.taskTypes.list.invalidate();
      toast.success("Type de tâche créé avec succès");
      closeModal();
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du type de tâche");
      console.error(error);
    },
  });

  const updateMutation = trpc.timeTracking.taskTypes.update.useMutation({
    onSuccess: () => {
      utils.timeTracking.taskTypes.list.invalidate();
      toast.success("Type de tâche modifié avec succès");
      closeModal();
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification du type de tâche");
      console.error(error);
    },
  });

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof TaskTypeFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "Le nom est requis";
    }

    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
      errors.hourlyRate = "Le taux horaire doit être supérieur à 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Modal handlers
  const openCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingTaskType(null);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (taskType: any) => {
    setFormData({
      name: taskType.name,
      description: taskType.description || "",
      hourlyRate: taskType.hourlyRate,
      category: taskType.category,
      color: taskType.color || "#3B82F6",
      sortOrder: taskType.sortOrder,
    });
    setEditingTaskType(taskType.id);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setEditingTaskType(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (editingTaskType) {
      updateMutation.mutate({
        id: editingTaskType,
        data: {
          name: formData.name,
          description: formData.description,
          hourlyRate: formData.hourlyRate,
          category: formData.category,
          color: formData.color,
          sortOrder: formData.sortOrder,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description,
        hourlyRate: formData.hourlyRate,
        category: formData.category,
        color: formData.color,
        sortOrder: formData.sortOrder,
      });
    }
  };

  const handleDelete = (id: number) => {
    updateMutation.mutate({
      id,
      data: { isActive: false },
    });
    setDeleteConfirmId(null);
  };

  return (
    <div className="pt-2 pb-4 px-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Types de Tâches</h1>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un Type de Tâche
        </Button>
      </div>

      {/* Task Types Table */}
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-base">Liste des Types de Tâches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Chargement...</div>
          ) : !taskTypes || taskTypes.length === 0 ? (
            <div className="text-center py-6">
              <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aucun type de tâche</p>
              <Button onClick={openCreateModal} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier type de tâche
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Taux Horaire</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Couleur</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskTypes.map((taskType) => (
                  <TableRow key={taskType.id}>
                    <TableCell className="font-medium">{taskType.name}</TableCell>
                    <TableCell>{taskType.hourlyRate} €/h</TableCell>
                    <TableCell>
                      <Badge
                        variant={taskType.category === "billable" ? "default" : "secondary"}
                      >
                        {taskType.category === "billable" ? "Facturable" : "Non facturable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: taskType.color || "#3B82F6" }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {taskType.color || "#3B82F6"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={taskType.isActive ? "default" : "outline"}>
                        {taskType.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(taskType)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(taskType.id)}
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

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTaskType ? "Modifier le Type de Tâche" : "Créer un Type de Tâche"}
            </DialogTitle>
            <DialogDescription>
              Définissez les informations du type de tâche pour le suivi du temps.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Enregistrement"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">
                  Taux Horaire (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="ex: 50.00"
                />
                {formErrors.hourlyRate && (
                  <p className="text-sm text-red-500">{formErrors.hourlyRate}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du type de tâche..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "billable" | "non-billable") =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="billable">Facturable</SelectItem>
                    <SelectItem value="non-billable">Non facturable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordre</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTaskType ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver le type de tâche</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir désactiver ce type de tâche ? Il ne sera plus disponible
              pour de nouvelles entrées de temps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

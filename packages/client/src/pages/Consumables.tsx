import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Boxes, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function Consumables() {
  const utils = trpc.useUtils();
  const { data: consumables, isLoading } = trpc.consumables.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    quantity: "0",
    unit: "",
    threshold: "",
    notes: "",
  });

  const createMutation = trpc.consumables.create.useMutation({
    onSuccess: () => {
      toast.success("Consommable créé avec succès");
      setDialogOpen(false);
      setForm({ name: "", quantity: "0", unit: "", threshold: "", notes: "" });
      utils.consumables.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const updateMutation = trpc.consumables.update.useMutation({
    onSuccess: () => utils.consumables.list.invalidate(),
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const deleteMutation = trpc.consumables.delete.useMutation({
    onSuccess: () => {
      toast.success("Consommable supprimé");
      setDeleteId(null);
      utils.consumables.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const isLowStock = (quantity: string, threshold: string | null) =>
    threshold != null && parseFloat(quantity) <= parseFloat(threshold);

  const adjustQuantity = (id: number, current: string, delta: number) => {
    const next = Math.max(0, parseFloat(current) + delta);
    updateMutation.mutate({ id, quantity: String(next) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Le nom est requis");
    createMutation.mutate({
      name: form.name,
      quantity: form.quantity || "0",
      unit: form.unit || undefined,
      threshold: form.threshold || undefined,
      notes: form.notes || undefined,
    });
  };

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
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Boxes className="h-8 w-8 text-primary" />
              Consommables
            </h2>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau consommable
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{consumables?.length || 0} article(s)</CardTitle>
            <CardDescription className="text-sm">
              Inventaire des fournitures et consommables
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : consumables && consumables.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Seuil</TableHead>
                      <TableHead>État</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumables.map((item) => {
                      const low = isLowStock(item.quantity, item.threshold);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => adjustQuantity(item.id, item.quantity, -1)}
                                disabled={updateMutation.isPending}
                              >
                                -
                              </Button>
                              <span className="w-10 text-center font-semibold">
                                {parseFloat(item.quantity)}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => adjustQuantity(item.id, item.quantity, 1)}
                                disabled={updateMutation.isPending}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{item.unit || "-"}</TableCell>
                          <TableCell>{item.threshold ? parseFloat(item.threshold) : "-"}</TableCell>
                          <TableCell>
                            {low ? (
                              <Badge variant="destructive">Stock bas</Badge>
                            ) : (
                              <Badge variant="outline">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <Boxes className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">Aucun consommable</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Ajoutez votre premier article d'inventaire
                </p>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau consommable
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Nouveau consommable</DialogTitle>
              <DialogDescription>Ajouter un article à l'inventaire.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Câble XLR"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité</Label>
                  <Input
                    id="unit"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="pcs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Seuil</Label>
                  <Input
                    id="threshold"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

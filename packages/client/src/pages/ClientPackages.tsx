import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatCurrency } from "@/lib/currency";
import { ArrowLeft, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Actif", variant: "default" },
  expired: { label: "Expiré", variant: "outline" },
  consumed: { label: "Épuisé", variant: "secondary" },
};

export function ClientPackages() {
  const utils = trpc.useUtils();
  const { data: packages, isLoading } = trpc.clientPackages.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    name: "",
    totalHours: "",
    price: "",
    validUntil: "",
    notes: "",
  });

  const createMutation = trpc.clientPackages.create.useMutation({
    onSuccess: () => {
      toast.success("Forfait créé avec succès");
      setDialogOpen(false);
      setForm({ clientId: "", name: "", totalHours: "", price: "", validUntil: "", notes: "" });
      utils.clientPackages.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const updateMutation = trpc.clientPackages.update.useMutation({
    onSuccess: () => utils.clientPackages.list.invalidate(),
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const deleteMutation = trpc.clientPackages.delete.useMutation({
    onSuccess: () => {
      toast.success("Forfait supprimé");
      setDeleteId(null);
      utils.clientPackages.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const clientName = (id: number) => clients?.find((c) => c.id === id)?.name || `#${id}`;

  const progressPct = (used: string, total: string | null) => {
    const t = total ? parseFloat(total) : 0;
    if (!t) return 0;
    return Math.min(100, Math.round((parseFloat(used) / t) * 100));
  };

  const logHour = (id: number, used: string) => {
    updateMutation.mutate({ id, usedHours: String(parseFloat(used) + 1) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) return toast.error("Le client est requis");
    if (!form.name.trim()) return toast.error("Le nom est requis");
    createMutation.mutate({
      clientId: Number(form.clientId),
      name: form.name,
      totalHours: form.totalHours || undefined,
      price: form.price || undefined,
      validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
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
              <Package className="h-8 w-8 text-primary" />
              Forfaits
            </h2>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau forfait
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{packages?.length || 0} forfait(s)</CardTitle>
            <CardDescription className="text-sm">
              Forfaits d'heures prépayées par client
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : packages && packages.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Heures</TableHead>
                      <TableHead className="w-[160px]">Consommation</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => {
                      const s = STATUS_LABELS[pkg.status] || {
                        label: pkg.status,
                        variant: "outline" as const,
                      };
                      const used = parseFloat(pkg.usedHours);
                      const total = pkg.totalHours ? parseFloat(pkg.totalHours) : 0;
                      return (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell>{clientName(pkg.clientId)}</TableCell>
                          <TableCell>
                            {used} / {total || "-"}
                          </TableCell>
                          <TableCell>
                            <Progress value={progressPct(pkg.usedHours, pkg.totalHours)} />
                          </TableCell>
                          <TableCell>{pkg.price ? formatCurrency(pkg.price) : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={s.variant}>{s.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => logHour(pkg.id, pkg.usedHours)}
                                disabled={updateMutation.isPending}
                                title="Ajouter 1 heure consommée"
                              >
                                +1h
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteId(pkg.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">Aucun forfait</h3>
                <p className="text-sm text-muted-foreground mb-3">Créez votre premier forfait</p>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau forfait
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
              <DialogTitle>Nouveau forfait</DialogTitle>
              <DialogDescription>Créer un forfait d'heures pour un client.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm({ ...form, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Forfait 10h studio"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalHours">Heures totales</Label>
                  <Input
                    id="totalHours"
                    value={form.totalHours}
                    onChange={(e) => setForm({ ...form, totalHours: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prix</Label>
                  <Input
                    id="price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="500.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valide jusqu'au</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                />
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
            <AlertDialogTitle>Supprimer ce forfait ?</AlertDialogTitle>
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

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
import { ArrowLeft, Plus, Receipt, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export function CreditNotes() {
  const utils = trpc.useUtils();
  const { data: creditNotes, isLoading } = trpc.creditNotes.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ clientId: "", amount: "", reason: "" });

  const createMutation = trpc.creditNotes.create.useMutation({
    onSuccess: () => {
      toast.success("Avoir créé avec succès");
      setDialogOpen(false);
      setForm({ clientId: "", amount: "", reason: "" });
      utils.creditNotes.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const deleteMutation = trpc.creditNotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Avoir supprimé");
      setDeleteId(null);
      utils.creditNotes.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const clientName = (id: number) => clients?.find((c) => c.id === id)?.name || `#${id}`;

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      issued: { label: "Émis", variant: "default" },
      applied: { label: "Appliqué", variant: "secondary" },
      cancelled: { label: "Annulé", variant: "outline" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) return toast.error("Le client est requis");
    if (!form.amount) return toast.error("Le montant est requis");
    createMutation.mutate({
      clientId: Number(form.clientId),
      amount: form.amount,
      reason: form.reason || undefined,
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
              <Receipt className="h-8 w-8 text-primary" />
              Avoirs
            </h2>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel avoir
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{creditNotes?.length || 0} avoir(s)</CardTitle>
            <CardDescription className="text-sm">
              Notes de crédit émises aux clients
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : creditNotes && creditNotes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditNotes.map((cn) => (
                      <TableRow key={cn.id}>
                        <TableCell className="font-medium">{cn.creditNoteNumber}</TableCell>
                        <TableCell>{clientName(cn.clientId)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(cn.amount)}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{cn.reason || "-"}</TableCell>
                        <TableCell>{statusBadge(cn.status)}</TableCell>
                        <TableCell>
                          {cn.createdAt
                            ? format(new Date(cn.createdAt), "dd MMM yyyy", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(cn.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">Aucun avoir</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Créez votre premier avoir client
                </p>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel avoir
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog création */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Nouvel avoir</DialogTitle>
              <DialogDescription>
                Le numéro AV-AAAA-NNNN est généré automatiquement.
              </DialogDescription>
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
                <Label htmlFor="amount">
                  Montant <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="150.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motif</Label>
                <Textarea
                  id="reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Motif de l'avoir"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Création..." : "Créer l'avoir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet avoir ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
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

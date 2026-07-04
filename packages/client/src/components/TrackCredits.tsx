import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { AlertTriangle, Copyright, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TrackCreditsProps {
  trackId: number;
}

export function TrackCredits({ trackId }: TrackCreditsProps) {
  const utils = trpc.useUtils();
  const { data: credits, isLoading } = trpc.trackCredits.listByTrack.useQuery({ trackId });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    role: "",
    creditName: "",
    isPrimary: false,
    splitPercent: "",
  });

  const invalidate = () => utils.trackCredits.listByTrack.invalidate({ trackId });

  const createMutation = trpc.trackCredits.create.useMutation({
    onSuccess: () => {
      toast.success("Crédit ajouté");
      setDialogOpen(false);
      setForm({ role: "", creditName: "", isPrimary: false, splitPercent: "" });
      invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const updateMutation = trpc.trackCredits.update.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const deleteMutation = trpc.trackCredits.delete.useMutation({
    onSuccess: () => {
      toast.success("Crédit supprimé");
      setDeleteId(null);
      invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const totalSplit = (credits || []).reduce(
    (sum, c) => sum + (c.splitPercent ? parseFloat(c.splitPercent) : 0),
    0
  );
  const splitOk = Math.abs(totalSplit - 100) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim()) return toast.error("Le rôle est requis");
    if (!form.creditName.trim()) return toast.error("Le nom crédité est requis");
    createMutation.mutate({
      trackId,
      role: form.role,
      creditName: form.creditName,
      isPrimary: form.isPrimary,
      splitPercent: form.splitPercent || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Copyright className="h-5 w-5" />
              <CardTitle>Crédits & splits</CardTitle>
            </div>
            <CardDescription>Crédits et répartition des royalties</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : credits && credits.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom crédité</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead className="w-[120px]">Split (%)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.creditName}</TableCell>
                      <TableCell>{c.role}</TableCell>
                      <TableCell>
                        {c.isPrimary ? <Badge>Principal</Badge> : <Badge variant="outline">—</Badge>}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue={c.splitPercent ?? ""}
                          className="h-8"
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== (c.splitPercent ?? "")) {
                              updateMutation.mutate({ id: c.id, splitPercent: val || undefined });
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">Total des splits</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${splitOk ? "" : "text-destructive"}`}>
                  {totalSplit.toFixed(2)} %
                </span>
                {!splitOk && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    ≠ 100 %
                  </Badge>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Copyright className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun crédit pour cette piste</p>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Nouveau crédit</DialogTitle>
              <DialogDescription>Ajouter un crédit ou un split de royalties.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="creditName">
                  Nom crédité <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="creditName"
                  value={form.creditName}
                  onChange={(e) => setForm({ ...form, creditName: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Rôle <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="producer, vocals..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="splitPercent">Split (%)</Label>
                  <Input
                    id="splitPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.splitPercent}
                    onChange={(e) => setForm({ ...form, splitPercent: e.target.value })}
                    placeholder="25.00"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPrimary"
                  checked={form.isPrimary}
                  onCheckedChange={(v) => setForm({ ...form, isPrimary: v })}
                />
                <Label htmlFor="isPrimary">Crédit principal</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce crédit ?</AlertDialogTitle>
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
    </Card>
  );
}

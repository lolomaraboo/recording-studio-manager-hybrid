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
import { ArrowLeft, CalendarOff, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const SUBJECT_LABELS: Record<string, string> = {
  staff: "Équipe",
  talent: "Talent",
};

const KIND_LABELS: Record<string, string> = {
  unavailable: "Indisponible",
  vacation: "Congés",
};

type SubjectType = "staff" | "talent";
type Kind = "unavailable" | "vacation";

export function Availability() {
  const utils = trpc.useUtils();
  const { data: windows, isLoading } = trpc.availability.list.useQuery();
  const { data: talents } = trpc.musicians.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    subjectType: "talent" as SubjectType,
    subjectId: "",
    startTime: "",
    endTime: "",
    kind: "unavailable" as Kind,
    notes: "",
  });

  const createMutation = trpc.availability.create.useMutation({
    onSuccess: () => {
      toast.success("Indisponibilité créée avec succès");
      setDialogOpen(false);
      setForm({ subjectType: "talent", subjectId: "", startTime: "", endTime: "", kind: "unavailable", notes: "" });
      utils.availability.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const updateMutation = trpc.availability.update.useMutation({
    onSuccess: () => utils.availability.list.invalidate(),
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const deleteMutation = trpc.availability.delete.useMutation({
    onSuccess: () => {
      toast.success("Indisponibilité supprimée");
      setDeleteId(null);
      utils.availability.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur: ${e.message}`),
  });

  const subjectLabel = (subjectType: string, subjectId: number) => {
    if (subjectType === "talent") {
      const t = talents?.find((m: any) => m.id === subjectId);
      if (t) return t.name;
    }
    return `#${subjectId}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) return toast.error("Le sujet est requis");
    if (!form.startTime || !form.endTime) return toast.error("Les dates sont requises");
    createMutation.mutate({
      subjectType: form.subjectType,
      subjectId: Number(form.subjectId),
      startTime: new Date(form.startTime),
      endTime: new Date(form.endTime),
      kind: form.kind,
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
              <CalendarOff className="h-8 w-8 text-primary" />
              Disponibilités
            </h2>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle indispo
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{windows?.length || 0} indisponibilité(s)</CardTitle>
            <CardDescription className="text-sm">
              Indisponibilités et congés de l'équipe et des talents
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : windows && windows.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Sujet</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Nature</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {windows.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>
                          <Badge variant="outline">{SUBJECT_LABELS[w.subjectType] || w.subjectType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{subjectLabel(w.subjectType, w.subjectId)}</TableCell>
                        <TableCell>
                          {format(new Date(w.startTime), "dd MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(w.endTime), "dd MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={w.kind}
                            onValueChange={(v) => updateMutation.mutate({ id: w.id, kind: v as Kind })}
                          >
                            <SelectTrigger className="h-8 w-[140px]">
                              <SelectValue>{KIND_LABELS[w.kind] || w.kind}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(KIND_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(w.id)}>
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
                <CalendarOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">Aucune indisponibilité</h3>
                <p className="text-sm text-muted-foreground mb-3">Déclarez une indisponibilité</p>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle indispo
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
              <DialogTitle>Nouvelle indisponibilité</DialogTitle>
              <DialogDescription>Déclarer une indisponibilité ou des congés.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de sujet</Label>
                  <Select
                    value={form.subjectType}
                    onValueChange={(v) => setForm({ ...form, subjectType: v as SubjectType, subjectId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="talent">Talent</SelectItem>
                      <SelectItem value="staff">Équipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Sujet <span className="text-destructive">*</span>
                  </Label>
                  {form.subjectType === "talent" ? (
                    <Select
                      value={form.subjectId}
                      onValueChange={(v) => setForm({ ...form, subjectId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un talent" />
                      </SelectTrigger>
                      <SelectContent>
                        {talents?.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={form.subjectId}
                      onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                      placeholder="ID membre équipe"
                      type="number"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    Début <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">
                    Fin <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nature</Label>
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm({ ...form, kind: v as Kind })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unavailable">Indisponible</SelectItem>
                    <SelectItem value="vacation">Congés</SelectItem>
                  </SelectContent>
                </Select>
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
            <AlertDialogTitle>Supprimer cette indisponibilité ?</AlertDialogTitle>
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

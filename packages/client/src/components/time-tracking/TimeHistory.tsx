import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { trpc } from "@/lib/trpc";
import { socket } from "@/socket";
import { Clock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface TimeHistoryProps {
  sessionId?: number;
  projectId?: number;
  trackId?: number;
}

interface AdjustmentFormData {
  startTime: string;
  endTime: string;
  notes?: string;
}

export function TimeHistory({ sessionId, projectId, trackId }: TimeHistoryProps) {
  const [adjustingEntryId, setAdjustingEntryId] = useState<number | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormData>({
    startTime: "",
    endTime: "",
    notes: "",
  });
  const dateRange = undefined;
  const taskTypeIds: number[] = [];

  const utils = trpc.useUtils();

  // Queries
  const { data: timeEntriesData, isLoading } = trpc.timeTracking.timeEntries.list.useQuery({
    sessionId,
    projectId,
    trackId,
    dateRange,
    taskTypeIds: taskTypeIds.length > 0 ? taskTypeIds : undefined,
  });

  const timeEntries = timeEntriesData?.entries || [];

  // Mutations
  const adjustMutation = trpc.timeTracking.timeEntries.adjust.useMutation({
    onSuccess: () => {
      utils.timeTracking.timeEntries.list.invalidate();
      toast.success("Entrée de temps ajustée avec succès");
      closeAdjustmentModal();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajustement");
      console.error(error);
    },
  });

  // Socket.IO real-time updates
  useEffect(() => {
    const handleTimerAdjusted = () => {
      utils.timeTracking.timeEntries.list.invalidate();
    };

    socket.on("timer:adjusted", handleTimerAdjusted);

    return () => {
      socket.off("timer:adjusted", handleTimerAdjusted);
    };
  }, [utils]);

  // Format duration as "Xh Ym" or "Ym"
  const formatDuration = (minutes: number): string => {
    if (minutes < 1) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Calculate cost
  const calculateCost = (durationMinutes: number, hourlyRate: string): string => {
    const rate = parseFloat(hourlyRate);
    const cost = (durationMinutes * rate) / 60;
    return cost.toFixed(2);
  };

  // Format datetime for input
  const formatDatetimeLocal = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Open adjustment modal
  const openAdjustmentModal = (entry: any) => {
    setAdjustmentForm({
      startTime: formatDatetimeLocal(new Date(entry.startTime)),
      endTime: entry.endTime ? formatDatetimeLocal(new Date(entry.endTime)) : "",
      notes: entry.notes || "",
    });
    setAdjustingEntryId(entry.id);
  };

  // Close adjustment modal
  const closeAdjustmentModal = () => {
    setAdjustingEntryId(null);
    setAdjustmentForm({ startTime: "", endTime: "", notes: "" });
  };

  // Submit adjustment
  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!adjustingEntryId) return;

    adjustMutation.mutate({
      timeEntryId: adjustingEntryId,
      startTime: new Date(adjustmentForm.startTime).toISOString(),
      endTime: adjustmentForm.endTime ? new Date(adjustmentForm.endTime).toISOString() : undefined,
      notes: adjustmentForm.notes,
    });
  };

  return (
    <>
      <Card className="pb-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Historique des Temps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Chargement...</div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aucune entrée de temps</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type de Tâche</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: entry.taskType.color || "#3B82F6" }}
                        />
                        <span className="font-medium">{entry.taskType.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(entry.startTime), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {entry.endTime
                        ? format(new Date(entry.endTime), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDuration(entry.durationMinutes || 0)}
                        {entry.manuallyAdjusted && (
                          <Badge variant="outline" className="text-xs">
                            Ajusté
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {calculateCost(
                        entry.durationMinutes || 0,
                        entry.hourlyRateSnapshot
                      )}{" "}
                      €
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAdjustmentModal(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Modal */}
      <Dialog
        open={!!adjustingEntryId}
        onOpenChange={(open) => !open && closeAdjustmentModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster l'Entrée de Temps</DialogTitle>
            <DialogDescription>
              Modifiez les heures de début et de fin, ou ajoutez des notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={adjustmentForm.startTime}
                onChange={(e) =>
                  setAdjustmentForm({ ...adjustmentForm, startTime: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={adjustmentForm.endTime}
                onChange={(e) =>
                  setAdjustmentForm({ ...adjustmentForm, endTime: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={adjustmentForm.notes}
                onChange={(e) =>
                  setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })
                }
                placeholder="Notes optionnelles..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAdjustmentModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

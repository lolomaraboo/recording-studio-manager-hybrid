import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { socket } from "@/socket";
import { Play, Square, Clock } from "lucide-react";
import { toast } from "sonner";

interface ActiveTimerProps {
  sessionId?: number;
  projectId?: number;
  trackId?: number;
}

export function ActiveTimer({ sessionId, projectId, trackId }: ActiveTimerProps) {
  const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const utils = trpc.useUtils();

  // Queries
  const { data: taskTypes } = trpc.timeTracking.taskTypes.list.useQuery();
  const { data: activeTimer } = trpc.timeTracking.timer.getActive.useQuery({
    sessionId,
    projectId,
    trackId,
  });

  // Mutations
  const startMutation = trpc.timeTracking.timer.start.useMutation({
    onSuccess: () => {
      utils.timeTracking.timer.getActive.invalidate();
      toast.success("Chronomètre démarré");
    },
    onError: (error) => {
      toast.error("Erreur lors du démarrage du chronomètre");
      console.error(error);
    },
  });

  const stopMutation = trpc.timeTracking.timer.stop.useMutation({
    onSuccess: () => {
      utils.timeTracking.timer.getActive.invalidate();
      utils.timeTracking.timeEntries.list.invalidate();
      toast.success("Chronomètre arrêté");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'arrêt du chronomètre");
      console.error(error);
    },
  });

  // Calculate elapsed time
  useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }

    // Calculate initial elapsed time
    const startTime = new Date(activeTimer.startTime).getTime();
    const now = Date.now();
    const initialElapsed = Math.floor((now - startTime) / 1000);
    setElapsedSeconds(initialElapsed);

    // Update every second
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Socket.IO real-time updates
  useEffect(() => {
    const handleTimerStarted = () => {
      utils.timeTracking.timer.getActive.invalidate();
    };

    const handleTimerStopped = () => {
      utils.timeTracking.timer.getActive.invalidate();
      utils.timeTracking.timeEntries.list.invalidate();
    };

    socket.on("timer:started", handleTimerStarted);
    socket.on("timer:stopped", handleTimerStopped);

    return () => {
      socket.off("timer:started", handleTimerStarted);
      socket.off("timer:stopped", handleTimerStopped);
    };
  }, [utils]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate estimated cost
  const calculateEstimatedCost = (): string => {
    if (!activeTimer) return "0.00";
    const elapsedMinutes = elapsedSeconds / 60;
    const hourlyRate = parseFloat(activeTimer.taskType.hourlyRate);
    const cost = (elapsedMinutes * hourlyRate) / 60;
    return cost.toFixed(2);
  };

  const handleStart = () => {
    if (!selectedTaskTypeId) {
      toast.error("Veuillez sélectionner un type de tâche");
      return;
    }

    startMutation.mutate({
      taskTypeId: selectedTaskTypeId,
      sessionId,
      projectId,
      trackId,
    });
  };

  const handleStop = () => {
    if (!activeTimer) return;
    stopMutation.mutate({ timeEntryId: activeTimer.id });
  };

  const isRunning = !!activeTimer;
  const borderColorClass = isRunning ? "border-l-green-500" : "border-l-gray-300";

  return (
    <Card className={`border-l-4 ${borderColorClass}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Chronomètre</h3>
        </div>

        {isRunning ? (
          // Active timer display
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-primary">
                {formatTime(elapsedSeconds)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTimer.taskType.name}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Taux horaire</p>
                <p className="text-sm font-semibold">{activeTimer.taskType.hourlyRate} €/h</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Coût estimé</p>
                <p className="text-lg font-semibold text-primary">
                  {calculateEstimatedCost()} €
                </p>
              </div>
            </div>

            <Button
              onClick={handleStop}
              disabled={stopMutation.isPending}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              <Square className="h-4 w-4 mr-2" />
              Arrêter
            </Button>
          </div>
        ) : (
          // Timer controls
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskType">Type de tâche</Label>
              <Select
                value={selectedTaskTypeId?.toString()}
                onValueChange={(value) => setSelectedTaskTypeId(parseInt(value))}
              >
                <SelectTrigger id="taskType">
                  <SelectValue placeholder="Sélectionner un type de tâche" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes
                    ?.filter((tt) => tt.isActive)
                    .map((taskType) => (
                      <SelectItem key={taskType.id} value={taskType.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: taskType.color || "#3B82F6" }}
                          />
                          <span>{taskType.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({taskType.hourlyRate} €/h)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleStart}
              disabled={!selectedTaskTypeId || startMutation.isPending}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <Play className="h-4 w-4 mr-2" />
              Démarrer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

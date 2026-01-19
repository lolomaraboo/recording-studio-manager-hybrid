import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Table2,
  LayoutGrid,
  CalendarDays,
  Trello,
  Clock,
  MapPin,
  Settings,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTabPreferences } from "@/hooks/useTabPreferences";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Session {
  id: number;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  roomId: number;
  clientId: number;
}

interface Room {
  id: number;
  name: string;
}

interface SessionsTabProps {
  clientId: number;
  sessions: Session[];
  rooms: Room[];
}

type ViewMode = "table" | "cards" | "timeline" | "kanban";

const ALL_COLUMNS = ["session", "salle", "date", "statut"];

const COLUMN_LABELS: Record<string, string> = {
  session: "Session",
  salle: "Salle",
  date: "Date",
  statut: "Statut",
};

// Sortable table header component
function SortableTableHeader({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className="cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        {children}
      </div>
    </TableHead>
  );
}

export function SessionsTab({ clientId, sessions, rooms }: SessionsTabProps) {
  const navigate = useNavigate();

  // Use preferences hook for database-backed state
  const { preferences, updatePreferences, resetPreferences } = useTabPreferences(
    "client-detail-sessions",
    {
      viewMode: "table",
      visibleColumns: ["session", "salle", "date", "statut"],
      columnOrder: ["session", "salle", "date", "statut"],
    }
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for column reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = preferences.columnOrder.indexOf(active.id as string);
      const newIndex = preferences.columnOrder.indexOf(over.id as string);

      const newOrder = arrayMove(preferences.columnOrder, oldIndex, newIndex);
      updatePreferences({ columnOrder: newOrder });
    }
  };

  // Room mapping
  const roomMap = useMemo(() => {
    return rooms.reduce((acc, room) => {
      acc[room.id] = room.name;
      return acc;
    }, {} as Record<number, string>);
  }, [rooms]);

  // Status badge helper
  const getSessionStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      scheduled: { variant: "outline", label: "Programmée" },
      in_progress: { variant: "default", label: "En cours", className: "bg-blue-500" },
      completed: { variant: "secondary", label: "Terminée", className: "bg-green-500 text-white" },
      cancelled: { variant: "destructive", label: "Annulée" },
    };

    const config = variants[status] || variants.scheduled;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Calculate duration
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes > 0 ? minutes : ""}`;
  };

  // Sort sessions for timeline
  const timelineSessions = useMemo(() => {
    const now = new Date();
    const past = sessions
      .filter((s) => new Date(s.startTime) < now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    const upcoming = sessions
      .filter((s) => new Date(s.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return { past, upcoming };
  }, [sessions]);

  // Group sessions by status for Kanban
  const kanbanSessions = useMemo(() => {
    const groups = {
      scheduled: [] as Session[],
      in_progress: [] as Session[],
      completed: [] as Session[],
      cancelled: [] as Session[],
    };

    sessions.forEach((session) => {
      const status = session.status as keyof typeof groups;
      if (groups[status]) {
        groups[status].push(session);
      }
    });

    return groups;
  }, [sessions]);

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="py-6 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium mb-1">Aucune session pour ce client</p>
        <Button
          className="mt-3"
          size="sm"
          onClick={() => navigate(`/sessions/new?clientId=${clientId}`)}
        >
          Créer une session
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle & Customization */}
      <div className="flex gap-2">
        <Button
          variant={preferences.viewMode === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => updatePreferences({ viewMode: "table" })}
        >
          <Table2 className="h-4 w-4 mr-2" />
          Table
        </Button>
        <Button
          variant={preferences.viewMode === "cards" ? "default" : "outline"}
          size="sm"
          onClick={() => updatePreferences({ viewMode: "cards" })}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Cards
        </Button>
        <Button
          variant={preferences.viewMode === "timeline" ? "default" : "outline"}
          size="sm"
          onClick={() => updatePreferences({ viewMode: "timeline" })}
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Timeline
        </Button>
        <Button
          variant={preferences.viewMode === "kanban" ? "default" : "outline"}
          size="sm"
          onClick={() => updatePreferences({ viewMode: "kanban" })}
        >
          <Trello className="h-4 w-4 mr-2" />
          Kanban
        </Button>

        {/* Customization Dropdown (for Table mode) */}
        {preferences.viewMode === "table" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Personnaliser
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col}
                  checked={preferences.visibleColumns.includes(col)}
                  onCheckedChange={(checked) => {
                    const updated = checked
                      ? [...preferences.visibleColumns, col]
                      : preferences.visibleColumns.filter((c) => c !== col);
                    updatePreferences({ visibleColumns: updated });
                  }}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetPreferences}>
                Réinitialiser
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table Mode */}
      {preferences.viewMode === "table" && (
        <div className="rounded-md border">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <SortableContext
                  items={preferences.columnOrder.filter((col) =>
                    preferences.visibleColumns.includes(col)
                  )}
                  strategy={horizontalListSortingStrategy}
                >
                  <TableRow>
                    {preferences.columnOrder
                      .filter((col) => preferences.visibleColumns.includes(col))
                      .map((col) => (
                        <SortableTableHeader key={col} id={col}>
                          {COLUMN_LABELS[col]}
                        </SortableTableHeader>
                      ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </SortableContext>
              </TableHeader>
              <TableBody>
                {sessions
                  .sort(
                    (a, b) =>
                      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                  )
                  .map((session) => (
                    <TableRow key={session.id}>
                      {preferences.columnOrder
                        .filter((col) => preferences.visibleColumns.includes(col))
                        .map((col) => {
                          if (col === "session") {
                            return (
                              <TableCell key={col}>
                                <div>
                                  <div className="font-medium">{session.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {calculateDuration(session.startTime, session.endTime)}
                                  </div>
                                </div>
                              </TableCell>
                            );
                          }
                          if (col === "salle") {
                            return (
                              <TableCell key={col}>
                                <div className="text-sm">{roomMap[session.roomId] || "N/A"}</div>
                              </TableCell>
                            );
                          }
                          if (col === "date") {
                            return (
                              <TableCell key={col}>
                                <div className="text-sm">
                                  {format(new Date(session.startTime), "dd MMM yyyy", {
                                    locale: fr,
                                  })}
                                </div>
                              </TableCell>
                            );
                          }
                          if (col === "statut") {
                            return (
                              <TableCell key={col}>
                                {getSessionStatusBadge(session.status)}
                              </TableCell>
                            );
                          }
                          return null;
                        })}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/sessions/${session.id}`}>Voir</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

      {/* Cards Mode */}
      {preferences.viewMode === "cards" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions
            .sort(
              (a, b) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            )
            .map((session) => (
              <Card
                key={session.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/sessions/${session.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">{session.title}</h3>
                      {getSessionStatusBadge(session.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{roomMap[session.roomId] || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(session.startTime), "dd MMM yyyy, HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{calculateDuration(session.startTime, session.endTime)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Timeline Mode */}
      {preferences.viewMode === "timeline" && (
        <div className="space-y-6">
          {timelineSessions.upcoming.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Sessions à venir ({timelineSessions.upcoming.length})
              </h3>
              <div className="space-y-3">
                {timelineSessions.upcoming.map((session) => (
                  <Card
                    key={session.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-sm font-medium text-muted-foreground">
                              {format(new Date(session.startTime), "dd MMM yyyy, HH:mm", {
                                locale: fr,
                              })}
                            </div>
                            {getSessionStatusBadge(session.status)}
                          </div>
                          <h4 className="font-semibold text-base mb-1">{session.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {roomMap[session.roomId] || "N/A"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {calculateDuration(session.startTime, session.endTime)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {timelineSessions.past.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Sessions passées ({timelineSessions.past.length})
              </h3>
              <div className="space-y-3">
                {timelineSessions.past.map((session) => (
                  <Card
                    key={session.id}
                    className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-sm font-medium text-muted-foreground">
                              {format(new Date(session.startTime), "dd MMM yyyy, HH:mm", {
                                locale: fr,
                              })}
                            </div>
                            {getSessionStatusBadge(session.status)}
                          </div>
                          <h4 className="font-semibold text-base mb-1">{session.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {roomMap[session.roomId] || "N/A"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {calculateDuration(session.startTime, session.endTime)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kanban Mode */}
      {preferences.viewMode === "kanban" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Programmée Column */}
          <div>
            <div className="mb-3 px-2 py-1 bg-muted rounded-md">
              <h3 className="font-semibold text-sm">
                Programmée ({kanbanSessions.scheduled.length})
              </h3>
            </div>
            <div className="space-y-3">
              {kanbanSessions.scheduled.map((session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <CardContent className="pt-4 pb-4">
                    <h4 className="font-semibold text-sm mb-2">{session.title}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {roomMap[session.roomId] || "N/A"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.startTime), "dd MMM yyyy", { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {calculateDuration(session.startTime, session.endTime)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* En cours Column */}
          <div>
            <div className="mb-3 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-md">
              <h3 className="font-semibold text-sm">
                En cours ({kanbanSessions.in_progress.length})
              </h3>
            </div>
            <div className="space-y-3">
              {kanbanSessions.in_progress.map((session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-blue-500"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <CardContent className="pt-4 pb-4">
                    <h4 className="font-semibold text-sm mb-2">{session.title}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {roomMap[session.roomId] || "N/A"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.startTime), "dd MMM yyyy", { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {calculateDuration(session.startTime, session.endTime)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Terminée Column */}
          <div>
            <div className="mb-3 px-2 py-1 bg-green-100 dark:bg-green-900 rounded-md">
              <h3 className="font-semibold text-sm">
                Terminée ({kanbanSessions.completed.length})
              </h3>
            </div>
            <div className="space-y-3">
              {kanbanSessions.completed.map((session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <CardContent className="pt-4 pb-4">
                    <h4 className="font-semibold text-sm mb-2">{session.title}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {roomMap[session.roomId] || "N/A"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.startTime), "dd MMM yyyy", { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {calculateDuration(session.startTime, session.endTime)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Annulée Column */}
          <div>
            <div className="mb-3 px-2 py-1 bg-red-100 dark:bg-red-900 rounded-md">
              <h3 className="font-semibold text-sm">
                Annulée ({kanbanSessions.cancelled.length})
              </h3>
            </div>
            <div className="space-y-3">
              {kanbanSessions.cancelled.map((session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-50"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <CardContent className="pt-4 pb-4">
                    <h4 className="font-semibold text-sm mb-2">{session.title}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {roomMap[session.roomId] || "N/A"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.startTime), "dd MMM yyyy", { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {calculateDuration(session.startTime, session.endTime)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

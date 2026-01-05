import { useState, useMemo, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, View, SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Link, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(BigCalendar);

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    status: string;
    clientName: string;
    roomName: string;
    type: string;
  };
}

export default function Calendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  const utils = trpc.useUtils();

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery({
    limit: 100,
  });

  const events: CalendarEvent[] = useMemo(() => {
    if (!sessions) return [];

    return sessions.map((session) => ({
      id: session.id,
      title: session.title,
      start: new Date(session.startTime),
      end: new Date(session.endTime),
      resource: {
        status: session.status,
        clientName: `Client #${session.clientId}`,
        roomName: `Salle #${session.roomId}`,
        type: "recording",
      },
    }));
  }, [sessions]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot({
      start: slotInfo.start,
      end: slotInfo.end,
    });
    setShowCreateDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    navigate(`/sessions/${event.id}`);
  }, [navigate]);

  const updateSessionMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      utils.sessions.list.invalidate();
      toast.success("Session mise à jour avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de la session");
    },
  });

  const handleEventDrop = useCallback(({ event, start, end }: any) => {
    updateSessionMutation.mutate({
      id: event.id,
      data: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
  }, [updateSessionMutation]);

  const handleEventResize = useCallback(({ event, start, end }: any) => {
    updateSessionMutation.mutate({
      id: event.id,
      data: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
  }, [updateSessionMutation]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#dc2626"; // Rouge par défaut

    switch (event.resource.status) {
      case "pending":
        backgroundColor = "#3b82f6"; // Bleu (en attente)
        break;
      case "confirmed":
        backgroundColor = "#dc2626"; // Rouge (confirmée)
        break;
      case "in_progress":
        backgroundColor = "#ea580c"; // Orange-rouge (en cours)
        break;
      case "completed":
        backgroundColor = "#16a34a"; // Vert (terminée)
        break;
      case "cancelled":
        backgroundColor = "#1f2937"; // Gris très foncé (annulée)
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  return (
    <>
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
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-8 w-8 text-primary" />
              Calendrier
            </h2>
          </div>
        </div>
          <Button asChild>
            <Link to="/sessions/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle session
            </Link>
          </Button>
      </div>

      {/* Main Content */}
      <div>
          {/* Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Légende</CardTitle>
              <CardDescription className="text-sm">Statuts des sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
                  <span className="text-sm">En attente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: "#dc2626" }}></div>
                  <span className="text-sm">Confirmée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: "#ea580c" }}></div>
                  <span className="text-sm">En cours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: "#16a34a" }}></div>
                  <span className="text-sm">Terminée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: "#1f2937" }}></div>
                  <span className="text-sm">Annulée</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                  <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="h-[600px] calendar-container">
                  <DnDCalendar
                    localizer={localizer}
                    events={events as any}
                    startAccessor={(event: any) => event.start}
                    endAccessor={(event: any) => event.end}
                    view={view}
                    onView={setView as any}
                    date={date}
                    onNavigate={setDate as any}
                    onSelectSlot={handleSelectSlot as any}
                    onSelectEvent={handleSelectEvent as any}
                    onEventDrop={handleEventDrop as any}
                    onEventResize={handleEventResize as any}
                    selectable
                    resizable
                    eventPropGetter={eventStyleGetter as any}
                    culture="fr"
                    messages={{
                      next: "Suivant",
                      previous: "Précédent",
                      today: "Aujourd'hui",
                      month: "Mois",
                      week: "Semaine",
                      day: "Jour",
                      agenda: "Agenda",
                      date: "Date",
                      time: "Heure",
                      event: "Événement",
                      noEventsInRange: "Aucune session dans cette période",
                      showMore: (total: number) => `+ ${total} session(s)`,
                    }}
                    step={30}
                    timeslots={2}
                    min={new Date(2024, 0, 1, 8, 0, 0)}
                    max={new Date(2024, 0, 1, 23, 0, 0)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
      </div>
      </div>
    </div>

    {/* Create Session Dialog */}
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une session</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  Du {format(selectedSlot.start, "dd/MM/yyyy HH:mm", { locale: fr })} au{" "}
                  {format(selectedSlot.end, "dd/MM/yyyy HH:mm", { locale: fr })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Cliquez sur le bouton ci-dessous pour créer une nouvelle session
            </p>
            <Button asChild>
              <Link to="/sessions/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer une session
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Calendar Styles */}
      <style>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
          color: hsl(var(--foreground));
        }

        .calendar-container .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          color: hsl(var(--foreground));
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.3);
        }

        .calendar-container .rbc-today {
          background-color: hsl(var(--primary) / 0.1);
        }

        .calendar-container .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.2);
        }

        .calendar-container .rbc-time-slot {
          border-top: 1px solid hsl(var(--border) / 0.5);
          color: hsl(var(--muted-foreground));
        }

        .calendar-container .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid hsl(var(--border) / 0.5);
        }

        .calendar-container .rbc-timeslot-group {
          border-left: 1px solid hsl(var(--border));
        }

        .calendar-container .rbc-time-content {
          border-top: 1px solid hsl(var(--border));
        }

        .calendar-container .rbc-event {
          padding: 4px 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .calendar-container .rbc-event:hover {
          opacity: 1 !important;
        }

        .calendar-container .rbc-toolbar button {
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          background: transparent;
          padding: 6px 12px;
          border-radius: 6px;
        }

        .calendar-container .rbc-toolbar button:hover {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }

        .calendar-container .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }

        .calendar-container .rbc-toolbar button.rbc-active:hover {
          background: hsl(var(--primary) / 0.9);
        }
      `}</style>
    </>
  );
}

/**
 * Calendar Page
 *
 * Full-screen calendar view with drag & drop support for sessions.
 */

import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
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
  };
}

export default function Calendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  const utils = trpc.useUtils();

  const { data: sessionsData, isLoading } = trpc.sessions.list.useQuery({ limit: 1000 });

  const events: CalendarEvent[] = useMemo(() => {
    if (!sessionsData) return [];

    return sessionsData.map((session) => ({
      id: session.id,
      title: session.title,
      start: new Date(session.startTime),
      end: new Date(session.endTime),
      resource: {
        status: session.status,
        clientName: "Client",
        roomName: "Salle",
      },
    }));
  }, [sessionsData]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot({
      start: slotInfo.start,
      end: slotInfo.end,
    });
    setShowCreateDialog(true);
  }, []);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      navigate(`/sessions/${event.id}`);
    },
    [navigate]
  );

  const updateSessionMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      utils.sessions.list.invalidate();
      toast.success("Session mise a jour avec succes");
    },
    onError: () => {
      toast.error("Erreur lors de la mise a jour de la session");
    },
  });

  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      updateSessionMutation.mutate({
        id: event.id,
        data: {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
    },
    [updateSessionMutation]
  );

  const handleEventResize = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      updateSessionMutation.mutate({
        id: event.id,
        data: {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
    },
    [updateSessionMutation]
  );

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#dc2626"; // Red by default

    switch (event.resource.status) {
      case "confirmed":
        backgroundColor = "#dc2626"; // Red
        break;
      case "in_progress":
        backgroundColor = "#ea580c"; // Orange-red
        break;
      case "completed":
        backgroundColor = "#525252"; // Gray
        break;
      case "cancelled":
        backgroundColor = "#404040"; // Dark gray
        break;
      case "pending":
        backgroundColor = "#737373"; // Medium gray
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
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Calendrier</h1>
              </div>
            </div>
            <Button asChild>
              <Link to="/sessions/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle session
              </Link>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8">
          <div className="space-y-6">
            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legende</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: "#737373" }}></div>
                    <span className="text-sm">En attente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: "#dc2626" }}></div>
                    <span className="text-sm">Confirmee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: "#ea580c" }}></div>
                    <span className="text-sm">En cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: "#525252" }}></div>
                    <span className="text-sm">Terminee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: "#404040" }}></div>
                    <span className="text-sm">Annulee</span>
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
                      events={events as unknown[]}
                      startAccessor={(event: unknown) => (event as CalendarEvent).start}
                      endAccessor={(event: unknown) => (event as CalendarEvent).end}
                      view={view}
                      onView={setView as (view: View) => void}
                      date={date}
                      onNavigate={setDate}
                      onSelectSlot={handleSelectSlot}
                      onSelectEvent={(event) => handleSelectEvent(event as CalendarEvent)}
                      onEventDrop={(args) =>
                        handleEventDrop(args as { event: CalendarEvent; start: Date; end: Date })
                      }
                      onEventResize={(args) =>
                        handleEventResize(args as { event: CalendarEvent; start: Date; end: Date })
                      }
                      selectable
                      resizable
                      eventPropGetter={(event) => eventStyleGetter(event as CalendarEvent)}
                      culture="fr"
                      messages={{
                        next: "Suivant",
                        previous: "Precedent",
                        today: "Aujourd'hui",
                        month: "Mois",
                        week: "Semaine",
                        day: "Jour",
                        agenda: "Agenda",
                        date: "Date",
                        time: "Heure",
                        event: "Evenement",
                        noEventsInRange: "Aucune session dans cette periode",
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
        </main>

        {/* Create Session Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Creer une session</DialogTitle>
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
                Cliquez sur le bouton ci-dessous pour creer une nouvelle session
              </p>
              <Button asChild>
                <Link to="/sessions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Creer une session
                </Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Custom Calendar Styles */}
        <style>{`
          .calendar-container .rbc-calendar {
            font-family: inherit;
          }

          .calendar-container .rbc-header {
            padding: 12px 4px;
            font-weight: 600;
            border-bottom: 1px solid rgb(255 255 255 / 0.1);
            background: rgb(255 255 255 / 0.02);
          }

          .calendar-container .rbc-today {
            background-color: rgb(220 38 38 / 0.1);
          }

          .calendar-container .rbc-off-range-bg {
            background-color: rgb(255 255 255 / 0.02);
          }

          .calendar-container .rbc-time-slot {
            border-top: 1px solid rgb(255 255 255 / 0.05);
          }

          .calendar-container .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid rgb(255 255 255 / 0.05);
          }

          .calendar-container .rbc-timeslot-group {
            border-left: 1px solid rgb(255 255 255 / 0.1);
          }

          .calendar-container .rbc-time-content {
            border-top: 1px solid rgb(255 255 255 / 0.1);
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
            color: rgb(255 255 255 / 0.7);
            border: 1px solid rgb(255 255 255 / 0.1);
            background: transparent;
            padding: 6px 12px;
            border-radius: 6px;
          }

          .calendar-container .rbc-toolbar button:hover {
            background: rgb(255 255 255 / 0.05);
            color: rgb(255 255 255 / 0.9);
          }

          .calendar-container .rbc-toolbar button.rbc-active {
            background: rgb(220 38 38);
            color: white;
            border-color: rgb(220 38 38);
          }

          .calendar-container .rbc-toolbar button.rbc-active:hover {
            background: rgb(185 28 28);
          }
        `}</style>
      </div>
    </AppLayout>
  );
}

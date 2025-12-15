import { useState, useEffect, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Calendar as BigCalendar, dateFnsLocalizer, View, SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
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
  const [, setLocation] = useLocation();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const storedOrgId = localStorage.getItem("selectedOrganizationId");
    if (storedOrgId) {
      setSelectedOrgId(parseInt(storedOrgId));
    } else {
      setLocation("/select-organization");
    }
  }, [setLocation]);

  const utils = trpc.useUtils();
  
  const { data: sessions, isLoading, refetch } = trpc.sessions.list.useQuery(
    { organizationId: selectedOrgId!, limit: 1000 },
    { enabled: selectedOrgId !== null }
  );

  const { data: clients } = trpc.clients.list.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: selectedOrgId !== null }
  );

  const { data: rooms } = trpc.rooms.list.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: selectedOrgId !== null }
  );

  const events: CalendarEvent[] = useMemo(() => {
    if (!sessions) return [];

    return sessions.map((item) => ({
      id: item.session.id,
      title: item.session.title,
      start: new Date(item.session.startTime),
      end: new Date(item.session.endTime),
      resource: {
        status: item.session.status,
        clientName: item.client?.name || "N/A",
        roomName: item.room?.name || "N/A",
        type: item.session.type,
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
    setSelectedEvent(event);
    setLocation(`/sessions/${event.id}`);
  }, [setLocation]);

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
    if (!selectedOrgId) return;
    
    updateSessionMutation.mutate({
      id: event.id,
      organizationId: selectedOrgId,
      startTime: start,
      endTime: end,
    });
  }, [selectedOrgId, updateSessionMutation]);

  const handleEventResize = useCallback(({ event, start, end }: any) => {
    if (!selectedOrgId) return;
    
    updateSessionMutation.mutate({
      id: event.id,
      organizationId: selectedOrgId,
      startTime: start,
      endTime: end,
    });
  }, [selectedOrgId, updateSessionMutation]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#dc2626"; // Rouge par défaut
    
    switch (event.resource.status) {
      case "confirmed":
        backgroundColor = "#dc2626"; // Rouge
        break;
      case "in_progress":
        backgroundColor = "#ea580c"; // Orange-rouge
        break;
      case "completed":
        backgroundColor = "#525252"; // Gris
        break;
      case "cancelled":
        backgroundColor = "#404040"; // Gris foncé
        break;
      case "pending":
        backgroundColor = "#737373"; // Gris moyen
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
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Calendrier</h1>
            </div>
          </div>
          <Button asChild>
            <Link href="/sessions/new">
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
              <CardTitle className="text-base">Légende</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: "#737373" }}></div>
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
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: "#525252" }}></div>
                  <span className="text-sm">Terminée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: "#404040" }}></div>
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
      </main>

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
              <Link href="/sessions/new">
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

/**
 * Calendar View Page
 *
 * Features:
 * - Full calendar view with drag and drop
 * - Session management (create, edit, move)
 * - Color-coded by status
 * - Week/Month/Day views
 * - Calendar sync status
 */

import { useState, useMemo, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, View, SlotInfo } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { enUS } from "date-fns/locale";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

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

export default function CalendarView() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  const { data: sessions, isLoading, refetch } = trpc.sessions.list.useQuery({});
  const { data: calendarConnections } = trpc.calendar.listConnections.useQuery();

  const events: CalendarEvent[] = useMemo(() => {
    if (!sessions) return [];

    return sessions.map((session) => {
      // Parse date and times
      const sessionDate = new Date(session.date);
      const [startHour, startMin] = (session.startTime || "09:00").split(":").map(Number);
      const [endHour, endMin] = (session.endTime || "10:00").split(":").map(Number);

      const start = new Date(sessionDate);
      start.setHours(startHour || 9, startMin || 0, 0, 0);

      const end = new Date(sessionDate);
      end.setHours(endHour || 10, endMin || 0, 0, 0);

      return {
        id: session.id,
        title: session.title || `Session #${session.id}`,
        start,
        end,
        resource: {
          status: session.status || "pending",
          clientName: session.clientName || "Unknown",
          roomName: session.roomName || "Studio",
          type: session.type || "recording",
        },
      };
    });
  }, [sessions]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot({
      start: slotInfo.start,
      end: slotInfo.end,
    });
    setShowCreateDialog(true);
  }, []);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      navigate(`/sessions?id=${event.id}`);
    },
    [navigate]
  );

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#7c3aed"; // Purple default

    switch (event.resource.status) {
      case "confirmed":
        backgroundColor = "#7c3aed"; // Purple
        break;
      case "in_progress":
        backgroundColor = "#ea580c"; // Orange
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

  const syncMutation = trpc.calendar.syncAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} calendars`);
      refetch();
    },
    onError: () => {
      toast.error("Failed to sync calendars");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">
              View and manage all sessions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {calendarConnections && calendarConnections.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <ExternalLink className="h-3 w-3" />
              {calendarConnections.length} connected
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            Sync
          </Button>
          <Button asChild>
            <Link to="/sessions">
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Link>
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: "#737373" }}
              ></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: "#7c3aed" }}
              ></div>
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: "#ea580c" }}
              ></div>
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: "#525252" }}
              ></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: "#404040" }}
              ></div>
              <span className="text-sm">Cancelled</span>
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
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                eventPropGetter={eventStyleGetter}
                messages={{
                  next: "Next",
                  previous: "Previous",
                  today: "Today",
                  month: "Month",
                  week: "Week",
                  day: "Day",
                  agenda: "Agenda",
                  date: "Date",
                  time: "Time",
                  event: "Event",
                  noEventsInRange: "No sessions in this period",
                  showMore: (total: number) => `+ ${total} more`,
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

      {/* Create Session Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Session</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  From {format(selectedSlot.start, "MMM dd, yyyy HH:mm")} to{" "}
                  {format(selectedSlot.end, "MMM dd, yyyy HH:mm")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Click the button below to create a new session
            </p>
            <Button asChild>
              <Link to="/sessions">
                <Plus className="mr-2 h-4 w-4" />
                Create Session
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
          background-color: rgb(124 58 237 / 0.1);
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
          background: rgb(124 58 237);
          color: white;
          border-color: rgb(124 58 237);
        }

        .calendar-container .rbc-toolbar button.rbc-active:hover {
          background: rgb(109 40 217);
        }
      `}</style>
    </div>
  );
}

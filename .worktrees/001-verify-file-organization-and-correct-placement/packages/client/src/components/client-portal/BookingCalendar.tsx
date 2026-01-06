import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    roomName: string;
    status: string;
    paymentStatus: string;
  };
}

interface BookingCalendarProps {
  bookings: Array<{
    id: number;
    title: string;
    startTime: string | Date;
    endTime: string | Date;
    room?: {
      name: string;
    };
    status: string;
    paymentStatus?: string;
  }>;
}

/**
 * BookingCalendar Component
 *
 * Interactive calendar view of client bookings using react-big-calendar
 *
 * Features:
 * - Month/Week/Day/Agenda views
 * - Click event to navigate to booking details
 * - Color-coded by status
 */
export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const navigate = useNavigate();

  // Transform bookings to calendar events
  const events: BookingEvent[] = bookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    start: typeof booking.startTime === 'string' ? new Date(booking.startTime) : booking.startTime,
    end: typeof booking.endTime === 'string' ? new Date(booking.endTime) : booking.endTime,
    resource: {
      roomName: booking.room?.name || 'Unknown Room',
      status: booking.status,
      paymentStatus: booking.paymentStatus || 'unpaid',
    },
  }));

  // Event style based on status
  const eventStyleGetter = (event: BookingEvent) => {
    let backgroundColor = '#3174ad'; // Default blue

    if (event.resource) {
      switch (event.resource.status) {
        case 'scheduled':
          backgroundColor = '#10b981'; // Green
          break;
        case 'completed':
          backgroundColor = '#6b7280'; // Gray
          break;
        case 'cancelled':
          backgroundColor = '#ef4444'; // Red
          break;
        case 'in_progress':
          backgroundColor = '#f59e0b'; // Orange
          break;
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  // Handle event click
  const handleSelectEvent = (event: BookingEvent) => {
    navigate(`/client-portal/bookings/${event.id}`);
  };

  return (
    <div className="h-[600px] bg-white p-4 rounded-lg border">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="month"
        popup
        tooltipAccessor={(event: BookingEvent) =>
          `${event.title} - ${event.resource?.roomName} (${event.resource?.status})`
        }
      />
    </div>
  );
}

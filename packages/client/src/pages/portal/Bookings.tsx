import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClientAuth } from '@/lib/clientAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, addDays, startOfDay } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  X,
  Loader2,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Client Portal Bookings Page
 *
 * Self-service booking interface for clients.
 * - View available rooms
 * - Check availability
 * - Book sessions
 * - View and manage existing bookings
 */
export function PortalBookings() {
  const { client, logout } = useClientAuth();
  const utils = trpc.useUtils();

  // State
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingDescription, setBookingDescription] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Queries
  const { data: rooms, isLoading: isLoadingRooms } = trpc.bookings.rooms.useQuery();
  const { data: myBookings, isLoading: isLoadingBookings } = trpc.bookings.myBookings.useQuery({
    status: 'upcoming',
    limit: 10,
  });

  // Get availability for selected room and date range (7 days)
  const startDate = startOfDay(new Date(selectedDate));
  const endDate = addDays(startDate, 6);
  const { data: availability, isLoading: isLoadingAvailability } =
    trpc.bookings.availability.useQuery(
      {
        roomId: selectedRoomId!,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        slotDurationMinutes: 60,
      },
      {
        enabled: !!selectedRoomId,
      }
    );

  // Mutations
  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success('Session booked successfully!');
      setBookingDialogOpen(false);
      setSelectedSlot(null);
      setBookingTitle('');
      setBookingDescription('');
      setBookingNotes('');
      utils.bookings.myBookings.invalidate();
      utils.bookings.availability.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to book session');
    },
  });

  const cancelBookingMutation = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      setCancelDialogOpen(false);
      setSelectedBookingId(null);
      setCancelReason('');
      utils.bookings.myBookings.invalidate();
      utils.bookings.availability.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });

  const handleLogout = async () => {
    await logout();
  };

  const handleSlotClick = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setBookingDialogOpen(true);
  };

  const handleBookSession = () => {
    if (!selectedRoomId || !selectedSlot || !bookingTitle) return;

    createBookingMutation.mutate({
      roomId: selectedRoomId,
      title: bookingTitle,
      description: bookingDescription || undefined,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      notes: bookingNotes || undefined,
    });
  };

  const handleCancelBooking = () => {
    if (!selectedBookingId) return;

    cancelBookingMutation.mutate({
      bookingId: selectedBookingId,
      reason: cancelReason || undefined,
    });
  };

  const openCancelDialog = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setCancelDialogOpen(true);
  };

  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId);

  if (isLoadingRooms || isLoadingBookings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/portal">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="border-l pl-3">
                <h1 className="text-lg font-semibold">Book a Session</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {client?.artistName || client?.name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Room Selection & Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select a Room</CardTitle>
                <CardDescription>Choose a studio room to book</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms?.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedRoomId === room.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{room.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {room.description || 'Recording room'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {room.hourlyRate}/hr
                        </Badge>
                      </div>
                      {room.capacity && (
                        <p className="text-xs text-gray-400 mt-2">
                          Capacity: {room.capacity} people
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Date Selection & Availability */}
            {selectedRoomId && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Date & Time</CardTitle>
                  <CardDescription>
                    Choose an available time slot for {selectedRoom?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label htmlFor="date">Starting Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      className="mt-1 w-48"
                    />
                  </div>

                  {isLoadingAvailability ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : availability ? (
                    <div className="space-y-6">
                      {availability.map((day) => (
                        <div key={day.date}>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            {format(new Date(day.date), 'EEEE, MMMM d, yyyy')}
                          </h4>
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {day.slots.map((slot, idx) => (
                              <Button
                                key={idx}
                                variant={slot.available ? 'outline' : 'ghost'}
                                size="sm"
                                disabled={!slot.available}
                                onClick={() =>
                                  slot.available &&
                                  handleSlotClick({
                                    start: slot.start,
                                    end: slot.end,
                                  })
                                }
                                className={`text-xs ${
                                  slot.available
                                    ? 'hover:bg-purple-100 hover:border-purple-500'
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                              >
                                {format(new Date(slot.start), 'HH:mm')}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Select a room to view availability
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - My Bookings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>My Upcoming Bookings</CardTitle>
                <CardDescription>Your scheduled sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {myBookings && myBookings.length > 0 ? (
                  <div className="space-y-4">
                    {myBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{booking.title}</h4>
                            <p className="text-sm text-gray-500">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {booking.roomName}
                            </p>
                          </div>
                          <Badge
                            variant={
                              booking.status === 'scheduled'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(booking.startTime), 'MMM d, yyyy')}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(booking.startTime), 'HH:mm')} -{' '}
                            {format(new Date(booking.endTime), 'HH:mm')}
                          </p>
                          {booking.totalAmount && (
                            <p className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {booking.totalAmount}
                            </p>
                          )}
                        </div>
                        {booking.status === 'scheduled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openCancelDialog(booking.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming bookings</p>
                    <p className="text-sm">Select a room and time to book</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Session</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  {selectedRoom?.name} -{' '}
                  {format(new Date(selectedSlot.start), 'MMMM d, yyyy HH:mm')} to{' '}
                  {format(new Date(selectedSlot.end), 'HH:mm')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Vocal Recording, Mixing Session"
                value={bookingTitle}
                onChange={(e) => setBookingTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what you'll be working on..."
                value={bookingDescription}
                onChange={(e) => setBookingDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">Special Requests</Label>
              <Textarea
                id="notes"
                placeholder="Any equipment or setup requirements..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            {selectedRoom && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium">Estimated Cost</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${selectedRoom.hourlyRate}
                </p>
                <p className="text-xs text-gray-500">for 1 hour</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookSession}
              disabled={!bookingTitle || createBookingMutation.isPending}
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Book Session
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="cancelReason">Reason (optional)</Label>
            <Textarea
              id="cancelReason"
              placeholder="Why are you cancelling?"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-2">
              Note: Bookings must be cancelled at least 24 hours in advance.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={cancelBookingMutation.isPending}
            >
              {cancelBookingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

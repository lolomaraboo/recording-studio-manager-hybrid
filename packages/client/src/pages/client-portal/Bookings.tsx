import { useState } from "react";
import { useClientPortalAuth } from "@/contexts/ClientPortalAuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { BookingCalendar } from "@/components/client-portal/BookingCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

/**
 * Client Portal - Bookings Page
 *
 * Features:
 * - List available rooms
 * - Create new booking with date/time selection
 * - View booking summary with deposit info
 * - Redirect to Stripe Checkout for payment
 */
export default function Bookings() {
  const { sessionToken } = useClientPortalAuth();
  usePageTitle('My Bookings');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  // Fetch available rooms
  const roomsQuery = trpc.clientPortalBooking.listRooms.useQuery({
    sessionToken: sessionToken || "",
  }, {
    enabled: !!sessionToken,
    retry: false,
  });

  // Fetch client's bookings for calendar view
  const myBookingsQuery = trpc.clientPortalBooking.listMyBookings.useQuery({
    sessionToken: sessionToken || "",
  }, {
    enabled: !!sessionToken,
    retry: false,
  });

  // Create booking mutation
  const createBookingMutation = trpc.clientPortalBooking.createBooking.useMutation({
    onSuccess: (data) => {
      toast.success("Booking created successfully!");

      // Now create Stripe checkout session for deposit
      createCheckoutMutation.mutate({
        sessionToken: sessionToken!,
        bookingId: data.booking.id,
      });
    },
    onError: (error) => {
      toast.error(`Failed to create booking: ${error.message}`);
    },
  });

  // Create Stripe checkout session mutation
  const createCheckoutMutation = trpc.clientPortalStripe.createDepositCheckout.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl!;
    },
    onError: (error) => {
      toast.error(`Failed to create payment session: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoomId || !sessionToken) {
      toast.error("Please select a room");
      return;
    }

    // Combine date + time into ISO datetime strings
    const startDateTime = `${startDate}T${startTime}:00.000Z`;
    const endDateTime = `${endDate}T${endTime}:00.000Z`;

    createBookingMutation.mutate({
      sessionToken,
      roomId: selectedRoomId,
      title,
      description,
      startTime: startDateTime,
      endTime: endDateTime,
    });
  };

  const selectedRoom = roomsQuery.data?.rooms?.find(r => r.id === selectedRoomId);

  // Loading state
  if (!sessionToken) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Bookings
          </h2>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Studio Bookings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="book" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="book">Book a Room</TabsTrigger>
                <TabsTrigger value="calendar">My Bookings Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="book">
                {/* Room Selection */}
                {!showBookingForm ? (
                  <div>
                    {roomsQuery.isLoading && (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">Loading rooms...</p>
                      </div>
                    )}

                    {roomsQuery.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">Failed to load rooms: {roomsQuery.error.message}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {roomsQuery.data?.rooms?.map((room) => (
                        <div
                          key={room.id}
                          className="rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setShowBookingForm(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold">{room.name}</h3>
                            <span
                              className="px-2 py-1 text-xs font-medium rounded"
                              style={{ backgroundColor: room.color ? room.color + "20" : undefined, color: room.color || undefined }}
                            >
                              {room.type}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{room.description}</p>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hourly Rate:</span>
                              <span className="font-medium">${room.hourlyRate}/hr</span>
                            </div>
                            {room.halfDayRate && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Half Day (4h):</span>
                                <span className="font-medium">${room.halfDayRate}</span>
                              </div>
                            )}
                            {room.fullDayRate && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Full Day (8h):</span>
                                <span className="font-medium">${room.fullDayRate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Booking Form
                  <div className="rounded-lg border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold">Book {selectedRoom?.name}</h3>
                        <p className="text-sm text-muted-foreground">30% deposit required to confirm booking</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBookingForm(false);
                          setSelectedRoomId(null);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        ← Back to Rooms
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Session Title *
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          placeholder="e.g., Album Recording Session"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          placeholder="Any additional details..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Start Time *
                          </label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            End Date *
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            End Time *
                          </label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div className="bg-muted rounded-lg p-3">
                        <h4 className="text-sm font-semibold mb-1">Pricing</h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Hourly Rate: ${selectedRoom?.hourlyRate}/hr</p>
                          <p>A 30% deposit is required to confirm your booking</p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={createBookingMutation.isPending || createCheckoutMutation.isPending}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {createBookingMutation.isPending
                          ? "Creating booking..."
                          : createCheckoutMutation.isPending
                          ? "Redirecting to payment..."
                          : "Book & Pay Deposit"}
                      </button>
                    </form>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calendar">
                {myBookingsQuery.isLoading && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Loading bookings...</p>
                  </div>
                )}

                {myBookingsQuery.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">Failed to load bookings: {myBookingsQuery.error.message}</p>
                  </div>
                )}

                {myBookingsQuery.data && (
                  <BookingCalendar bookings={myBookingsQuery.data.bookings} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

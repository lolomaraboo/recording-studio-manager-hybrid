import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientPortalAuth } from "@/contexts/ClientPortalAuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { BookingCalendar } from "@/components/client-portal/BookingCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Studio Bookings</h1>
          <p className="text-gray-600 mt-2">Book a session or view your calendar</p>
        </div>

        <Tabs defaultValue="book" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="book">Book a Room</TabsTrigger>
            <TabsTrigger value="calendar">My Bookings Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="book">
            {/* Room Selection */}
            {!showBookingForm ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>

            {roomsQuery.isLoading && (
              <p className="text-gray-500">Loading rooms...</p>
            )}

            {roomsQuery.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Failed to load rooms: {roomsQuery.error.message}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomsQuery.data?.rooms?.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setShowBookingForm(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                    <span
                      className="px-2 py-1 text-xs font-medium rounded"
                      style={{ backgroundColor: room.color + "20", color: room.color }}
                    >
                      {room.type}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hourly Rate:</span>
                      <span className="font-medium">${room.hourlyRate}/hr</span>
                    </div>
                    {room.halfDayRate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Half Day (4h):</span>
                        <span className="font-medium">${room.halfDayRate}</span>
                      </div>
                    )}
                    {room.fullDayRate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Full Day (8h):</span>
                        <span className="font-medium">${room.fullDayRate}</span>
                      </div>
                    )}
                  </div>

                  <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Select Room
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Booking Form
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Book {selectedRoom?.name}</h2>
                <p className="text-gray-600">30% deposit required to confirm booking</p>
              </div>
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setSelectedRoomId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Rooms
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Album Recording Session"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Pricing</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Hourly Rate: ${selectedRoom?.hourlyRate}/hr</p>
                  <p className="text-xs text-blue-600">A 30% deposit is required to confirm your booking</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={createBookingMutation.isPending || createCheckoutMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
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
              <p className="text-gray-500">Loading bookings...</p>
            )}

            {myBookingsQuery.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Failed to load bookings: {myBookingsQuery.error.message}</p>
              </div>
            )}

            {myBookingsQuery.data && (
              <BookingCalendar bookings={myBookingsQuery.data.bookings} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

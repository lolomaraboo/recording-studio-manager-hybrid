import { useParams, useNavigate } from 'react-router-dom';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Music,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  FileText,
  CreditCard,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Client Portal - Booking Detail Page
 *
 * Features:
 * - Display full booking details (title, dates, room, status)
 * - Show payment summary (total, deposit, balance)
 * - Display payment transaction history
 * - Navigate back to bookings list
 */
export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessionToken } = useClientPortalAuth();
  usePageTitle('Booking Details');

  const bookingId = id ? parseInt(id, 10) : null;

  // Fetch booking details
  const bookingQuery = trpc.clientPortalBooking.getBooking.useQuery(
    {
      sessionToken: sessionToken || '',
      bookingId: bookingId!,
    },
    {
      enabled: !!sessionToken && !!bookingId,
      retry: false,
    }
  );

  if (!sessionToken || !bookingId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Invalid booking ID</p>
            <Button onClick={() => navigate('/client-portal/bookings')} className="mt-4">
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (bookingQuery.error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-red-600">{bookingQuery.error.message}</p>
            <Button onClick={() => navigate('/client-portal/bookings')} className="mt-4">
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const booking = bookingQuery.data;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (date: Date | string) => {
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  // Convert DB Decimal strings to numbers
  const totalAmount = parseFloat(String(booking.totalAmount || 0));
  const depositAmount = parseFloat(String(booking.depositAmount || 0));
  const balance = totalAmount - depositAmount;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Back Button */}
      <Button
        onClick={() => navigate('/client-portal/bookings')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Bookings
      </Button>

      {/* Booking Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{booking.title}</CardTitle>
              <CardDescription>Booking #{booking.id}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getStatusColor(booking.status)}>
                {formatStatus(booking.status)}
              </Badge>
              <Badge variant="outline" className={getPaymentStatusColor(booking.paymentStatus || 'unpaid')}>
                {formatStatus(booking.paymentStatus || 'unpaid')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{booking.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Start Time</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(booking.startTime)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">End Time</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(booking.endTime)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Music className="mr-2 h-5 w-5" />
            Studio Room
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{booking.room?.name}</p>
              <p className="text-sm text-muted-foreground">{booking.room?.description}</p>
            </div>
            <Badge
              variant="outline"
              style={{
                backgroundColor: booking.room?.color + '20',
                color: booking.room?.color,
              }}
            >
              {booking.room?.type}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
            <div>
              <span className="text-muted-foreground">Hourly Rate:</span>
              <span className="ml-2 font-medium">${booking.room?.hourlyRate}/hr</span>
            </div>
            {booking.room?.halfDayRate && (
              <div>
                <span className="text-muted-foreground">Half Day:</span>
                <span className="ml-2 font-medium">${booking.room?.halfDayRate}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Deposit Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ${depositAmount.toFixed(2)}
              </p>
              {booking.depositPaid && (
                <div className="flex items-center mt-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">Paid</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Balance Due</p>
              <p className="text-2xl font-bold text-orange-600">
                ${balance.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>All transactions for this booking</CardDescription>
        </CardHeader>
        <CardContent>
          {!booking.paymentHistory || booking.paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No payment transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {booking.paymentHistory.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{formatStatus(transaction.type)}</p>
                      <Badge
                        variant="outline"
                        className={
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {formatStatus(transaction.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                    {transaction.stripePaymentIntentId && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {transaction.stripePaymentIntentId}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      ${transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.currency.toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

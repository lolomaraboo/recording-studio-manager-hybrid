import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  XCircle,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';

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

  // Cancel booking modal state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Create balance checkout mutation
  const createBalanceCheckoutMutation = trpc.clientPortalStripe.createBalanceCheckout.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl!;
    },
    onError: (error: any) => {
      toast.error(`Failed to create payment session: ${error.message}`);
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = trpc.clientPortalBooking.cancelBooking.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowCancelDialog(false);
      setCancelReason('');
      // Refresh booking data
      bookingQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel booking: ${error.message}`);
    },
  });

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
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Invalid booking ID</p>
            <Button size="sm" onClick={() => navigate('/client-portal/bookings')}>
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (bookingQuery.error) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-3">{bookingQuery.error.message}</p>
            <Button size="sm" onClick={() => navigate('/client-portal/bookings')}>
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const booking = bookingQuery.data;

  // Guard clause for undefined booking
  if (!booking) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Booking not found</p>
            <Button size="sm" onClick={() => navigate('/client-portal/bookings')}>
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  const canCancelBooking = booking.status !== 'cancelled' && booking.status !== 'completed' && new Date(booking.startTime) > new Date();

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate('/client-portal/bookings')}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Button>

          {canCancelBooking && (
            <Button
              onClick={() => setShowCancelDialog(true)}
              variant="destructive"
              size="sm"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Booking
            </Button>
          )}
        </div>

        {/* Booking Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{booking.title}</CardTitle>
                <CardDescription className="text-sm">Booking #{booking.id}</CardDescription>
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
          <CardContent className="pt-0 space-y-4">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Music className="mr-2 h-5 w-5" />
              Studio Room
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{booking.room?.name}</p>
              <p className="text-sm text-muted-foreground">{booking.room?.description}</p>
            </div>
            <Badge
              variant="outline"
              style={{
                backgroundColor: booking.room?.color ? booking.room.color + '20' : undefined,
                color: booking.room?.color || undefined,
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
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
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

          {/* Pay Balance Button */}
          {booking.depositPaid && balance > 0 && booking.paymentStatus !== 'paid' && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to pay the remaining balance?</p>
                  <p className="text-sm text-muted-foreground">
                    Complete your payment to finalize this booking
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (!sessionToken || !bookingId) return;
                    createBalanceCheckoutMutation.mutate({
                      sessionToken,
                      bookingId,
                    });
                  }}
                  disabled={createBalanceCheckoutMutation.isPending}
                  size="lg"
                  className="ml-4"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {createBalanceCheckoutMutation.isPending
                    ? 'Redirecting...'
                    : `Pay Balance ($${balance.toFixed(2)})`}
                </Button>
              </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription className="text-sm">All transactions for this booking</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {!booking.paymentHistory || booking.paymentHistory.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No payment transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
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

        {/* Cancel Booking Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking?
              {booking.depositPaid && (
                <span className="block mt-2 font-medium text-orange-600">
                  A refund of ${depositAmount.toFixed(2)} will be issued to your original payment method.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Please let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
              }}
              disabled={cancelBookingMutation.isPending}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!sessionToken || !bookingId) return;
                cancelBookingMutation.mutate({
                  sessionToken,
                  bookingId,
                  reason: cancelReason || undefined,
                });
              }}
              disabled={cancelBookingMutation.isPending}
            >
              {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

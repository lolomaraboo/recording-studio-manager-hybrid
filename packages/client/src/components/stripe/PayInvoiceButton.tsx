import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

interface PayInvoiceButtonProps {
  invoiceId: number;
  invoiceNumber: string;
  total: string;
  status: string;
  onPaymentSuccess?: () => void;
}

/**
 * Pay Invoice Button
 *
 * Initiates Stripe Checkout for invoice payment.
 * Redirects to Stripe-hosted payment page.
 */
export function PayInvoiceButton({
  invoiceId,
  invoiceNumber,
  total,
  status,
  // onPaymentSuccess is called after redirect back from Stripe
  onPaymentSuccess: _onPaymentSuccess,
}: PayInvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Check if Stripe is configured
  const { data: stripeConfig } = trpc.stripe.config.useQuery();

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error('Failed to create payment session');
        setIsLoading(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Payment failed');
      setIsLoading(false);
    },
  });

  const handlePayment = async () => {
    if (!stripeConfig?.isConfigured) {
      toast.error('Payment system is not configured');
      return;
    }

    setIsLoading(true);

    const currentUrl = window.location.origin;

    createCheckoutMutation.mutate({
      invoiceId,
      successUrl: `${currentUrl}/portal/invoices?payment=success&invoice=${invoiceNumber}`,
      cancelUrl: `${currentUrl}/portal/invoices?payment=cancelled&invoice=${invoiceNumber}`,
    });
  };

  // Don't show button if invoice is already paid or cancelled
  if (status === 'paid' || status === 'cancelled' || status === 'draft') {
    return null;
  }

  // Don't show button if Stripe is not configured
  if (!stripeConfig?.isConfigured) {
    return (
      <Button variant="outline" disabled size="sm">
        <CreditCard className="h-4 w-4 mr-2" />
        Payment unavailable
      </Button>
    );
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className="bg-green-600 hover:bg-green-700"
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay ${total}
        </>
      )}
    </Button>
  );
}

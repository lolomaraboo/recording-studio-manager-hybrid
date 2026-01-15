import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, CreditCard, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';

export default function ClientInvoiceDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const invoiceId = Number(params.id);
  const { sessionToken } = useClientPortalAuth();

  const { data, isLoading } = trpc.clientPortalDashboard.getInvoice.useQuery(
    { sessionToken: sessionToken || '', invoiceId },
    { enabled: !!sessionToken }
  );
  const { mutateAsync: createPaymentSession } = trpc.invoices.createPaymentSession.useMutation();
  const downloadPDFQuery = trpc.invoices.downloadPDF.useQuery({ invoiceId }, { enabled: false });

  // Extract invoice and items from response
  const invoice = data?.invoice;
  const items = data?.items || [];

  const handlePayNow = async () => {
    try {
      const result = await createPaymentSession({ invoiceId });
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl; // Redirect to Stripe Checkout
      } else {
        toast.error('No checkout URL received');
      }
    } catch (error) {
      toast.error('Failed to create payment session');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const result = await downloadPDFQuery.refetch();
      if (result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank'); // Open signed URL in new tab
      }
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  if (isLoading) return <div className="pt-2 pb-4 px-2">Loading...</div>;
  if (!invoice) return <div className="pt-2 pb-4 px-2">Invoice not found</div>;

  const canPay = invoice.status === 'SENT' || invoice.status === 'PARTIALLY_PAID';

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'secondary' | 'default' | 'destructive' | 'outline'; className?: string }> = {
      DRAFT: { variant: 'secondary' },
      SENT: { variant: 'default' },
      PAID: { variant: 'default', className: 'bg-green-500 text-white hover:bg-green-600' },
      PARTIALLY_PAID: { variant: 'default', className: 'bg-orange-500 text-white hover:bg-orange-600' },
      PAYMENT_FAILED: { variant: 'destructive' },
    };
    const { variant, className } = config[status] || { variant: 'default' as const };
    return <Badge variant={variant} className={className}>{status}</Badge>;
  };

  return (
    <div className="pt-2 pb-4 px-2">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/client-portal/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-semibold">Invoice #{invoice.invoiceNumber}</h1>
        {getStatusBadge(invoice.status)}
      </div>

      <div className="grid gap-4">
        {/* Invoice Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Issue Date:</span>
              <span>{new Date(invoice.issueDate).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Due Date:</span>
              <span>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
            </div>
            {invoice.status === 'PAID' && invoice.paidAt && (
              <div className="flex justify-between">
                <span>Paid On:</span>
                <span>{new Date(invoice.paidAt).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} × {item.unitPrice}€
                    </div>
                  </div>
                  <span className="font-semibold">{item.amount}€</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{invoice.subtotal}€</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({invoice.taxRate}%):</span>
                <span>{invoice.taxAmount}€</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{invoice.total}€</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>

              {canPay && (
                <Button
                  onClick={handlePayNow}
                  className="flex-1"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

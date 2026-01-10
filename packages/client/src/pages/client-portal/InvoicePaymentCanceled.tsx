import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InvoicePaymentCanceled() {
  return (
    <div className="pt-2 pb-4 px-2">
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-16 w-16 text-orange-500 mx-auto" />
            <h1 className="text-2xl font-semibold">Payment Canceled</h1>
            <p className="text-muted-foreground">
              Your payment was canceled. You can try again anytime.
            </p>
            <Link to="/client-portal/invoices">
              <Button variant="outline" className="w-full mt-4">
                Back to Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

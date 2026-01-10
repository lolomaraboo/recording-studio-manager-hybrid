import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function InvoicePaymentSuccess() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');

  return (
    <div className="pt-2 pb-4 px-2">
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-semibold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your invoice payment has been processed successfully.
              You will receive a confirmation email shortly.
            </p>
            {sessionId && (
              <p className="text-xs text-muted-foreground">
                Session ID: {sessionId}
              </p>
            )}
            <Link to="/client-portal/invoices">
              <Button className="w-full mt-4">
                View All Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

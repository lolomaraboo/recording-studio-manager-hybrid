import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';

export default function PaymentHistory() {
  const { client } = useClientPortalAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">
          View your payment transactions and receipts
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Payment history for {client?.name}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page will display your payment history and receipts.
        </p>
      </div>
    </div>
  );
}

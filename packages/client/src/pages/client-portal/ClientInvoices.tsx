import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';

export default function ClientInvoices() {
  const { client } = useClientPortalAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Invoices</h1>
        <p className="text-muted-foreground">
          View and pay your studio invoices
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Invoices page for {client?.name}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page will display your invoices and payment options.
        </p>
      </div>
    </div>
  );
}

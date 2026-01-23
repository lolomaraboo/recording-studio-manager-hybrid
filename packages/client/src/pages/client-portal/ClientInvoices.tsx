import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useNavigate } from 'react-router-dom';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';

export default function ClientInvoices() {
  const { sessionToken } = useClientPortalAuth();
  const { data: invoicesData, isLoading } = trpc.clientPortalDashboard.listInvoices.useQuery(
    { sessionToken: sessionToken || '' },
    { enabled: !!sessionToken }
  );
  const navigate = useNavigate();

  const invoices = invoicesData?.invoices || [];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: "Brouillon", className: "bg-gray-100 text-gray-700 border-gray-200" },
      sent: { label: "Envoyée", className: "bg-blue-100 text-blue-700 border-blue-200" },
      paid: { label: "Payée", className: "bg-green-100 text-green-700 border-green-200" },
      overdue: { label: "En retard", className: "bg-amber-100 text-amber-700 border-amber-200" },
      cancelled: { label: "Annulée", className: "bg-red-100 text-red-700 border-red-200" },
    };
    const entry = config[status] || config.draft;
    return <Badge variant="outline" className={entry.className}>{entry.label}</Badge>;
  };

  return (
    <div className="pt-2 pb-4 px-2">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-semibold">My Invoices</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No invoices yet.
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate(`/client-portal/invoices/${invoice.id}`)}
                  className="py-3 hover:bg-accent cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">Invoice #{invoice.invoiceNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      Due {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">{invoice.total}€</span>
                    {getStatusBadge(invoice.status)}
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

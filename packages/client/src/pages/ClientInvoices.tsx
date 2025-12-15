import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FileText, ArrowLeft, Download, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientInvoices() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("clientToken");
    if (!storedToken) {
      navigate("/client/login");
      return;
    }
    setToken(storedToken);
  }, [navigate]);

  const orgId = parseInt(localStorage.getItem("selectedOrganizationId") || "1");
  
  const { data: invoices, isLoading } = trpc.clientAuth.getClientInvoices.useQuery(
    { organizationId: orgId, token },
    { enabled: !!token }
  );

  if (isLoading) return <div className="min-h-screen bg-background p-6"><Skeleton className="h-96" /></div>;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };
    const labels: Record<string, string> = {
      paid: "Payée",
      pending: "En attente",
      overdue: "En retard",
      sent: "Envoyée",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/client/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Mes Factures</h1>
            <p className="text-sm text-muted-foreground">{invoices?.length || 0} factures</p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Toutes les factures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!invoices || invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune facture</p>
            ) : (
              invoices.map((invoice: any) => (
                <div key={invoice.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(invoice.issueDate), "PPP", { locale: fr })}
                      </p>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{(invoice.total / 100).toFixed(2)}€</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      {invoice.status !== "paid" && (
                        <Button size="sm">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Payer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

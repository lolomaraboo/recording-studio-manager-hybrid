/**
 * CLIENT PORTAL - Page Factures
 * 
 * Historique complet des factures avec :
 * - Filtres par statut (toutes, payées, en attente, en retard)
 * - Affichage détaillé de chaque facture
 * - Téléchargement PDF
 * - Badges de statut colorés
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type InvoiceStatus = "all" | "paid" | "pending" | "overdue";

export default function ClientPortalInvoices() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>("all");

  const { data: invoices, isLoading } = trpc.clientPortal.getMyInvoices.useQuery({
    status: statusFilter,
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      paid: { label: "Payée", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      pending: { label: "En attente", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      sent: { label: "Envoyée", variant: "secondary", icon: <FileText className="h-3 w-3" /> },
      overdue: { label: "En retard", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
      draft: { label: "Brouillon", variant: "outline", icon: <FileText className="h-3 w-3" /> },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline", icon: <FileText className="h-3 w-3" /> };
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const payInvoiceMutation = trpc.clientPortal.createPaymentSession.useMutation({
    onSuccess: (data) => {
      // Rediriger vers la page de paiement Stripe
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la session de paiement", {
        description: error.message,
      });
    },
  });

  const handlePayInvoice = async (invoiceId: number) => {
    payInvoiceMutation.mutate({ invoiceId });
  };

  const generatePDFMutation = trpc.clientPortal.generateInvoicePDF.useMutation({
    onSuccess: (data) => {
      // Télécharger le PDF
      window.open(data.url, '_blank');
      toast.success("PDF généré avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la génération du PDF", {
        description: error.message,
      });
    },
  });

  const handleDownloadPDF = async (invoiceId: number, invoiceNumber: string) => {
    generatePDFMutation.mutate({ invoiceId });
  };

  const calculateTotal = (invoices: any[]) => {
    return invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/client-portal">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au portail
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Mes Factures</h1>
          <p className="text-sm text-muted-foreground">
            Historique complet de vos factures et paiements
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistiques */}
        {invoices && invoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total payé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calculateTotal(invoices.filter((i: any) => i.status === "paid")).toFixed(2)}€
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {calculateTotal(invoices.filter((i: any) => i.status === "pending" || i.status === "sent")).toFixed(2)}€
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">En retard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {calculateTotal(invoices.filter((i: any) => i.status === "overdue")).toFixed(2)}€
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtres par statut */}
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="paid">Payées</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="overdue">En retard</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Liste des factures */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement de vos factures...</p>
            </div>
          </div>
        ) : invoices && invoices.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {invoices.map((invoice: any) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                        <CardDescription>
                          {invoice.title || "Facture de session"}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Date d'émission */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Émise le</p>
                        <p className="font-medium">
                          {format(new Date(invoice.issueDate || invoice.createdAt), "d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>

                    {/* Date d'échéance */}
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Échéance</p>
                        <p className="font-medium">
                          {format(new Date(invoice.dueDate), "d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>

                    {/* Date de paiement */}
                    {invoice.paidAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Payée le</p>
                          <p className="font-medium text-green-600 dark:text-green-400">
                            {format(new Date(invoice.paidAt), "d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Montants */}
                  <div className="space-y-2 p-4 rounded-lg bg-muted">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{Number(invoice.subtotal).toFixed(2)}€</span>
                    </div>
                    {invoice.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TVA</span>
                        <span>{Number(invoice.taxAmount).toFixed(2)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">{Number(invoice.totalAmount).toFixed(2)}€</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                      disabled={generatePDFMutation.isPending}
                    >
                      {generatePDFMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Génération...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger PDF
                        </>
                      )}
                    </Button>
                    {(invoice.status === "pending" || invoice.status === "sent" || invoice.status === "overdue") && (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handlePayInvoice(invoice.id)}
                        disabled={payInvoiceMutation.isPending}
                      >
                        {payInvoiceMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Chargement...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payer maintenant
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Aucune facture trouvée</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter === "all"
                    ? "Vous n'avez pas encore de factures."
                    : `Aucune facture ${statusFilter === "paid" ? "payée" : statusFilter === "pending" ? "en attente" : "en retard"}.`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Import manquant pour Clock
import { Clock } from "lucide-react";

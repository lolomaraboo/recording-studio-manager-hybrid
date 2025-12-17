import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router-dom";
import { FileText, Plus, Search, ArrowLeft, Download, Eye, Euro } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });

  // Create a map of client IDs to client names
  const clientMap = useMemo(() => {
    return (
      clients?.reduce((acc, client) => {
        acc[client.id] = client.name;
        return acc;
      }, {} as Record<number, string>) || {}
    );
  }, [clients]);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = invoices?.slice() || [];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          clientMap[invoice.clientId]?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((invoice) => invoice.status === statusFilter);
    }

    // Sort by issue date (most recent first)
    result.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    return result;
  }, [invoices, searchQuery, statusFilter, clientMap]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!invoices) return { total: 0, paid: 0, pending: 0, paidCount: 0, pendingCount: 0 };

    const total = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);
    const paidInvoices = invoices.filter((inv) => inv.status === "paid");
    const pendingInvoices = invoices.filter(
      (inv) => inv.status === "sent" || inv.status === "overdue"
    );

    const paid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);
    const pending = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

    return {
      total,
      paid,
      pending,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
    };
  }, [invoices]);

  const handleDownloadPDF = (invoiceId: number, invoiceNumber: string) => {
    // TODO: Implement PDF generation when backend supports it
    toast.info(`Génération PDF facture ${invoiceNumber} - À implémenter`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      sent: { variant: "outline", label: "Envoyée" },
      paid: { variant: "default", label: "Payée" },
      cancelled: { variant: "destructive", label: "Annulée" },
      overdue: { variant: "destructive", label: "En retard" },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Factures</h1>
            </div>
          </div>
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-6">
          {/* Stats */}
          {invoicesLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total facturé</CardDescription>
                  <CardTitle className="text-3xl">
                    {stats.total.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Toutes périodes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Payé</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {stats.paid.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats.paidCount} {stats.paidCount === 1 ? "facture" : "factures"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>En attente</CardDescription>
                  <CardTitle className="text-3xl text-orange-600">
                    {stats.pending.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingCount} {stats.pendingCount === 1 ? "facture" : "factures"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par numéro ou client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="sent">Envoyée</SelectItem>
                      <SelectItem value="paid">Payée</SelectItem>
                      <SelectItem value="overdue">En retard</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle>{filteredInvoices.length} facture(s)</CardTitle>
              <CardDescription>Gérez vos factures et paiements</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredInvoices.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facture #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{clientMap[invoice.clientId] || "Client inconnu"}</TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-1">
                              {parseFloat(invoice.total || "0").toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              €
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.issueDate), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate
                              ? format(new Date(invoice.dueDate), "dd MMM yyyy", { locale: fr })
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/invoices/${invoice.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDownloadPDF(invoice.id, invoice.invoiceNumber)
                                }
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre première facture
                  </p>
                  <Button asChild>
                    <Link to="/invoices/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle facture
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

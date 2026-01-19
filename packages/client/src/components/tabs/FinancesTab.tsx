import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table2,
  LayoutGrid,
  CalendarDays,
  Trello,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  Plus,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { useTabPreferences } from "@/hooks/useTabPreferences";

interface Invoice {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  total: string;
  status: string;
  clientId: number;
}

interface Quote {
  id: number;
  quoteNumber: string;
  createdAt: string;
  total: string;
  status: string;
  clientId: number;
}

interface FinancesTabProps {
  clientId: number;
  invoices: Invoice[];
  quotes: Quote[];
}

type ViewMode = "table" | "cards" | "timeline" | "kanban";

const INVOICE_COLUMNS = ["numéro", "date", "montant", "statut"];
const QUOTE_COLUMNS = ["numéro", "date", "montant", "statut"];

export function FinancesTab({ clientId, invoices, quotes }: FinancesTabProps) {
  // Use preferences hook for invoices (separate scope)
  const {
    preferences: invoicesPreferences,
    updatePreferences: updateInvoicesPreferences,
    resetPreferences: resetInvoicesPreferences
  } = useTabPreferences(
    "client-detail-finances-invoices",
    {
      viewMode: "table",
      visibleColumns: ["numéro", "date", "montant", "statut"],
      columnOrder: ["numéro", "date", "montant", "statut"],
    }
  );

  // Use preferences hook for quotes (separate scope)
  const {
    preferences: quotesPreferences,
    updatePreferences: updateQuotesPreferences,
    resetPreferences: resetQuotesPreferences
  } = useTabPreferences(
    "client-detail-finances-quotes",
    {
      viewMode: "table",
      visibleColumns: ["numéro", "date", "montant", "statut"],
      columnOrder: ["numéro", "date", "montant", "statut"],
    }
  );

  // Query financial stats
  const { data: stats } = trpc.clients.getFinancialStats.useQuery({ clientId });

  // Invoice status badge
  const getInvoiceStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: "bg-gray-500", label: "Brouillon" },
      sent: { className: "bg-blue-500", label: "Envoyé" },
      paid: { className: "bg-green-500", label: "Payé" },
      overdue: { className: "bg-red-500", label: "En retard" },
      cancelled: { className: "bg-gray-400", label: "Annulé" },
    };

    const config = variants[status] || variants.draft;
    return (
      <Badge className={`${config.className} text-white`}>
        {config.label}
      </Badge>
    );
  };

  // Quote status badge
  const getQuoteStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: "bg-gray-500", label: "Brouillon" },
      sent: { className: "bg-blue-500", label: "Envoyé" },
      accepted: { className: "bg-green-500", label: "Accepté" },
      rejected: { className: "bg-red-500", label: "Rejeté" },
      expired: { className: "bg-orange-500", label: "Expiré" },
      cancelled: { className: "bg-gray-400", label: "Annulé" },
      converted_to_project: { className: "bg-purple-500", label: "Converti" },
    };

    const config = variants[status] || variants.draft;
    return (
      <Badge className={`${config.className} text-white`}>
        {config.label}
      </Badge>
    );
  };

  // Kanban columns for invoices
  const invoiceKanbanColumns = useMemo(() => {
    const columns = {
      draft: [] as Invoice[],
      sent: [] as Invoice[],
      paid: [] as Invoice[],
      overdue: [] as Invoice[],
      cancelled: [] as Invoice[],
    };

    invoices.forEach((inv) => {
      if (columns[inv.status as keyof typeof columns]) {
        columns[inv.status as keyof typeof columns].push(inv);
      }
    });

    return columns;
  }, [invoices]);

  // Kanban columns for quotes
  const quoteKanbanColumns = useMemo(() => {
    const columns = {
      draft: [] as Quote[],
      sent: [] as Quote[],
      accepted: [] as Quote[],
      rejected: [] as Quote[],
      expired: [] as Quote[],
      cancelled: [] as Quote[],
      converted_to_project: [] as Quote[],
    };

    quotes.forEach((q) => {
      if (columns[q.status as keyof typeof columns]) {
        columns[q.status as keyof typeof columns].push(q);
      }
    });

    return columns;
  }, [quotes]);

  // Timeline sorted invoices
  const timelineInvoices = useMemo(() => {
    return [...invoices].sort((a, b) =>
      new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    );
  }, [invoices]);

  // Timeline sorted quotes
  const timelineQuotes = useMemo(() => {
    return [...quotes].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [quotes]);

  // Render invoices based on view mode
  const renderInvoices = () => {
    if (invoices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Aucune facture pour ce client</p>
          <Link to="/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer une facture
            </Button>
          </Link>
        </div>
      );
    }

    if (invoicesPreferences.viewMode === "table") {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                <TableCell>{format(new Date(inv.issueDate), "dd MMM yyyy", { locale: fr })}</TableCell>
                <TableCell>{parseFloat(inv.total).toFixed(2)}€</TableCell>
                <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                <TableCell>
                  <Link to={`/invoices/${inv.id}`}>
                    <Button variant="ghost" size="sm">Voir</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (invoicesPreferences.viewMode === "cards") {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((inv) => (
            <Link key={inv.id} to={`/invoices/${inv.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold mb-2">{inv.invoiceNumber}</div>
                  <div className="text-3xl font-bold text-primary mb-3">
                    {parseFloat(inv.total).toFixed(2)}€
                  </div>
                  <div className="flex items-center justify-between">
                    {getInvoiceStatusBadge(inv.status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(inv.issueDate), "dd MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      );
    }

    if (invoicesPreferences.viewMode === "timeline") {
      return (
        <div className="space-y-4">
          {timelineInvoices.map((inv) => (
            <div key={inv.id} className="flex items-start gap-4 border-l-2 border-primary pl-4 pb-4">
              <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                {format(new Date(inv.issueDate), "dd MMM yyyy", { locale: fr })}
              </div>
              <Link to={`/invoices/${inv.id}`} className="flex-1">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{inv.invoiceNumber}</div>
                        <div className="text-xl font-bold text-primary mt-1">
                          {parseFloat(inv.total).toFixed(2)}€
                        </div>
                      </div>
                      {getInvoiceStatusBadge(inv.status)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      );
    }

    if (invoicesPreferences.viewMode === "kanban") {
      return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Object.entries(invoiceKanbanColumns).map(([status, items]) => (
            <div key={status}>
              <div className="font-semibold mb-3 flex items-center gap-2">
                {status === "draft" && "Brouillon"}
                {status === "sent" && "Envoyé"}
                {status === "paid" && "Payé"}
                {status === "overdue" && "En retard"}
                {status === "cancelled" && "Annulé"}
                <span className="text-muted-foreground">({items.length})</span>
              </div>
              <div className="space-y-3">
                {items.map((inv) => (
                  <Link key={inv.id} to={`/invoices/${inv.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4">
                        <div className="font-semibold mb-2">{inv.invoiceNumber}</div>
                        <div className="text-lg font-bold text-primary mb-2">
                          {parseFloat(inv.total).toFixed(2)}€
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(inv.issueDate), "dd MMM yyyy", { locale: fr })}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Render quotes based on view mode
  const renderQuotes = () => {
    if (quotes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Aucun devis pour ce client</p>
          <Link to="/quotes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un devis
            </Button>
          </Link>
        </div>
      );
    }

    if (quotesPreferences.viewMode === "table") {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.quoteNumber}</TableCell>
                <TableCell>{format(new Date(q.createdAt), "dd MMM yyyy", { locale: fr })}</TableCell>
                <TableCell>{parseFloat(q.total).toFixed(2)}€</TableCell>
                <TableCell>{getQuoteStatusBadge(q.status)}</TableCell>
                <TableCell>
                  <Link to={`/quotes/${q.id}`}>
                    <Button variant="ghost" size="sm">Voir</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (quotesPreferences.viewMode === "cards") {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <Link key={q.id} to={`/quotes/${q.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold mb-2">{q.quoteNumber}</div>
                  <div className="text-3xl font-bold text-primary mb-3">
                    {parseFloat(q.total).toFixed(2)}€
                  </div>
                  <div className="flex items-center justify-between">
                    {getQuoteStatusBadge(q.status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(q.createdAt), "dd MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      );
    }

    if (quotesPreferences.viewMode === "timeline") {
      return (
        <div className="space-y-4">
          {timelineQuotes.map((q) => (
            <div key={q.id} className="flex items-start gap-4 border-l-2 border-primary pl-4 pb-4">
              <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                {format(new Date(q.createdAt), "dd MMM yyyy", { locale: fr })}
              </div>
              <Link to={`/quotes/${q.id}`} className="flex-1">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{q.quoteNumber}</div>
                        <div className="text-xl font-bold text-primary mt-1">
                          {parseFloat(q.total).toFixed(2)}€
                        </div>
                      </div>
                      {getQuoteStatusBadge(q.status)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      );
    }

    if (quotesPreferences.viewMode === "kanban") {
      return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
          {Object.entries(quoteKanbanColumns).map(([status, items]) => (
            <div key={status}>
              <div className="font-semibold mb-3 flex items-center gap-2 text-sm">
                {status === "draft" && "Brouillon"}
                {status === "sent" && "Envoyé"}
                {status === "accepted" && "Accepté"}
                {status === "rejected" && "Rejeté"}
                {status === "expired" && "Expiré"}
                {status === "cancelled" && "Annulé"}
                {status === "converted_to_project" && "Converti"}
                <span className="text-muted-foreground">({items.length})</span>
              </div>
              <div className="space-y-3">
                {items.map((q) => (
                  <Link key={q.id} to={`/quotes/${q.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4">
                        <div className="font-semibold mb-2 text-sm">{q.quoteNumber}</div>
                        <div className="text-lg font-bold text-primary mb-2">
                          {parseFloat(q.total).toFixed(2)}€
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(q.createdAt), "dd MMM yyyy", { locale: fr })}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total payé</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalPaid.toFixed(2)}€
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pending.toFixed(2)}€
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Devis ouverts</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.quotesOpen.toFixed(2)}€
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projection revenus</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.projection.toFixed(2)}€
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section 2: Factures */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Factures</h3>
          <div className="flex gap-2">
            <Button
              variant={invoicesPreferences.viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => updateInvoicesPreferences({ viewMode: "table" })}
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={invoicesPreferences.viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => updateInvoicesPreferences({ viewMode: "cards" })}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={invoicesPreferences.viewMode === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => updateInvoicesPreferences({ viewMode: "timeline" })}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant={invoicesPreferences.viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => updateInvoicesPreferences({ viewMode: "kanban" })}
            >
              <Trello className="h-4 w-4" />
            </Button>
            {/* Customization Dropdown (for Table mode) */}
            {invoicesPreferences.viewMode === "table" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {INVOICE_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={invoicesPreferences.visibleColumns.includes(col)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...invoicesPreferences.visibleColumns, col]
                          : invoicesPreferences.visibleColumns.filter((c) => c !== col);
                        updateInvoicesPreferences({ visibleColumns: updated });
                      }}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetInvoicesPreferences}>
                    Réinitialiser
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {renderInvoices()}
      </div>

      {/* Section 3: Devis */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Devis</h3>
          <div className="flex gap-2">
            <Button
              variant={quotesPreferences.viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => updateQuotesPreferences({ viewMode: "table" })}
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={quotesPreferences.viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => updateQuotesPreferences({ viewMode: "cards" })}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={quotesPreferences.viewMode === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => updateQuotesPreferences({ viewMode: "timeline" })}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant={quotesPreferences.viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => updateQuotesPreferences({ viewMode: "kanban" })}
            >
              <Trello className="h-4 w-4" />
            </Button>
            {/* Customization Dropdown (for Table mode) */}
            {quotesPreferences.viewMode === "table" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {QUOTE_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={quotesPreferences.visibleColumns.includes(col)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...quotesPreferences.visibleColumns, col]
                          : quotesPreferences.visibleColumns.filter((c) => c !== col);
                        updateQuotesPreferences({ visibleColumns: updated });
                      }}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetQuotesPreferences}>
                    Réinitialiser
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {renderQuotes()}
      </div>
    </div>
  );
}

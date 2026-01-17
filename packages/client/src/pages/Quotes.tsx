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
import { FileText, Plus, Search, ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ClientPopover } from "@/components/ClientPopover";

export function Quotes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: quotes, isLoading: quotesLoading } = trpc.quotes.list.useQuery({ limit: 100 });
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

  // Filter and sort quotes
  const filteredQuotes = useMemo(() => {
    let result = quotes?.slice() || [];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.quoteNumber.toLowerCase().includes(query) ||
          quote.notes?.toLowerCase().includes(query) ||
          clientMap[quote.clientId]?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((quote) => quote.status === statusFilter);
    }

    // Sort by created date (most recent first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [quotes, searchQuery, statusFilter, clientMap]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!quotes) return { total: 0, pending: 0, accepted: 0, pendingCount: 0, acceptedCount: 0 };

    const total = quotes.reduce((sum, q) => sum + parseFloat(q.total || "0"), 0);
    const pendingQuotes = quotes.filter((q) => q.status === "draft" || q.status === "sent");
    const acceptedQuotes = quotes.filter((q) => q.status === "accepted");

    const pending = pendingQuotes.reduce((sum, q) => sum + parseFloat(q.total || "0"), 0);
    const accepted = acceptedQuotes.reduce((sum, q) => sum + parseFloat(q.total || "0"), 0);

    return {
      total,
      pending,
      accepted,
      pendingCount: pendingQuotes.length,
      acceptedCount: acceptedQuotes.length,
    };
  }, [quotes]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      sent: { variant: "outline", label: "Envoyé" },
      accepted: { variant: "default", label: "Accepté" },
      rejected: { variant: "destructive", label: "Refusé" },
      expired: { variant: "destructive", label: "Expiré" },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Devis
            </h2>
          </div>
          <Button asChild>
            <Link to="/quotes/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau devis
            </Link>
          </Button>
        </div>
        {/* Stats */}
        {quotesLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total devis</CardDescription>
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
                    {stats.pendingCount} {stats.pendingCount === 1 ? "devis" : "devis"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Acceptés</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {stats.accepted.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats.acceptedCount} {stats.acceptedCount === 1 ? "devis" : "devis"}
                  </p>
                </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par numéro, titre ou client..."
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
                      <SelectItem value="sent">Envoyé</SelectItem>
                      <SelectItem value="accepted">Accepté</SelectItem>
                      <SelectItem value="rejected">Refusé</SelectItem>
                      <SelectItem value="expired">Expiré</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotes List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{filteredQuotes.length} devis</CardTitle>
            <CardDescription className="text-sm">Gérez vos devis et propositions commerciales</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
              {quotesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredQuotes.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Devis #</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Montant TTC</TableHead>
                        <TableHead>Valide jusqu'au</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotes.map((quote) => (
                        <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                          <TableCell>{quote.notes?.substring(0, 50) || "-"}</TableCell>
                          <TableCell>
                            <ClientPopover
                              clientId={quote.clientId}
                              clientName={clientMap[quote.clientId]}
                            />
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-1">
                              {parseFloat(quote.total || "0").toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              €
                            </div>
                          </TableCell>
                          <TableCell>
                            {quote.expiresAt
                              ? format(new Date(quote.expiresAt), "dd MMM yyyy", { locale: fr })
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(quote.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/quotes/${quote.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">Aucun devis</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Commencez par créer votre premier devis
                </p>
                <Button asChild size="sm">
                  <Link to="/quotes/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau devis
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router-dom";
import { Users, Plus, Search, ArrowLeft, Mail, Phone, Star, FileDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export function Clients() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });

  // Calculate stats per client
  const clientsWithStats = useMemo(() => {
    return (
      clients?.map((client) => {
        const clientSessions = sessions?.filter((s) => s.clientId === client.id) || [];
        const clientInvoices = invoices?.filter((inv) => inv.clientId === client.id) || [];
        const revenue = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

        // Find last session
        const sortedSessions = clientSessions.sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        const lastSession = sortedSessions[0];

        return {
          ...client,
          sessionsCount: clientSessions.length,
          revenue: revenue * 100, // Convert to cents for consistency
          lastSessionAt: lastSession?.startTime || null,
        };
      }) || []
    );
  }, [clients, sessions, invoices]);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clientsWithStats;

    const query = searchQuery.toLowerCase();
    return clientsWithStats.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.artistName?.toLowerCase().includes(query)
    );
  }, [clientsWithStats, searchQuery]);

  const handleExportExcel = () => {
    // TODO: Implement Excel export when backend supports it
    toast.info("Export Excel - À implémenter");
  };

  const _getTypeLabel = (type: string) => {
    switch (type) {
      case "solo_artist":
        return "Artiste Solo";
      case "band":
        return "Groupe";
      case "label":
        return "Label";
      case "company":
        return "Entreprise";
      case "producer":
        return "Producteur";
      default:
        return type;
    }
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
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Clients</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <FileDown className="mr-2 h-4 w-4" />
              Exporter Excel
            </Button>
            <Button asChild>
              <Link to="/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau client
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Recherche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou entreprise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Clients List */}
          <Card>
            <CardHeader>
              <CardTitle>{filteredClients.length} client(s)</CardTitle>
              <CardDescription>Gérez votre base de données clients</CardDescription>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredClients.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Revenus</TableHead>
                        <TableHead>Dernière session</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {client.name}
                                  {/* VIP indicator - TODO: add isVip field to schema */}
                                  {client.revenue > 1000000 && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  )}
                                </div>
                                {client.artistName && (
                                  <div className="text-sm text-muted-foreground">{client.artistName}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {client.type === "company" ? "Entreprise" : "Particulier"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {client.email && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {client.email}
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {client.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{client.sessionsCount}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {(client.revenue / 100).toFixed(2)}€
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.lastSessionAt ? (
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(client.lastSessionAt), "dd MMM yyyy", { locale: fr })}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Jamais</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/clients/${client.id}`}>Voir</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun client</h3>
                  <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier client</p>
                  <Button asChild>
                    <Link to="/clients/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nouveau client
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

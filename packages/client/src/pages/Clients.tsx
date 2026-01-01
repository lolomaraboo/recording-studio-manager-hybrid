import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router-dom";
import { Users, Plus, Search, ArrowLeft, Mail, Phone, Star, FileDown, FileUp, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ImportClientsDialog } from "@/components/ImportClientsDialog";

export function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFormat, setImportFormat] = useState<'vcard' | 'excel' | 'csv'>('vcard');

  const { data: clients, isLoading: clientsLoading, refetch } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });

  // Export mutations
  const exportVCard = trpc.clients.exportVCard.useMutation();
  const exportExcel = trpc.clients.exportExcel.useMutation();
  const exportCSV = trpc.clients.exportCSV.useMutation();
  const { data: templateData } = trpc.clients.downloadExcelTemplate.useQuery();

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

  // Export handlers
  const handleExport = async (format: 'vcard' | 'excel' | 'csv') => {
    try {
      let result;
      if (format === 'vcard') {
        result = await exportVCard.mutateAsync({});
      } else if (format === 'excel') {
        result = await exportExcel.mutateAsync({});
      } else {
        result = await exportCSV.mutateAsync({});
      }

      // Download file
      let blob;
      if (format === 'excel') {
        // Decode base64 for Excel
        const binaryString = atob(result.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: result.mimeType });
      } else {
        blob = new Blob([result.content], { type: result.mimeType });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
      console.error(error);
    }
  };

  const handleDownloadTemplate = () => {
    if (!templateData) {
      toast.error('Template non disponible');
      return;
    }

    try {
      // Decode base64
      const binaryString = atob(templateData.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: templateData.mimeType });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = templateData.filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Template téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
      console.error(error);
    }
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
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('vcard')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  vCard (.vcf)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Import Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileUp className="mr-2 h-4 w-4" />
                  Importer
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  setImportFormat('vcard');
                  setShowImportDialog(true);
                }}>
                  <FileUp className="mr-2 h-4 w-4" />
                  vCard (.vcf)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setImportFormat('excel');
                  setShowImportDialog(true);
                }}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setImportFormat('csv');
                  setShowImportDialog(true);
                }}>
                  <FileUp className="mr-2 h-4 w-4" />
                  CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger template Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/clients/${client.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
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

      {/* Import Dialog */}
      <ImportClientsDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        format={importFormat}
        onImportComplete={() => {
          setShowImportDialog(false);
          refetch();
        }}
      />
    </div>
  );
}

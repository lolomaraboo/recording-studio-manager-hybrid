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
import { Users, Plus, Search, ArrowLeft, Mail, Phone, Star, FileDown, FileUp, Download, Eye, Table as TableIcon, Grid, Columns, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ImportClientsDialog } from "@/components/ImportClientsDialog";

type ViewMode = 'table' | 'grid' | 'kanban';
type SortField = 'name' | 'type' | 'sessions' | 'accountsReceivable' | 'lastSession';
type SortOrder = 'asc' | 'desc';

export function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFormat, setImportFormat] = useState<'vcard' | 'excel' | 'csv'>('vcard');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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

        // Calculate accounts receivable (unpaid invoices only)
        const unpaidInvoices = clientInvoices.filter((inv) => inv.status === 'sent' || inv.status === 'overdue');
        const accountsReceivable = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

        // Find last session
        const sortedSessions = clientSessions.sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        const lastSession = sortedSessions[0];

        return {
          ...client,
          sessionsCount: clientSessions.length,
          accountsReceivable: accountsReceivable * 100, // Convert to cents for consistency
          lastSessionAt: lastSession?.startTime || null,
        };
      }) || []
    );
  }, [clients, sessions, invoices]);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = clientsWithStats;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.artistName?.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'sessions':
          aValue = a.sessionsCount;
          bValue = b.sessionsCount;
          break;
        case 'accountsReceivable':
          aValue = a.accountsReceivable;
          bValue = b.accountsReceivable;
          break;
        case 'lastSession':
          aValue = a.lastSessionAt ? new Date(a.lastSessionAt).getTime() : 0;
          bValue = b.lastSessionAt ? new Date(b.lastSessionAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [clientsWithStats, searchQuery, sortField, sortOrder]);

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default asc order
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Clients
            </h2>
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

        {/* Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recherche</CardTitle>
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{filteredClients.length} client(s)</CardTitle>
                <CardDescription className="text-sm">Gérez votre base de données clients</CardDescription>
              </div>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <TableIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                  >
                    <Columns className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredClients.length > 0 ? (
                <>
                  {/* Table View */}
                  {viewMode === 'table' && (
                    <div className="rounded-md border">
                      <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Client
                            {sortField === 'name' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSort('type')}
                        >
                          <div className="flex items-center gap-1">
                            Type
                            {sortField === 'type' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSort('sessions')}
                        >
                          <div className="flex items-center gap-1">
                            Sessions
                            {sortField === 'sessions' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSort('accountsReceivable')}
                        >
                          <div className="flex items-center gap-1">
                            Comptes débiteurs
                            {sortField === 'accountsReceivable' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSort('lastSession')}
                        >
                          <div className="flex items-center gap-1">
                            Dernière session
                            {sortField === 'lastSession' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </TableHead>
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
                                  {client.accountsReceivable > 1000000 && (
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
                              {(client.accountsReceivable / 100).toFixed(2)}€
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
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                    </div>
                  )}

                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredClients.map((client) => (
                      <Card key={client.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                  {client.name}
                                  {client.accountsReceivable > 1000000 && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  )}
                                </CardTitle>
                                {client.artistName && (
                                  <CardDescription className="text-sm mt-1">
                                    {client.artistName}
                                  </CardDescription>
                                )}
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {client.type === "company" ? "Entreprise" : "Particulier"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Contact Info enrichi */}
                            <div className="space-y-2 text-sm">
                              {/* Téléphone */}
                              {client.phone ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span>{client.phone}</span>
                                </div>
                              ) : null}

                              {/* Email */}
                              {client.email ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{client.email}</span>
                                </div>
                              ) : null}

                              {/* Adresse si présente */}
                              {(client.city || client.address) && (
                                <div className="flex items-start gap-2 text-muted-foreground">
                                  <Phone className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs">{client.city || client.address}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <Link to={`/clients/${client.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Kanban View */}
                  {viewMode === 'kanban' && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                      {/* Particuliers Column */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <h3 className="font-semibold">Particuliers</h3>
                          <Badge variant="secondary">
                            {filteredClients.filter(c => c.type === 'individual').length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {filteredClients
                            .filter(c => c.type === 'individual')
                            .map((client) => (
                              <Card key={client.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      {client.name}
                                      {client.accountsReceivable > 1000000 && (
                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                      )}
                                    </CardTitle>
                                  </div>
                                  {client.artistName && (
                                    <CardDescription className="text-xs">
                                      {client.artistName}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="space-y-1 text-xs">
                                    {/* Afficher téléphone */}
                                    {client.phone ? (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span>{client.phone}</span>
                                      </div>
                                    ) : null}

                                    {/* Afficher email principal */}
                                    {client.email ? (
                                      <div className="flex items-center gap-1 text-muted-foreground truncate">
                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{client.email}</span>
                                      </div>
                                    ) : null}
                                  </div>
                                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                                    <Link to={`/clients/${client.id}`}>
                                      <Eye className="h-3 w-3 mr-2" />
                                      Voir
                                    </Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          {filteredClients.filter(c => c.type === 'individual').length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              Aucun particulier
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Entreprises Column */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <h3 className="font-semibold">Entreprises</h3>
                          <Badge variant="secondary">
                            {filteredClients.filter(c => c.type === 'company').length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {filteredClients
                            .filter(c => c.type === 'company')
                            .map((client) => (
                              <Card key={client.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      {client.name}
                                      {client.accountsReceivable > 1000000 && (
                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                      )}
                                    </CardTitle>
                                  </div>
                                  {client.artistName && (
                                    <CardDescription className="text-xs">
                                      {client.artistName}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="space-y-1 text-xs">
                                    {/* Afficher téléphone */}
                                    {client.phone ? (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span>{client.phone}</span>
                                      </div>
                                    ) : null}

                                    {/* Afficher email principal */}
                                    {client.email ? (
                                      <div className="flex items-center gap-1 text-muted-foreground truncate">
                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{client.email}</span>
                                      </div>
                                    ) : null}
                                  </div>
                                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                                    <Link to={`/clients/${client.id}`}>
                                      <Eye className="h-3 w-3 mr-2" />
                                      Voir
                                    </Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          {filteredClients.filter(c => c.type === 'company').length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              Aucune entreprise
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">Aucun client</h3>
                <p className="text-sm text-muted-foreground mb-3">Commencez par ajouter votre premier client</p>
                <Button asChild size="sm">
                  <Link to="/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau client
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
    </div>
  );
}

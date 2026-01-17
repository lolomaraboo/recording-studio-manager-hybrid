import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { cn, getInitials } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Users, Plus, Search, ArrowLeft, Mail, Phone, Star, FileDown, FileUp, Download, Eye, Pencil, Table as TableIcon, Grid, Columns, ArrowUpDown, ArrowUp, ArrowDown, Building2, MapPin, Copy } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ImportClientsDialog } from "@/components/ImportClientsDialog";

type ViewMode = 'table' | 'grid' | 'kanban';
type SortField = 'name' | 'type' | 'sessions' | 'accountsReceivable' | 'lastSession';
type SortOrder = 'asc' | 'desc';

/**
 * Copy button for email/phone with toast feedback
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié!`);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 p-0"
      onClick={handleCopy}
      title={`Copier ${label.toLowerCase()}`}
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}

/**
 * Company badge with tooltip showing company names
 * For individuals: Shows "X entreprise(s)" with tooltip
 * For companies: Shows "Entreprise"
 */
function CompanyBadge({
  clientType,
  companies
}: {
  clientType: 'individual' | 'company';
  companies: { companyName: string; isPrimary: boolean }[];
}) {
  if (clientType === 'company') {
    return (
      <Badge variant="outline" className="capitalize">
        Entreprise
      </Badge>
    );
  }

  // Individual with companies
  if (companies.length === 0) {
    return (
      <Badge variant="outline" className="capitalize">
        Particulier
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="cursor-help">
            {companies.length} entreprise{companies.length > 1 ? 's' : ''}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            {companies.map((company, idx) => (
              <div key={idx} className="flex items-center gap-1 text-sm">
                {company.isPrimary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                <span>{company.companyName}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFormat, setImportFormat] = useState<'vcard' | 'excel' | 'csv'>('vcard');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Restore view mode from localStorage
    const saved = localStorage.getItem('clientsViewMode');
    return (saved as ViewMode) || 'table';
  });
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('clientsViewMode', viewMode);
  }, [viewMode]);

  const { data: clients, isLoading: clientsLoading, refetch } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });

  // Load ALL company members (Kanban, Table, and Grid views)
  // Single query prevents React Hooks violation
  // Filtered client-side by companyId in render
  const allMembersQuery = trpc.clients.getAllMembers.useQuery(
    undefined,
    { enabled: viewMode === 'kanban' || viewMode === 'table' || viewMode === 'grid' }
  );

  // Load companies for contacts (for Type column badge)
  const { data: companiesForContacts } = trpc.clients.getAllCompaniesForContacts.useQuery();

  // Map memberId → companies[] for Type column display
  const companiesByMember = useMemo(() => {
    const map = new Map<number, { companyName: string; isPrimary: boolean }[]>();

    companiesForContacts?.forEach(c => {
      if (!map.has(c.memberId)) {
        map.set(c.memberId, []);
      }
      map.get(c.memberId)!.push({
        companyName: c.companyName,
        isPrimary: c.isPrimary
      });
    });

    return map;
  }, [companiesForContacts]);

  // Map companyId → contacts[] for Contact column tooltip
  const contactsByCompany = useMemo(() => {
    const map = new Map<number, { memberName: string; role: string | null; isPrimary: boolean }[]>();

    allMembersQuery.data?.forEach(m => {
      if (!map.has(m.companyId)) {
        map.set(m.companyId, []);
      }
      map.get(m.companyId)!.push({
        memberName: m.memberName,
        role: m.role,
        isPrimary: m.isPrimary
      });
    });

    return map;
  }, [allMembersQuery.data]);

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

  // Note: Removed batch loading to avoid React Hooks violation
  // Contacts are now loaded per-card in Kanban view

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = clientsWithStats;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) => {
          // Search in basic client fields
          const matchesBasicFields =
            client.name.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.artistName?.toLowerCase().includes(query);

          // For companies: also search in contact names
          if (client.type === 'company') {
            const contacts = contactsByCompany.get(client.id);
            const matchesContactName = contacts?.some(contact =>
              contact.memberName.toLowerCase().includes(query)
            );
            return matchesBasicFields || matchesContactName;
          }

          return matchesBasicFields;
        }
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
  }, [clientsWithStats, searchQuery, sortField, sortOrder, contactsByCompany]);

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
                          <div className="flex items-center justify-start gap-1 whitespace-nowrap">
                            Client
                            {sortField === 'name' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Email / Téléphone</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSort('sessions')}
                        >
                          <div className="flex items-center justify-start gap-1 whitespace-nowrap">
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
                          <div className="flex items-center justify-start gap-1 whitespace-nowrap">
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
                          <div className="flex items-center justify-start gap-1 whitespace-nowrap">
                            Dernière session
                            {sortField === 'lastSession' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
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
                            {client.type === 'individual' ? (
                              <CompanyBadge
                                clientType={client.type}
                                companies={companiesByMember.get(client.id) || []}
                              />
                            ) : (
                              client.contactsCount > 0 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer">
                                      {client.contactsCount} contact{client.contactsCount > 1 ? 's' : ''}
                                    </Badge>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto">
                                    <div className="space-y-1">
                                      {contactsByCompany.get(client.id)?.map((contact, idx) => {
                                        // Find the contact's memberId from allMembersQuery
                                        const memberData = allMembersQuery.data?.find(
                                          m => m.companyId === client.id && m.memberName === contact.memberName
                                        );
                                        return (
                                          <Link
                                            key={idx}
                                            to={`/clients/${memberData?.memberId}`}
                                            className="flex items-center gap-1 text-sm hover:bg-accent p-1 rounded transition-colors"
                                          >
                                            {contact.isPrimary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                            <span className="font-medium">{contact.memberName}</span>
                                            {contact.role && <span className="text-muted-foreground">- {contact.role}</span>}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {client.email && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <a href={`mailto:${client.email}`} className="hover:underline">
                                    {client.email}
                                  </a>
                                  <CopyButton text={client.email} label="Email" />
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <a href={`tel:${client.phone}`} className="hover:underline">
                                    {client.phone}
                                  </a>
                                  <CopyButton text={client.phone} label="Téléphone" />
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
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/clients/${client.id}?edit=true`}>
                                  <Pencil className="h-3 w-3" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/clients/${client.id}`}>
                                  <Eye className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                    </div>
                  )}

                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredClients.map((client) => (
                      <Card key={client.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              {/* Prominent avatar - primary visual anchor */}
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={client.type === 'company' ? (client.logoUrl ?? undefined) : (client.avatarUrl ?? undefined)} />
                                <AvatarFallback className="text-sm font-semibold">
                                  {getInitials(client.name)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <span className="truncate">{client.name}</span>
                                  {client.accountsReceivable > 100000 && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                  )}
                                </CardTitle>
                                {client.artistName && (
                                  <CardDescription className="text-sm truncate">
                                    {client.artistName}
                                  </CardDescription>
                                )}
                              </div>
                            </div>

                            {/* Type badge - visual category indicator */}
                            <div className="flex flex-col gap-1">
                              <CompanyBadge
                                clientType={client.type}
                                companies={companiesByMember.get(client.id) || []}
                              />
                              {client.type === 'company' && client.contactsCount > 0 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Badge variant="outline" className="text-xs w-fit cursor-pointer">
                                      {client.contactsCount} contact{client.contactsCount > 1 ? 's' : ''}
                                    </Badge>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto">
                                    <div className="space-y-1">
                                      {contactsByCompany.get(client.id)?.map((contact, idx) => {
                                        // Find the contact's memberId from allMembersQuery
                                        const memberData = allMembersQuery.data?.find(
                                          m => m.companyId === client.id && m.memberName === contact.memberName
                                        );
                                        return (
                                          <Link
                                            key={idx}
                                            to={`/clients/${memberData?.memberId}`}
                                            className="flex items-center gap-1 text-sm hover:bg-accent p-1 rounded transition-colors"
                                          >
                                            {contact.isPrimary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                            <span className="font-medium">{contact.memberName}</span>
                                            {contact.role && <span className="text-muted-foreground">- {contact.role}</span>}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                          <CardContent className="space-y-2">
                            {/* Primary contact only - minimal scanning */}
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <a
                                  href={`tel:${client.phone}`}
                                  className="hover:underline truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {client.phone}
                                </a>
                                <CopyButton text={client.phone} label="Téléphone" />
                              </div>
                            )}

                            {client.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <a
                                  href={`mailto:${client.email}`}
                                  className="hover:underline truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {client.email}
                                </a>
                                <CopyButton text={client.email} label="Email" />
                              </div>
                            )}

                            {/* Stats badges - compact indicators */}
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {client.sessionsCount} sessions
                              </Badge>
                              {client.accountsReceivable > 0 && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    client.accountsReceivable > 100000 ? "text-orange-600 border-orange-600" : ""
                                  )}
                                >
                                  {(client.accountsReceivable / 100).toFixed(0)}€
                                </Badge>
                              )}
                            </div>

                            {/* Minimal action button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              asChild
                            >
                              <Link to={`/clients/${client.id}`}>
                                <Eye className="h-3 w-3 mr-1" /> Voir
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
                          <h3 className="font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Particuliers
                          </h3>
                          <Badge variant="secondary">
                            {filteredClients.filter(c => c.type === 'individual').length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {filteredClients
                            .filter(c => c.type === 'individual')
                            .map((client) => (
                              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start gap-3">
                                    {/* Compact avatar - secondary to content */}
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={client.avatarUrl ?? undefined} />
                                      <AvatarFallback className="text-xs font-semibold">
                                        {getInitials(client.name)}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <span className="truncate">{client.name}</span>
                                        {client.accountsReceivable > 100000 && (
                                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                        )}
                                      </CardTitle>
                                      {client.artistName && (
                                        <CardDescription className="text-xs truncate">
                                          {client.artistName}
                                        </CardDescription>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                  {/* Full contact info section */}
                                  <div className="space-y-1 text-xs">
                                    {client.phone && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-3 w-3 flex-shrink-0" />
                                        <a
                                          href={`tel:${client.phone}`}
                                          className="hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {client.phone}
                                        </a>
                                        <CopyButton text={client.phone} label="Téléphone" />
                                      </div>
                                    )}
                                    {client.email && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                        <a
                                          href={`mailto:${client.email}`}
                                          className="hover:underline truncate"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {client.email}
                                        </a>
                                        <CopyButton text={client.email} label="Email" />
                                      </div>
                                    )}
                                    {client.city && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{client.city}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Workflow indicators - Extended context */}
                                  <div className="space-y-2 text-xs border-t pt-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Sessions:</span>
                                      <span className="font-medium">{client.sessionsCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Dernière session:</span>
                                      <span className="font-medium">
                                        {client.lastSessionAt
                                          ? format(new Date(client.lastSessionAt), "dd MMM yyyy", { locale: fr })
                                          : "Jamais"
                                        }
                                      </span>
                                    </div>
                                    {client.accountsReceivable > 0 && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Comptes débiteurs:</span>
                                        <span
                                          className={cn(
                                            "font-medium",
                                            client.accountsReceivable > 100000 ? "text-orange-600" : ""
                                          )}
                                        >
                                          {(client.accountsReceivable / 100).toFixed(2)}€
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Notes preview (if exists) */}
                                  {client.notes && (
                                    <div className="text-xs text-muted-foreground border-t pt-2">
                                      <p className="line-clamp-2">{client.notes}</p>
                                    </div>
                                  )}

                                  {/* Action button - more descriptive */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    asChild
                                  >
                                    <Link to={`/clients/${client.id}`}>
                                      <Eye className="h-3 w-3 mr-2" />
                                      Voir détails complet
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
                          <h3 className="font-semibold flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Entreprises
                          </h3>
                          <Badge variant="secondary">
                            {filteredClients.filter(c => c.type === 'company').length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {filteredClients
                            .filter(c => c.type === 'company')
                            .map((client) => (
                              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start gap-3">
                                    {/* Compact avatar - secondary to content */}
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={client.logoUrl ?? undefined} />
                                      <AvatarFallback className="text-xs font-semibold">
                                        {getInitials(client.name)}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <span className="truncate">{client.name}</span>
                                        {client.accountsReceivable > 100000 && (
                                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                        )}
                                      </CardTitle>
                                      {client.artistName && (
                                        <CardDescription className="text-xs truncate">
                                          {client.artistName}
                                        </CardDescription>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                  {/* Full contact info section */}
                                  <div className="space-y-1 text-xs">
                                    {client.phone && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-3 w-3 flex-shrink-0" />
                                        <a
                                          href={`tel:${client.phone}`}
                                          className="hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {client.phone}
                                        </a>
                                        <CopyButton text={client.phone} label="Téléphone" />
                                      </div>
                                    )}
                                    {client.email && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                        <a
                                          href={`mailto:${client.email}`}
                                          className="hover:underline truncate"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {client.email}
                                        </a>
                                        <CopyButton text={client.email} label="Email" />
                                      </div>
                                    )}
                                    {client.city && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{client.city}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Workflow indicators - Extended context */}
                                  <div className="space-y-2 text-xs border-t pt-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Sessions:</span>
                                      <span className="font-medium">{client.sessionsCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Dernière session:</span>
                                      <span className="font-medium">
                                        {client.lastSessionAt
                                          ? format(new Date(client.lastSessionAt), "dd MMM yyyy", { locale: fr })
                                          : "Jamais"
                                        }
                                      </span>
                                    </div>
                                    {client.accountsReceivable > 0 && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Comptes débiteurs:</span>
                                        <span
                                          className={cn(
                                            "font-medium",
                                            client.accountsReceivable > 100000 ? "text-orange-600" : ""
                                          )}
                                        >
                                          {(client.accountsReceivable / 100).toFixed(2)}€
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Notes preview (if exists) */}
                                  {client.notes && (
                                    <div className="text-xs text-muted-foreground border-t pt-2">
                                      <p className="line-clamp-2">{client.notes}</p>
                                    </div>
                                  )}

                                  {/* Company members list (Kanban view) */}
                                  {(() => {
                                    // Filter members for this company (client-side)
                                    const members = allMembersQuery.data?.filter(
                                      m => m.companyId === client.id
                                    ) || [];

                                    if (viewMode !== 'kanban' || client.type !== 'company' || members.length === 0) {
                                      return null;
                                    }

                                    return (
                                      <div className="border-t pt-2 space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">
                                          Contacts ({members.length})
                                        </div>
                                        {members.map((m) => (
                                          <Link
                                            to={`/clients/${m.memberId}`}
                                            key={m.memberId}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className="flex items-center gap-1 text-xs hover:bg-accent p-1 rounded transition-colors">
                                              {m.isPrimary && (
                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                              )}
                                              <span className="font-medium truncate">{m.memberName}</span>
                                              {m.role && (
                                                <span className="text-muted-foreground truncate">- {m.role}</span>
                                              )}
                                            </div>
                                          </Link>
                                        ))}
                                      </div>
                                    );
                                  })()}

                                  {/* Action button - more descriptive */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    asChild
                                  >
                                    <Link to={`/clients/${client.id}`}>
                                      <Eye className="h-3 w-3 mr-2" />
                                      Voir détails complet
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

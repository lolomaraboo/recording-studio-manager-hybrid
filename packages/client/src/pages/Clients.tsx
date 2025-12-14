import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Mail, Phone, Pencil, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Client type from API with calculated stats
 */
interface ClientWithStats {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  artistName: string | null;
  type: string;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  isVip: boolean;
  isActive: boolean;
  portalAccess: boolean;
  sessionsCount: number;
  revenue: number;
}

export function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithStats | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientWithStats | null>(null);

  const utils = trpc.useUtils();
  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 1000 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 1000 });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success('Client deleted successfully');
      utils.clients.list.invalidate();
      setDeletingClient(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete client');
    },
  });

  // Calculate stats per client
  const clientsWithStats: ClientWithStats[] = useMemo(() => {
    return clients?.map(client => {
      const clientSessions = sessions?.filter(s => s.clientId === client.id) || [];
      const clientInvoices = invoices?.filter(inv => inv.clientId === client.id) || [];
      const revenue = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

      return {
        ...client,
        sessionsCount: clientSessions.length,
        revenue: revenue,
      };
    }) || [];
  }, [clients, sessions, invoices]);

  // Calculate totals
  const totalClients = clientsWithStats.length;
  const totalRevenue = clientsWithStats.reduce((sum, c) => sum + c.revenue, 0);
  const totalSessions = clientsWithStats.reduce((sum, c) => sum + c.sessionsCount, 0);
  const avgRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;

  // DataTable columns
  const columns: Column<ClientWithStats>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (row) => row.email || '-',
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (row) => row.phone || '-',
    },
    {
      key: 'artistName',
      header: 'Artist Name',
      cell: (row) => row.artistName || '-',
    },
    {
      key: 'sessions',
      header: 'Sessions',
      cell: (row) => row.sessionsCount,
      sortable: true,
      sortFn: (a, b) => a.sessionsCount - b.sessionsCount,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      cell: (row) => (
        <span className="text-green-600 font-medium">
          ${row.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
      sortable: true,
      sortFn: (a, b) => a.revenue - b.revenue,
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingClient(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  function handleEdit(client: ClientWithStats) {
    setEditingClient(client);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingClient(null);
    setShowForm(true);
  }

  function handleDelete() {
    if (deletingClient) {
      deleteMutation.mutate({ id: deletingClient.id });
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-500">Manage your client relationships</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Avg Revenue/Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${avgRevenuePerClient.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Grid */}
      {clientsWithStats.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clientsWithStats.slice(0, 6).map((client) => (
            <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleEdit(client)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {client.name}
                  {client.artistName && (
                    <span className="text-sm font-normal text-gray-500">{client.artistName}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <p className="text-xs text-gray-500">Sessions</p>
                    <p className="text-lg font-bold">{client.sessionsCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-lg font-bold text-green-600">
                      ${client.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Clients DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={clientsWithStats}
            columns={columns}
            getRowKey={(row) => row.id}
            searchable
            searchPlaceholder="Search clients..."
            searchFilter={(row, query) =>
              row.name.toLowerCase().includes(query) ||
              (row.email?.toLowerCase().includes(query) ?? false) ||
              (row.artistName?.toLowerCase().includes(query) ?? false)
            }
            paginated
            pageSize={10}
            isLoading={clientsLoading}
            emptyMessage="No clients found. Create your first client!"
            onRowClick={handleEdit}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <ClientFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        client={editingClient}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
        title="Delete Client"
        description={`Are you sure you want to delete "${deletingClient?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

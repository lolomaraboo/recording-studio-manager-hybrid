import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Mail, Phone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { trpc } from '@/lib/trpc';
import { useMemo } from 'react';

export function Clients() {
  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 1000 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 1000 });

  // Calculate stats per client
  const clientsWithStats = useMemo(() => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-500">Manage your client relationships</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Clients Grid */}
      {clientsLoading ? (
        <p className="text-gray-500">Loading clients...</p>
      ) : clientsWithStats.length === 0 ? (
        <p className="text-gray-500">No clients found. Add your first client!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clientsWithStats.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle>{client.name}</CardTitle>
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
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <p className="text-gray-500">Loading clients...</p>
          ) : clientsWithStats.length === 0 ? (
            <p className="text-gray-500">No clients found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithStats.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.sessionsCount}</TableCell>
                    <TableCell className="text-green-600">
                      ${client.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

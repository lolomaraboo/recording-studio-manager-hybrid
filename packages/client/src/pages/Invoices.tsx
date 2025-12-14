import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download } from 'lucide-react';
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

export function Invoices() {
  const { data: invoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });

  // Create a map of client IDs to client names
  const clientMap = useMemo(() => {
    return clients?.reduce((acc, client) => {
      acc[client.id] = client.name;
      return acc;
    }, {} as Record<number, string>) || {};
  }, [clients]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!invoices) return { total: 0, paid: 0, pending: 0, paidCount: 0, pendingCount: 0 };

    const total = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');

    const paid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const pending = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

    return {
      total,
      paid,
      pending,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
    };
  }, [invoices]);

  // Sort invoices by issue date (most recent first)
  const sortedInvoices = useMemo(() => {
    return invoices?.slice().sort((a, b) =>
      new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    ) || [];
  }, [invoices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-500">Track and manage your invoices</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      {invoicesLoading ? (
        <p className="text-gray-500">Loading stats...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500">{stats.paidCount} {stats.paidCount === 1 ? 'invoice' : 'invoices'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${stats.pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500">{stats.pendingCount} {stats.pendingCount === 1 ? 'invoice' : 'invoices'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <p className="text-gray-500">Loading invoices...</p>
          ) : sortedInvoices.length === 0 ? (
            <p className="text-gray-500">No invoices found. Create your first invoice!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{clientMap[invoice.clientId] || 'Unknown Client'}</TableCell>
                    <TableCell className="font-semibold">
                      ${parseFloat(invoice.total || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(invoice.status)}`}
                      >
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
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

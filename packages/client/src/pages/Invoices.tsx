import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Pencil, Trash2, FileText } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InvoiceFormDialog } from '@/components/invoices/InvoiceFormDialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Invoice type from API with client name
 */
interface InvoiceWithDetails {
  id: number;
  clientId: number;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  status: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  notes: string | null;
  clientName: string;
  isOverdue: boolean;
}

export function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithDetails | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceWithDetails | null>(null);

  const utils = trpc.useUtils();
  const { data: invoices, isLoading } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      utils.invoices.list.invalidate();
      setDeletingInvoice(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete invoice');
    },
  });

  // Create client lookup map
  const clientMap = useMemo(() => {
    return clients?.reduce((acc, client) => {
      acc[client.id] = client.name;
      return acc;
    }, {} as Record<number, string>) || {};
  }, [clients]);

  // Invoices with enriched data
  const invoicesWithDetails: InvoiceWithDetails[] = useMemo(() => {
    const today = new Date();
    return invoices?.map((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const isOverdue = invoice.status !== 'paid' && invoice.status !== 'cancelled' && dueDate < today;

      return {
        ...invoice,
        clientName: clientMap[invoice.clientId] || 'Unknown Client',
        isOverdue,
      };
    }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()) || [];
  }, [invoices, clientMap]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!invoicesWithDetails.length) {
      return { total: 0, paid: 0, pending: 0, overdue: 0, draft: 0 };
    }

    const total = invoicesWithDetails.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const paid = invoicesWithDetails
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const pending = invoicesWithDetails
      .filter((inv) => inv.status === 'sent')
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const overdue = invoicesWithDetails
      .filter((inv) => inv.status === 'overdue' || inv.isOverdue)
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const draft = invoicesWithDetails
      .filter((inv) => inv.status === 'draft')
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

    return { total, paid, pending, overdue, draft };
  }, [invoicesWithDetails]);

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue && status !== 'paid' && status !== 'cancelled') {
      return 'bg-red-100 text-red-800';
    }
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
        return 'bg-gray-100 text-gray-500 line-through';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // DataTable columns
  const columns: Column<InvoiceWithDetails>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{row.invoiceNumber}</span>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (row) => row.clientName,
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      cell: (row) => new Date(row.issueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      sortable: true,
      sortFn: (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (row) => (
        <span className={row.isOverdue ? 'text-red-600 font-medium' : ''}>
          {new Date(row.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
      sortable: true,
      sortFn: (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    },
    {
      key: 'total',
      header: 'Amount',
      cell: (row) => (
        <span className="font-semibold">
          ${parseFloat(row.total).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
      sortable: true,
      sortFn: (a, b) => parseFloat(a.total) - parseFloat(b.total),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(row.status, row.isOverdue)}`}
        >
          {row.isOverdue && row.status !== 'paid' && row.status !== 'cancelled'
            ? 'overdue'
            : row.status}
        </span>
      ),
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
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Download PDF
              toast.info('PDF export coming soon!');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingInvoice(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-32',
    },
  ];

  function handleEdit(invoice: InvoiceWithDetails) {
    setEditingInvoice(invoice);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingInvoice(null);
    setShowForm(true);
  }

  function handleDelete() {
    if (deletingInvoice) {
      deleteMutation.mutate({ id: deletingInvoice.id });
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-500">Track and manage your invoices</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${stats.total.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${stats.paid.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              ${stats.pending.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              ${stats.overdue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">
              ${stats.draft.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices Cards */}
      {invoicesWithDetails.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {invoicesWithDetails
                .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
                .slice(0, 6)
                .map((invoice) => (
                  <Card
                    key={invoice.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      invoice.isOverdue ? 'border-red-200' : ''
                    }`}
                    onClick={() => handleEdit(invoice)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">{invoice.clientName}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(
                            invoice.status,
                            invoice.isOverdue
                          )}`}
                        >
                          {invoice.isOverdue ? 'overdue' : invoice.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="text-sm text-gray-500">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          ${parseFloat(invoice.total).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={invoicesWithDetails}
            columns={columns}
            getRowKey={(row) => row.id}
            searchable
            searchPlaceholder="Search invoices..."
            searchFilter={(row, query) =>
              row.invoiceNumber.toLowerCase().includes(query) ||
              row.clientName.toLowerCase().includes(query)
            }
            paginated
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No invoices found. Create your first invoice!"
            onRowClick={handleEdit}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <InvoiceFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        invoice={editingInvoice}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice "${deletingInvoice?.invoiceNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

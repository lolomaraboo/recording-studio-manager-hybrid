import { Link } from 'react-router-dom';
import { useClientAuth } from '@/lib/clientAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Calendar, DollarSign, LogOut } from 'lucide-react';

/**
 * Client Portal Invoices Page
 *
 * Shows all invoices for the authenticated client.
 */
export function PortalInvoices() {
  const { client, logout } = useClientAuth();
  const { data: invoices, isLoading } = trpc.clientPortal.invoices.useQuery({ limit: 50 });

  const handleLogout = async () => {
    await logout();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'sent':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'overdue':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Calculate totals
  const totalPaid = invoices
    ?.filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0) || 0;

  const totalOutstanding = invoices
    ?.filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/portal">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="border-l pl-3">
                <h1 className="text-lg font-semibold">My Invoices</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {client?.artistName || client?.name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-2">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Invoices</p>
                  <p className="text-2xl font-bold">{invoices?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold">Invoice History</h2>
          <p className="text-gray-500">View and download your invoices</p>
        </div>

        {invoices && invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-3 ${getStatusColor(invoice.status)}`}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{invoice.invoiceNumber}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Issued: {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Subtotal: ${invoice.subtotal}
                        </p>
                        <p className="text-sm text-gray-500">
                          Tax ({invoice.taxRate}%): ${invoice.taxAmount}
                        </p>
                        <p className="text-xl font-bold text-purple-600">
                          ${invoice.total}
                        </p>
                      </div>
                    </div>
                  </div>
                  {invoice.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {invoice.notes}
                      </p>
                    </div>
                  )}
                  {invoice.paidAt && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-green-600">
                        Paid on {format(new Date(invoice.paidAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
              <p className="text-gray-500">
                You don't have any invoices at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileText,
  Download,
  ArrowRightLeft,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-800' },
  converted: { label: 'Converted', color: 'bg-purple-100 text-purple-800' },
};

export function Quotes() {
  // Fetch quotes
  const { data, isLoading } = trpc.quotes.list.useQuery({ limit: 100 });

  // Fetch stats
  const { data: stats } = trpc.quotes.stats.useQuery();

  // Generate PDF mutation
  const generatePDFMutation = trpc.quotes.generatePDF.useMutation({
    onSuccess: (result) => {
      const blob = new Blob([Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))], {
        type: 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-gray-500">Manage estimates and proposals</p>
        </div>
        <Button onClick={() => toast.info('Create quote dialog coming soon')}>
          <Plus className="h-4 w-4 mr-2" />
          New Quote
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalQuotes || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${stats?.totalValue?.toLocaleString() || '0'} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.byStatus?.draft || 0) + (stats?.byStatus?.sent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats?.pendingValue?.toLocaleString() || '0'} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.byStatus?.accepted || 0) + (stats?.byStatus?.converted || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats?.acceptedValue?.toLocaleString() || '0'} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiringSoon || 0}</div>
            <p className="text-xs text-muted-foreground">within 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.quotes && data.quotes.length > 0 ? (
            <div className="space-y-4">
              {data.quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-purple-600">{quote.quoteNumber}</span>
                      <span className="font-medium">{quote.title}</span>
                      <Badge className={STATUS_CONFIG[quote.status]?.color || 'bg-gray-100'}>
                        {STATUS_CONFIG[quote.status]?.label || quote.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {quote.clientArtistName || quote.clientName}
                      {' - '}
                      Valid until {format(new Date(quote.validUntil), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">
                      ${parseFloat(quote.total).toLocaleString()}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generatePDFMutation.mutate({ id: quote.id })}
                        disabled={generatePDFMutation.isPending}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {quote.status === 'accepted' && !quote.convertedInvoiceId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info('Convert to invoice coming soon')}
                          title="Convert to Invoice"
                        >
                          <ArrowRightLeft className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {quote.status !== 'converted' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info('Delete quote coming soon')}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No quotes yet</p>
              <p className="text-sm">Create your first quote to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

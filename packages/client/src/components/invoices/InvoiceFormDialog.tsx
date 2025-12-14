import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Invoice form validation schema (zod v4 syntax)
 */
const invoiceSchema = z.object({
  clientId: z.number({ error: 'Client is required' }),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().optional(),
  subtotal: z.string().min(1, 'Subtotal is required'),
  taxRate: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

/**
 * Invoice type from API
 */
interface Invoice {
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
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  onSuccess?: () => void;
}

/**
 * Generate next invoice number
 */
function generateInvoiceNumber(existingInvoices: Invoice[] | undefined): string {
  const prefix = 'INV-';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  if (!existingInvoices || existingInvoices.length === 0) {
    return `${prefix}${year}${month}-001`;
  }

  // Find the highest number in current month
  const currentMonthInvoices = existingInvoices
    .map((inv) => inv.invoiceNumber)
    .filter((num) => num.startsWith(`${prefix}${year}${month}`));

  if (currentMonthInvoices.length === 0) {
    return `${prefix}${year}${month}-001`;
  }

  const numbers = currentMonthInvoices
    .map((num) => parseInt(num.split('-').pop() || '0'))
    .filter((n) => !isNaN(n));

  const maxNumber = Math.max(...numbers, 0);
  return `${prefix}${year}${month}-${String(maxNumber + 1).padStart(3, '0')}`;
}

/**
 * Invoice create/edit dialog with form
 */
export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: InvoiceFormDialogProps) {
  const isEditMode = !!invoice;
  const utils = trpc.useUtils();

  // Fetch clients and existing invoices
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: existingInvoices } = trpc.invoices.list.useQuery({ limit: 1000 });

  const nextInvoiceNumber = useMemo(() => {
    return generateInvoiceNumber(existingInvoices);
  }, [existingInvoices]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: undefined,
      invoiceNumber: '',
      issueDate: '',
      dueDate: '',
      subtotal: '',
      taxRate: '20',
      status: 'draft',
      notes: '',
    },
  });

  // Watch subtotal and taxRate to calculate total
  const subtotal = form.watch('subtotal');
  const taxRate = form.watch('taxRate');

  const calculatedValues = useMemo(() => {
    const sub = parseFloat(subtotal) || 0;
    const rate = parseFloat(taxRate || '20') || 0;
    const tax = (sub * rate) / 100;
    const total = sub + tax;
    return { taxAmount: tax, total };
  }, [subtotal, taxRate]);

  // Reset form when dialog opens/closes or invoice changes
  useEffect(() => {
    if (open) {
      if (invoice) {
        form.reset({
          clientId: invoice.clientId,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
          dueDate: invoice.dueDate
            ? new Date(invoice.dueDate).toISOString().split('T')[0]
            : '',
          subtotal: invoice.subtotal,
          taxRate: invoice.taxRate,
          status: invoice.status as InvoiceFormValues['status'],
          notes: invoice.notes || '',
        });
      } else {
        // Default values for new invoice
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 30);

        form.reset({
          clientId: undefined,
          invoiceNumber: nextInvoiceNumber,
          issueDate: today.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          subtotal: '',
          taxRate: '20',
          status: 'draft',
          notes: '',
        });
      }
    }
  }, [open, invoice, form, nextInvoiceNumber]);

  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success('Invoice created successfully');
      utils.invoices.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });

  const updateMutation = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success('Invoice updated successfully');
      utils.invoices.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update invoice');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: InvoiceFormValues) {
    const data = {
      clientId: values.clientId,
      invoiceNumber: values.invoiceNumber,
      issueDate: values.issueDate,
      dueDate: values.dueDate || undefined,
      subtotal: values.subtotal,
      taxRate: values.taxRate || undefined,
      status: values.status,
      notes: values.notes || undefined,
    };

    if (isEditMode && invoice) {
      await updateMutation.mutateAsync({ id: invoice.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Invoice' : 'New Invoice'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-202501-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                            {client.artistName && ` (${client.artistName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Calculated values display */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span>
                  ${(parseFloat(subtotal) || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Tax ({taxRate || '20'}%):
                </span>
                <span>
                  ${calculatedValues.taxAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">
                  ${calculatedValues.total.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Invoice notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : isEditMode
                  ? 'Save Changes'
                  : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

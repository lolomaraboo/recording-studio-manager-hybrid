import { TRPCError } from '@trpc/server';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';
import type { TenantDb } from '@rsm/database/connection';
import {
  invoices,
  invoiceItems,
  timeEntries,
  taskTypes,
  type Invoice,
  type InvoiceItem,
} from '@rsm/database/tenant';

interface GenerateInvoiceOptions {
  timeEntryIds: number[];
  clientId: number;
  mode: 'session' | 'project';
  taxRate?: number; // Defaults to 20.00%
  notes?: string;
}

interface TaskTypeGroup {
  taskTypeId: number;
  taskTypeName: string;
  totalMinutes: number;
  hourlyRate: string; // Decimal as string
  entries: Array<{
    id: number;
    durationMinutes: number;
    hourlyRateSnapshot: string;
  }>;
}

/**
 * Generate an invoice from time entries
 *
 * @param db - Tenant database connection
 * @param options - Invoice generation options
 * @returns Created invoice and invoice items
 */
export async function generateInvoiceFromTimeEntries(
  db: TenantDb,
  options: GenerateInvoiceOptions
): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
  const { timeEntryIds, clientId, mode, taxRate = 20.0, notes } = options;

  // 1. Validate input
  if (timeEntryIds.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'timeEntryIds cannot be empty',
    });
  }

  // 2. Query time entries with task types
  const entries = await db
    .select({
      id: timeEntries.id,
      taskTypeId: timeEntries.taskTypeId,
      taskTypeName: taskTypes.name,
      taskTypeCategory: taskTypes.category,
      sessionId: timeEntries.sessionId,
      projectId: timeEntries.projectId,
      trackId: timeEntries.trackId,
      durationMinutes: timeEntries.durationMinutes,
      hourlyRateSnapshot: timeEntries.hourlyRateSnapshot,
    })
    .from(timeEntries)
    .innerJoin(taskTypes, eq(timeEntries.taskTypeId, taskTypes.id))
    .where(inArray(timeEntries.id, timeEntryIds));

  if (entries.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No time entries found for provided IDs',
    });
  }

  // 3. Validate mode consistency
  if (mode === 'session') {
    const sessionIds = new Set(entries.map((e) => e.sessionId).filter(Boolean));
    if (sessionIds.size !== 1) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'All time entries must belong to the same session for mode=session',
      });
    }
  }

  if (mode === 'project') {
    const projectIds = new Set(entries.map((e) => e.projectId).filter(Boolean));
    if (projectIds.size !== 1) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'All time entries must belong to the same project for mode=project',
      });
    }
  }

  // 4. Filter out non-billable entries
  const billableEntries = entries.filter((e) => e.taskTypeCategory === 'billable');

  if (billableEntries.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No billable time entries found in selection',
    });
  }

  // 5. Group entries by task type
  const groupsMap = new Map<number, TaskTypeGroup>();

  for (const entry of billableEntries) {
    if (!groupsMap.has(entry.taskTypeId)) {
      groupsMap.set(entry.taskTypeId, {
        taskTypeId: entry.taskTypeId,
        taskTypeName: entry.taskTypeName,
        totalMinutes: 0,
        hourlyRate: entry.hourlyRateSnapshot,
        entries: [],
      });
    }

    const group = groupsMap.get(entry.taskTypeId)!;
    group.totalMinutes += entry.durationMinutes || 0;
    group.entries.push({
      id: entry.id,
      durationMinutes: entry.durationMinutes || 0,
      hourlyRateSnapshot: entry.hourlyRateSnapshot,
    });
  }

  const groups = Array.from(groupsMap.values());

  // 6. Calculate amounts for each group
  const lineItems = groups.map((group) => {
    const hours = Math.floor(group.totalMinutes / 60);
    const minutes = group.totalMinutes % 60;
    const hourlyRate = parseFloat(group.hourlyRate);
    const amount = (group.totalMinutes / 60) * hourlyRate;

    return {
      taskTypeName: group.taskTypeName,
      hours,
      minutes,
      hourlyRate: group.hourlyRate,
      amount: amount.toFixed(2),
      description: `${group.taskTypeName} - ${hours}h${minutes.toString().padStart(2, '0')} @ ${parseFloat(group.hourlyRate).toFixed(2)}€/h`,
    };
  });

  // 7. Calculate financial totals
  const subtotal = lineItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // 8. Generate invoice number
  const currentYear = new Date().getFullYear();
  const maxInvoiceResult = await db
    .select({
      maxNumber: sql<string>`COALESCE(MAX(CAST(SUBSTRING(${invoices.invoiceNumber} FROM 'INV-[0-9]+-([0-9]+)') AS INTEGER)), 0)`,
    })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} LIKE ${`INV-${currentYear}-%`}`);

  const nextSequential = (parseInt(maxInvoiceResult[0]?.maxNumber || '0') + 1)
    .toString()
    .padStart(4, '0');
  const invoiceNumber = `INV-${currentYear}-${nextSequential}`;

  // 9. Calculate dates
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);

  // 10. Insert invoice
  const [createdInvoice] = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      clientId,
      status: 'draft',
      issueDate,
      dueDate,
      subtotal: subtotal.toFixed(2),
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      notes: notes || null,
    })
    .returning();

  // 11. Insert invoice items
  const createdItems = await db
    .insert(invoiceItems)
    .values(
      lineItems.map((item) => ({
        invoiceId: createdInvoice.id,
        description: item.description,
        quantity: '1.00',
        unitPrice: item.amount,
        amount: item.amount,
      }))
    )
    .returning();

  return {
    invoice: createdInvoice,
    items: createdItems,
  };
}

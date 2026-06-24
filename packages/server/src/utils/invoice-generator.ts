import { TRPCError } from '@trpc/server';
import { eq, inArray, sql } from 'drizzle-orm';
import type { TenantDb } from '@rsm/database/connection';
import {
  invoices,
  invoiceItems,
  timeEntries,
  taskTypes,
  tracks,
  type Invoice,
  type InvoiceItem,
} from '@rsm/database/tenant';
import { calculateTax, getDefaultTaxRate, validateTaxCalculation } from './tax-calculator';

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
      invoiceId: timeEntries.invoiceId,
      billable: timeEntries.billable,
      // The DB CHECK is exclusive (track XOR session XOR project): an entry
      // tracked on a track carries its project only through the track.
      trackProjectId: tracks.projectId,
    })
    .from(timeEntries)
    .innerJoin(taskTypes, eq(timeEntries.taskTypeId, taskTypes.id))
    .leftJoin(tracks, eq(timeEntries.trackId, tracks.id))
    .where(inArray(timeEntries.id, timeEntryIds));

  if (entries.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No time entries found for provided IDs',
    });
  }

  // 2b. Refuse entries already invoiced (prevents double billing)
  const alreadyInvoiced = entries.filter((e) => e.invoiceId != null);
  if (alreadyInvoiced.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Time entries already invoiced: ${alreadyInvoiced.map((e) => e.id).join(', ')}`,
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
    // Effective project = direct link OR the parent project of the linked track
    const projectIds = new Set(
      entries.map((e) => e.projectId ?? e.trackProjectId).filter(Boolean)
    );
    if (projectIds.size !== 1) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'All time entries must belong to the same project for mode=project',
      });
    }
  }

  // 4. Filter out non-billable entries — the per-entry Clockify-style flag
  // decides ($ toggle); it defaults from the task type category at creation.
  const billableEntries = entries.filter((e) => e.billable !== false);

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

  // 7. Calculate financial totals using tax calculator
  const subtotal = lineItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  // Use tax calculator for robust calculation
  const taxRateToUse = taxRate ?? getDefaultTaxRate();
  const taxResult = calculateTax(subtotal, taxRateToUse);

  // Validate calculation
  validateTaxCalculation(taxResult);

  // 8. Generate invoice number — same FAC-YYYY-NNNN series as the rest of the
  // app (sync create-invoice route, existing tenant data).
  const currentYear = new Date().getFullYear();
  const maxInvoiceResult = await db
    .select({
      maxNumber: sql<string>`COALESCE(MAX(CAST(SUBSTRING(${invoices.invoiceNumber} FROM 'FAC-[0-9]+-([0-9]+)') AS INTEGER)), 0)`,
    })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} LIKE ${`FAC-${currentYear}-%`}`);

  const nextSequential = (parseInt(maxInvoiceResult[0]?.maxNumber || '0') + 1)
    .toString()
    .padStart(4, '0');
  const invoiceNumber = `FAC-${currentYear}-${nextSequential}`;

  // 9. Calculate dates
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);

  // 10-11b. Insert invoice + items and mark entries as invoiced — atomically,
  // so a failure can't leave an invoice without its items or unmarked entries
  // (which would allow double billing).
  const billableIds = billableEntries.map((e) => e.id);
  const { createdInvoice, createdItems } = await db.transaction(async (tx) => {
    const [createdInvoice] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        clientId,
        status: 'draft',
        issueDate,
        dueDate,
        subtotal: taxResult.subtotal,
        taxRate: taxResult.taxRate,
        taxAmount: taxResult.taxAmount,
        total: taxResult.total,
        notes: notes || null,
      })
      .returning();

    const createdItems = await tx
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

    // Mark the billed time entries so they can't be invoiced twice
    await tx
      .update(timeEntries)
      .set({ invoiceId: createdInvoice.id, updatedAt: new Date() })
      .where(inArray(timeEntries.id, billableIds));

    return { createdInvoice, createdItems };
  });

  // 12. Final validation before returning
  validateTaxCalculation({
    subtotal: createdInvoice.subtotal,
    taxRate: createdInvoice.taxRate,
    taxAmount: createdInvoice.taxAmount,
    total: createdInvoice.total,
  });

  return {
    invoice: createdInvoice,
    items: createdItems,
  };
}

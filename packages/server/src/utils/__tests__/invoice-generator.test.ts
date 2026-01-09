import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateInvoiceFromTimeEntries } from '../invoice-generator';
import type { TenantDb } from '@rsm/database/connection';

describe('generateInvoiceFromTimeEntries', () => {
  let mockDb: any;

  beforeEach(() => {
    // Mock database queries
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    };
  });

  it('should generate invoice from time entries with correct calculations', async () => {
    // Mock data: 2h Recording @ 50€/h, 1h Mixing @ 60€/h, 30min Break @ 0€/h
    const mockTimeEntries = [
      {
        id: 1,
        taskTypeId: 1,
        taskTypeName: 'Recording',
        taskTypeCategory: 'billable',
        sessionId: 100,
        projectId: null,
        trackId: null,
        durationMinutes: 120, // 2h
        hourlyRateSnapshot: '50.00',
      },
      {
        id: 2,
        taskTypeId: 2,
        taskTypeName: 'Mixing',
        taskTypeCategory: 'billable',
        sessionId: 100,
        projectId: null,
        trackId: null,
        durationMinutes: 60, // 1h
        hourlyRateSnapshot: '60.00',
      },
      {
        id: 3,
        taskTypeId: 3,
        taskTypeName: 'Break',
        taskTypeCategory: 'non-billable',
        sessionId: 100,
        projectId: null,
        trackId: null,
        durationMinutes: 30, // 30min
        hourlyRateSnapshot: '0.00',
      },
    ];

    // Mock created invoice
    const mockInvoice = {
      id: 1,
      invoiceNumber: 'INV-2026-0001',
      clientId: 5,
      status: 'draft',
      issueDate: new Date('2026-01-09'),
      dueDate: new Date('2026-02-08'),
      subtotal: '160.00',
      taxRate: '20.00',
      taxAmount: '32.00',
      total: '192.00',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock created items
    const mockItems = [
      {
        id: 1,
        invoiceId: 1,
        description: 'Recording - 2h00 @ 50.00€/h',
        quantity: 1,
        unitPrice: '100.00',
        total: '100.00',
        createdAt: new Date(),
      },
      {
        id: 2,
        invoiceId: 1,
        description: 'Mixing - 1h00 @ 60.00€/h',
        quantity: 1,
        unitPrice: '60.00',
        total: '60.00',
        createdAt: new Date(),
      },
    ];

    // Setup mock chain
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockTimeEntries),
        }),
      }),
    });

    // Mock invoice number query (for MAX())
    const maxNumberQuery = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ maxNumber: '0' }]),
        }),
      }),
    };

    // Mock insert chain
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockInvoice]),
      }),
    });

    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(mockItems),
      }),
    });

    // Override db.select for MAX query
    const originalSelect = mockDb.select;
    mockDb.select = vi.fn((args) => {
      if (args && typeof args === 'object' && 'maxNumber' in args) {
        return maxNumberQuery.select(args);
      }
      return originalSelect(args);
    });

    // Execute
    const result = await generateInvoiceFromTimeEntries(mockDb as unknown as TenantDb, {
      timeEntryIds: [1, 2, 3],
      clientId: 5,
      mode: 'session',
      taxRate: 20,
    });

    // Assertions
    expect(result.invoice).toBeDefined();
    expect(result.items).toHaveLength(2); // Break excluded

    // Check invoice calculations
    expect(result.invoice.subtotal).toBe('160.00'); // 100 + 60
    expect(result.invoice.taxAmount).toBe('32.00'); // 160 * 0.20
    expect(result.invoice.total).toBe('192.00'); // 160 + 32

    // Check invoice number format
    expect(result.invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);

    // Check line items
    expect(result.items[0].description).toContain('Recording - 2h00 @ 50.00€/h');
    expect(result.items[0].unitPrice).toBe('100.00');

    expect(result.items[1].description).toContain('Mixing - 1h00 @ 60.00€/h');
    expect(result.items[1].unitPrice).toBe('60.00');
  });

  it('should throw error if no billable entries found', async () => {
    // Mock data: Only non-billable entries
    const mockTimeEntries = [
      {
        id: 1,
        taskTypeId: 1,
        taskTypeName: 'Break',
        taskTypeCategory: 'non-billable',
        sessionId: 100,
        projectId: null,
        trackId: null,
        durationMinutes: 30,
        hourlyRateSnapshot: '0.00',
      },
    ];

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockTimeEntries),
        }),
      }),
    });

    await expect(
      generateInvoiceFromTimeEntries(mockDb as unknown as TenantDb, {
        timeEntryIds: [1],
        clientId: 5,
        mode: 'session',
      })
    ).rejects.toThrow('No billable time entries found in selection');
  });

  it('should throw error if timeEntryIds is empty', async () => {
    await expect(
      generateInvoiceFromTimeEntries(mockDb as unknown as TenantDb, {
        timeEntryIds: [],
        clientId: 5,
        mode: 'session',
      })
    ).rejects.toThrow('timeEntryIds cannot be empty');
  });

  it('should throw error if entries belong to different sessions in session mode', async () => {
    const mockTimeEntries = [
      {
        id: 1,
        taskTypeId: 1,
        taskTypeName: 'Recording',
        taskTypeCategory: 'billable',
        sessionId: 100,
        projectId: null,
        trackId: null,
        durationMinutes: 120,
        hourlyRateSnapshot: '50.00',
      },
      {
        id: 2,
        taskTypeId: 1,
        taskTypeName: 'Recording',
        taskTypeCategory: 'billable',
        sessionId: 200, // Different session!
        projectId: null,
        trackId: null,
        durationMinutes: 60,
        hourlyRateSnapshot: '50.00',
      },
    ];

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockTimeEntries),
        }),
      }),
    });

    await expect(
      generateInvoiceFromTimeEntries(mockDb as unknown as TenantDb, {
        timeEntryIds: [1, 2],
        clientId: 5,
        mode: 'session',
      })
    ).rejects.toThrow('All time entries must belong to the same session for mode=session');
  });
});

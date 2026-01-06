import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { clients, clientNotes, clientContacts } from '@rsm/database/tenant';
import { clientToVCard, parseVCardFile } from '../utils/vcard-service';
import { clientsToExcel, excelToClients, generateExcelTemplate } from '../utils/excel-service';
import { clientsToCSV, csvToClients } from '../utils/csv-service';

/**
 * Clients Router
 *
 * CRUD for clients (stored in Tenant DB)
 *
 * Endpoints:
 * - list: Get all clients for organization
 * - get: Get client by ID
 * - create: Create new client
 * - update: Update client
 * - delete: Delete client
 */
export const clientsRouter = router({
  /**
   * List clients for current organization
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { limit = 50, offset = 0 } = input || {};

      // Get clients with notes metadata
      const clientsList = await tenantDb
        .select({
          id: clients.id,
          userId: clients.userId,
          name: clients.name,
          artistName: clients.artistName,
          email: clients.email,
          phone: clients.phone,
          type: clients.type,
          address: clients.address,
          city: clients.city,
          country: clients.country,
          notes: clients.notes,
          isVip: clients.isVip,
          isActive: clients.isActive,
          portalAccess: clients.portalAccess,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
          notesCount: sql<number>`CAST(COUNT(${clientNotes.id}) AS INTEGER)`,
          lastNoteDate: sql<Date | null>`MAX(${clientNotes.createdAt})`,
        })
        .from(clients)
        .leftJoin(clientNotes, eq(clients.id, clientNotes.clientId))
        .groupBy(clients.id)
        .limit(limit)
        .offset(offset);

      return clientsList;
    }),

  /**
   * Get client by ID with recent notes
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const client = await tenantDb.query.clients.findFirst({
        where: eq(clients.id, input.id),
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      // Get the 10 most recent notes for this client
      const recentNotes = await tenantDb
        .select()
        .from(clientNotes)
        .where(eq(clientNotes.clientId, input.id))
        .orderBy(desc(clientNotes.createdAt))
        .limit(10);

      return {
        ...client,
        clientNotes: recentNotes,
      };
    }),

  /**
   * Create new client
   */
  create: protectedProcedure
    .input(
      z.object({
        // Basic fields (existing)
        name: z.string().min(2).max(200),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),

        // NEW: vCard enriched fields
        type: z.enum(['individual', 'company']).default('individual'),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        middleName: z.string().optional(),
        prefix: z.string().optional(),
        suffix: z.string().optional(),
        artistName: z.string().optional(),

        // Contact arrays
        phones: z.array(z.object({ type: z.string(), number: z.string() })).optional(),
        emails: z.array(z.object({ type: z.string(), email: z.string() })).optional(),
        websites: z.array(z.object({ type: z.string(), url: z.string() })).optional(),

        // Address details
        street: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),

        // Additional info
        birthday: z.string().optional(), // ISO date string
        gender: z.string().optional(),
        customFields: z.array(z.object({ label: z.string(), type: z.string(), value: z.any() })).optional(),

        // File URLs (from upload endpoints)
        avatarUrl: z.string().optional(),
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Map ALL provided fields (no exclusions)
      const clientData: any = {
        name: input.name,
        type: input.type || 'individual',
      };

      // Add optional basic fields
      if (input.email) clientData.email = input.email;
      if (input.phone) clientData.phone = input.phone;
      if (input.address) clientData.address = input.address;
      if (input.notes) clientData.notes = input.notes;

      // Add enriched structured name fields
      if (input.firstName) clientData.firstName = input.firstName;
      if (input.lastName) clientData.lastName = input.lastName;
      if (input.middleName) clientData.middleName = input.middleName;
      if (input.prefix) clientData.prefix = input.prefix;
      if (input.suffix) clientData.suffix = input.suffix;
      if (input.artistName) clientData.artistName = input.artistName;

      // Add contact arrays (set to empty array if not provided to match schema defaults)
      if (input.phones && input.phones.length > 0) clientData.phones = input.phones;
      if (input.emails && input.emails.length > 0) clientData.emails = input.emails;
      if (input.websites && input.websites.length > 0) clientData.websites = input.websites;

      // Add address details
      if (input.street) clientData.street = input.street;
      if (input.city) clientData.city = input.city;
      if (input.postalCode) clientData.postalCode = input.postalCode;
      if (input.region) clientData.region = input.region;
      if (input.country) clientData.country = input.country;

      // Add additional info
      if (input.birthday) clientData.birthday = input.birthday;
      if (input.gender) clientData.gender = input.gender;
      if (input.customFields && input.customFields.length > 0) clientData.customFields = input.customFields;

      // Add file URLs
      if (input.avatarUrl) clientData.avatarUrl = input.avatarUrl;
      if (input.logoUrl) clientData.logoUrl = input.logoUrl;

      const [client] = await tenantDb
        .insert(clients)
        .values(clientData)
        .returning();

      return client;
    }),

  /**
   * Update client (with vCard fields)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          // Existing fields
          name: z.string().min(2).max(200).optional(),
          artistName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          type: z.enum(['individual', 'company']).optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          country: z.string().optional(),
          notes: z.string().optional(),
          isVip: z.boolean().optional(),
          isActive: z.boolean().optional(),
          portalAccess: z.boolean().optional(),

          // NEW vCard fields
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          middleName: z.string().optional(),
          prefix: z.string().optional(),
          suffix: z.string().optional(),
          avatarUrl: z.string().optional(),
          logoUrl: z.string().optional(),
          phones: z.array(z.object({ type: z.string(), number: z.string() })).optional(),
          emails: z.array(z.object({ type: z.string(), email: z.string() })).optional(),
          websites: z.array(z.object({ type: z.string(), url: z.string() })).optional(),
          street: z.string().optional(),
          postalCode: z.string().optional(),
          region: z.string().optional(),
          birthday: z.string().optional(),
          gender: z.string().optional(),
          customFields: z.array(z.object({ label: z.string(), type: z.string(), value: z.any() })).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [updated] = await tenantDb
        .update(clients)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      return updated;
    }),

  /**
   * Delete client
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb.delete(clients).where(eq(clients.id, input.id));

      return { success: true };
    }),

  /**
   * Get client with contacts (for company clients)
   */
  getWithContacts: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const client = await tenantDb.query.clients.findFirst({
        where: eq(clients.id, input.id),
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      const contacts = await tenantDb
        .select()
        .from(clientContacts)
        .where(eq(clientContacts.clientId, input.id))
        .orderBy(desc(clientContacts.isPrimary), desc(clientContacts.createdAt));

      return {
        ...client,
        contacts,
      };
    }),

  /**
   * Add contact to client
   */
  addContact: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        title: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        isPrimary: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [newContact] = await tenantDb
        .insert(clientContacts)
        .values({
          clientId: input.clientId,
          firstName: input.firstName,
          lastName: input.lastName,
          title: input.title,
          email: input.email,
          phone: input.phone,
          isPrimary: input.isPrimary,
        })
        .returning();

      return newContact;
    }),

  /**
   * Update contact
   */
  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        title: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...data } = input;

      const [updated] = await tenantDb
        .update(clientContacts)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(clientContacts.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      return updated;
    }),

  /**
   * Delete contact
   */
  deleteContact: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb.delete(clientContacts).where(eq(clientContacts.id, input.id));

      return { success: true };
    }),

  /**
   * Export clients as vCard
   */
  exportVCard: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get clients to export
      const query = input.ids
        ? tenantDb.select().from(clients).where(inArray(clients.id, input.ids))
        : tenantDb.select().from(clients);

      const allClients = await query;

      // Filter out invalid clients (no name or empty name) before export
      const validClients = allClients.filter(
        (client) => client.name && client.name.trim() !== ''
      );

      // Generate vCards only for valid clients
      const vcards = await Promise.all(
        validClients.map(async (client) => {
          // Get contacts for this client
          const contacts = await tenantDb
            .select()
            .from(clientContacts)
            .where(eq(clientContacts.clientId, client.id));

          return clientToVCard(client, contacts);
        })
      );

      // Combine all vCards
      const vcardContent = vcards.join('\n');

      return {
        content: vcardContent,
        filename: `clients_${Date.now()}.vcf`,
        mimeType: 'text/vcard',
      };
    }),

  /**
   * Import vCard file
   */
  importVCard: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Parse vCard file (invalid vCards are automatically skipped)
      const parsedClients = parseVCardFile(input.content);

      // Validation: reject if no valid clients found
      if (parsedClients.length === 0) {
        console.error('[importVCard] Validation failed: No valid clients found');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Aucun client valide trouvé dans le fichier vCard. Vérifiez que le champ FN (nom) est présent et non vide.',
        });
      }

      console.log(`[importVCard] Successfully parsed ${parsedClients.length} valid clients`);

      // Preview first 5
      const preview = parsedClients.slice(0, 5);

      // Import all
      const imported = await Promise.all(
        parsedClients.map(async (clientData) => {
          const [newClient] = await tenantDb
            .insert(clients)
            .values({
              ...clientData,
              isActive: true,
              portalAccess: false,
            } as any)
            .returning();

          return newClient;
        })
      );

      return {
        count: imported.length,
        preview,
      };
    }),

  /**
   * Export Excel
   */
  exportExcel: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const query = input.ids
        ? tenantDb.select().from(clients).where(inArray(clients.id, input.ids))
        : tenantDb.select().from(clients);

      const clientsToExport = await query;

      const buffer = await clientsToExcel(clientsToExport);

      return {
        content: buffer.toString('base64'),
        filename: `clients_${Date.now()}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }),

  /**
   * Import Excel
   */
  importExcel: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const buffer = Buffer.from(input.content, 'base64');
      const parsedClients = await excelToClients(buffer);

      const preview = parsedClients.slice(0, 5);

      const imported = await Promise.all(
        parsedClients.map(async (clientData) => {
          const [newClient] = await tenantDb
            .insert(clients)
            .values({
              ...clientData,
              isActive: true,
              portalAccess: false,
            } as any)
            .returning();

          return newClient;
        })
      );

      return {
        count: imported.length,
        preview,
      };
    }),

  /**
   * Download Excel template
   */
  downloadExcelTemplate: protectedProcedure
    .query(async () => {
      const buffer = await generateExcelTemplate();

      return {
        content: buffer.toString('base64'),
        filename: 'template_clients.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }),

  /**
   * Export CSV
   */
  exportCSV: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const query = input.ids
        ? tenantDb.select().from(clients).where(inArray(clients.id, input.ids))
        : tenantDb.select().from(clients);

      const clientsToExport = await query;

      const csv = clientsToCSV(clientsToExport);

      return {
        content: csv,
        filename: `clients_${Date.now()}.csv`,
        mimeType: 'text/csv',
      };
    }),

  /**
   * Import CSV
   */
  importCSV: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const parsedClients = csvToClients(input.content);

      const preview = parsedClients.slice(0, 5);

      const imported = await Promise.all(
        parsedClients.map(async (clientData) => {
          const [newClient] = await tenantDb
            .insert(clients)
            .values({
              ...clientData,
              isActive: true,
              portalAccess: false,
            } as any)
            .returning();

          return newClient;
        })
      );

      return {
        count: imported.length,
        preview,
      };
    }),
});

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc, sql, inArray, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { router, protectedProcedure } from '../_core/trpc';
import { clients, clientNotes, clientContacts, companyMembers, invoices, quotes, projects, tracks, sessions } from '@rsm/database/tenant';
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
          search: z.string().optional(),
          searchQuery: z.string().optional(), // Unified search across all fields
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { limit = 50, offset = 0, search, searchQuery } = input || {};

      // Split searchQuery into keywords (space-separated)
      const keywords = searchQuery
        ? searchQuery.trim().toLowerCase().split(/\s+/).filter(k => k.length > 0)
        : [];

      // Build base query
      let query = tenantDb
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
          avatarUrl: clients.avatarUrl,
          logoUrl: clients.logoUrl,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
          notesCount: sql<number>`CAST(COUNT(DISTINCT ${clientNotes.id}) AS INTEGER)`,
          lastNoteDate: sql<Date | null>`MAX(${clientNotes.createdAt})`,
          contactsCount: sql<number>`CAST(COUNT(DISTINCT ${companyMembers.id}) AS INTEGER)`,
        })
        .from(clients)
        .leftJoin(clientNotes, eq(clients.id, clientNotes.clientId))
        .leftJoin(companyMembers, eq(clients.id, companyMembers.companyClientId))
        .groupBy(clients.id)
        .$dynamic();

      // Apply filters conditionally
      const conditions: any[] = [];

      // Legacy search filter (name/email) - kept for backward compatibility
      if (search) {
        conditions.push(
          sql`${clients.name} ILIKE ${`%${search}%`} OR ${clients.email} ILIKE ${`%${search}%`}`
        );
      }

      // Unified search query (keywords with AND logic)
      // Each keyword must match at least one field (OR within keyword)
      // All keywords must be present somewhere (AND between keywords)
      if (keywords.length > 0) {
        const keywordConditions = keywords.map(keyword =>
          sql`(
            ${clients.name} ILIKE ${`%${keyword}%`} OR
            ${clients.email} ILIKE ${`%${keyword}%`} OR
            ${clients.artistName} ILIKE ${`%${keyword}%`} OR
            ${clients.genres}::text ILIKE ${`%${keyword}%`} OR
            ${clients.instruments}::text ILIKE ${`%${keyword}%`}
          )`
        );
        conditions.push(sql.join(keywordConditions, sql` AND `));
      }

      // Apply all conditions with AND logic
      if (conditions.length > 0) {
        query = query.where(sql.join(conditions, sql` AND `)) as typeof query;
      }

      // Apply pagination
      const clientsList = await query.limit(limit).offset(offset);

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
   * Get members of a company (many-to-many)
   * Returns individual clients linked to this company via company_members table
   */
  getMembers: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get all members linked to this company
      const members = await tenantDb
        .select({
          id: companyMembers.id,
          role: companyMembers.role,
          isPrimary: companyMembers.isPrimary,
          member: {
            id: clients.id,
            name: clients.name,
            firstName: clients.firstName,
            lastName: clients.lastName,
            email: clients.email,
            phone: clients.phone,
            avatarUrl: clients.avatarUrl,
          },
        })
        .from(companyMembers)
        .innerJoin(clients, eq(companyMembers.memberClientId, clients.id))
        .where(eq(companyMembers.companyClientId, input.companyId))
        .orderBy(
          desc(companyMembers.isPrimary),
          asc(clients.lastName),
          asc(clients.name)
        );

      return members;
    }),

  /**
   * Get ALL company members for current organization
   * Used by Kanban view to load all members in single query (prevents React Hooks violation)
   * Returns flattened structure for efficient client-side filtering
   */
  getAllMembers: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();

    const memberships = await tenantDb
      .select({
        companyId: companyMembers.companyClientId,
        memberId: companyMembers.memberClientId,
        isPrimary: companyMembers.isPrimary,
        role: companyMembers.role,
        memberName: clients.name,
        memberEmail: clients.email,
        memberPhone: clients.phone,
      })
      .from(companyMembers)
      .innerJoin(clients, eq(companyMembers.memberClientId, clients.id))
      .orderBy(
        desc(companyMembers.isPrimary),
        asc(clients.lastName),
        asc(clients.name)
      );

    return memberships;
  }),

  /**
   * Get ALL companies that individuals belong to (for Type column display)
   * Returns: { memberId, companyId, companyName, isPrimary }[]
   * Used by Table/Grid/Kanban views to show "X entreprise(s)" badge for contacts
   */
  getAllCompaniesForContacts: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();

    const companyClients = alias(clients, 'companyClients');

    const memberships = await tenantDb
      .select({
        memberId: companyMembers.memberClientId,
        companyId: companyMembers.companyClientId,
        companyName: companyClients.name,
        isPrimary: companyMembers.isPrimary,
      })
      .from(companyMembers)
      .innerJoin(companyClients, eq(companyMembers.companyClientId, companyClients.id))
      .orderBy(
        asc(companyMembers.memberClientId),
        desc(companyMembers.isPrimary)
      );

    return memberships;
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
      // Note: userId is intentionally omitted - PostgreSQL allows NULL by default
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

          // Music Profile - Multi-value fields
          genres: z.array(z.string()).optional(),
          instruments: z.array(z.string()).optional(),

          // Streaming Platforms
          spotifyUrl: z.string().optional(),
          appleMusicUrl: z.string().optional(),
          youtubeUrl: z.string().optional(),
          soundcloudUrl: z.string().optional(),
          bandcampUrl: z.string().optional(),
          deezerUrl: z.string().optional(),
          tidalUrl: z.string().optional(),
          amazonMusicUrl: z.string().optional(),
          audiomackUrl: z.string().optional(),
          beatportUrl: z.string().optional(),
          otherPlatformsUrl: z.string().optional(),

          // Industry Information
          recordLabel: z.string().optional(),
          distributor: z.string().optional(),
          managerContact: z.string().optional(),
          publisher: z.string().optional(),
          performanceRightsSociety: z.string().optional(),

          // Career Information
          yearsActive: z.string().optional(),
          notableWorks: z.string().optional(),
          awardsRecognition: z.string().optional(),
          biography: z.string().optional(),
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
        } as any)
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
          try {
            console.log('[importVCard] Inserting client:', JSON.stringify(clientData, null, 2));
            const [newClient] = await tenantDb
              .insert(clients)
              .values({
                ...clientData,
                isActive: true,
                portalAccess: false,
              } as any)
              .returning();

            return newClient;
          } catch (error: any) {
            console.error('[importVCard] Insert failed for client:', clientData.name);
            console.error('[importVCard] Error:', error);
            console.error('[importVCard] Error message:', error.message);
            console.error('[importVCard] Error code:', error.code);
            console.error('[importVCard] Error detail:', error.detail);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Erreur lors de l'import du client "${clientData.name}": ${error.message || error}`,
            });
          }
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

  /**
   * Get client statistics including genre distribution
   */
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get all clients with genres
      const clientsWithGenres = await tenantDb
        .select({
          genres: clients.genres,
        })
        .from(clients)
        .where(sql`${clients.genres} IS NOT NULL AND jsonb_array_length(${clients.genres}) > 0`);

      // Aggregate genre counts
      const genreCounts: Record<string, number> = {};
      clientsWithGenres.forEach(client => {
        (client.genres as string[] || []).forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });

      // Sort by count descending, take top 5
      const topGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre, count]) => ({ genre, count }));

      return {
        genreDistribution: topGenres,
        totalClients: clientsWithGenres.length,
      };
    }),

  /**
   * Get financial stats for a client
   * Returns total paid, pending, quotes open, and projection
   */
  getFinancialStats: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get all invoices for this client
      const clientInvoices = await tenantDb.query.invoices.findMany({
        where: eq(invoices.clientId, input.clientId),
      });

      // Get all quotes for this client
      const clientQuotes = await tenantDb.query.quotes.findMany({
        where: eq(quotes.clientId, input.clientId),
      });

      // Calculate stats
      const totalPaid = clientInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

      const pending = clientInvoices
        .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

      const quotesOpen = clientQuotes
        .filter(q => q.status === 'sent')
        .reduce((sum, q) => sum + parseFloat(q.total || '0'), 0);

      const projection = quotesOpen + pending; // Simplified projection

      return {
        totalPaid,
        pending,
        quotesOpen,
        projection,
      };
    }),

  /**
   * Get projects for a client with aggregated stats
   * Returns projects with tracksCount and hoursRecorded
   */
  getProjects: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Query projects for this client
      const projectsList = await tenantDb
        .select()
        .from(projects)
        .where(eq(projects.clientId, input.clientId));

      // For each project, get tracks and sessions to calculate stats
      const projectsWithStats = await Promise.all(
        projectsList.map(async (project) => {
          // Get tracks count
          const projectTracks = await tenantDb
            .select()
            .from(tracks)
            .where(eq(tracks.projectId, project.id));

          // Get sessions for this project to calculate total hours
          const projectSessions = await tenantDb
            .select()
            .from(sessions)
            .where(eq(sessions.projectId, project.id));

          // Calculate hours recorded from sessions (startTime to endTime)
          const hoursRecorded = projectSessions.reduce((sum, session) => {
            if (session.startTime && session.endTime) {
              const durationMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
              const hours = durationMs / (1000 * 60 * 60);
              return sum + hours;
            }
            return sum;
          }, 0);

          return {
            ...project,
            tracksCount: projectTracks.length,
            hoursRecorded: Math.round(hoursRecorded * 10) / 10, // Round to 1 decimal
          };
        })
      );

      return projectsWithStats;
    }),

  /**
   * Get tracks for a client from all their projects
   * Returns tracks with project title and artist names
   */
  getTracks: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get all projects for this client
      const clientProjects = await tenantDb.query.projects.findMany({
        where: eq(projects.clientId, input.clientId),
      });

      if (clientProjects.length === 0) return [];

      const projectIds = clientProjects.map(p => p.id);

      // Get all tracks from these projects with project title via JOIN
      const clientTracks = await tenantDb
        .select({
          id: tracks.id,
          projectId: tracks.projectId,
          title: tracks.title,
          trackNumber: tracks.trackNumber,
          duration: tracks.duration,
          isrc: tracks.isrc,
          status: tracks.status,
          bpm: tracks.bpm,
          key: tracks.key,
          lyrics: tracks.lyrics,
          fileUrl: tracks.fileUrl,
          waveformUrl: tracks.waveformUrl,
          demoUrl: tracks.demoUrl,
          roughMixUrl: tracks.roughMixUrl,
          finalMixUrl: tracks.finalMixUrl,
          masterUrl: tracks.masterUrl,
          composer: tracks.composer,
          lyricist: tracks.lyricist,
          copyrightHolder: tracks.copyrightHolder,
          copyrightYear: tracks.copyrightYear,
          genreTags: tracks.genreTags,
          mood: tracks.mood,
          language: tracks.language,
          explicitContent: tracks.explicitContent,
          patchPreset: tracks.patchPreset,
          instrumentsUsed: tracks.instrumentsUsed,
          microphonesUsed: tracks.microphonesUsed,
          effectsChain: tracks.effectsChain,
          dawSessionPath: tracks.dawSessionPath,
          recordedInRoomId: tracks.recordedInRoomId,
          notes: tracks.notes,
          technicalNotes: tracks.technicalNotes,
          createdAt: tracks.createdAt,
          updatedAt: tracks.updatedAt,
          projectTitle: projects.title,
        })
        .from(tracks)
        .leftJoin(projects, eq(tracks.projectId, projects.id))
        .where(inArray(tracks.projectId, projectIds));

      return clientTracks.map(track => ({
        ...track,
        projectTitle: track.projectTitle || "Sans projet",
      }));
    }),

  /**
   * Add member to company (or company to individual)
   * Many-to-many relationship via company_members table
   */
  addMember: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      memberId: z.number(),
      role: z.string().nullable().optional(),
      isPrimary: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate that both clients exist
      const [company, member] = await Promise.all([
        tenantDb.select().from(clients).where(eq(clients.id, input.companyId)).limit(1),
        tenantDb.select().from(clients).where(eq(clients.id, input.memberId)).limit(1),
      ]);

      if (!company.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company client not found',
        });
      }

      if (!member.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member client not found',
        });
      }

      // Validate types
      if (company[0].type !== 'company') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Company must be of type "company"',
        });
      }

      if (member[0].type !== 'individual') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Member must be of type "individual"',
        });
      }

      // Check if relationship already exists
      const existing = await tenantDb
        .select()
        .from(companyMembers)
        .where(
          sql`${companyMembers.companyClientId} = ${input.companyId} AND ${companyMembers.memberClientId} = ${input.memberId}`
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This member is already linked to this company',
        });
      }

      // Insert relationship
      const [newMembership] = await tenantDb
        .insert(companyMembers)
        .values({
          companyClientId: input.companyId,
          memberClientId: input.memberId,
          role: input.role || null,
          isPrimary: input.isPrimary,
        })
        .returning();

      return {
        success: true,
        membership: newMembership,
      };
    }),

  /**
   * Update member role and/or isPrimary status
   */
  updateMember: protectedProcedure
    .input(z.object({
      id: z.number(), // company_members.id
      role: z.string().nullable().optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Build update object dynamically
      const updates: any = {
        updatedAt: new Date(),
      };

      if (input.role !== undefined) {
        updates.role = input.role;
      }

      if (input.isPrimary !== undefined) {
        updates.isPrimary = input.isPrimary;
      }

      const [updated] = await tenantDb
        .update(companyMembers)
        .set(updates)
        .where(eq(companyMembers.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Membership not found',
        });
      }

      return updated;
    }),

  /**
   * Remove member from company
   */
  removeMember: protectedProcedure
    .input(z.object({
      id: z.number(), // company_members.id
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [deleted] = await tenantDb
        .delete(companyMembers)
        .where(eq(companyMembers.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Membership not found',
        });
      }

      return {
        success: true,
        message: 'Member removed successfully',
      };
    }),
});

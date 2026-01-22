import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { musicians, trackCredits, tracks, type InsertMusician } from "@rsm/database/tenant/schema";
import { eq, sql, or, and, isNotNull, desc, asc } from "drizzle-orm";

/**
 * Musicians Router
 * Manages musicians/talents (artists, performers, etc.)
 */
export const musiciansRouter = router({
  /**
   * List all musicians for the organization
   * Enhanced with server-side search, sorting, and filtering
   */
  list: protectedProcedure
    .input(
      z
        .object({
          talentType: z.enum(["musician", "actor"]).optional(),
          searchQuery: z.string().optional(),
          sortField: z.enum(['name', 'talentType', 'credits', 'updatedAt']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { talentType, searchQuery, sortField = 'name', sortOrder = 'asc' } = input || {};

      // Build WHERE conditions
      const conditions: any[] = [];

      // Filter by talent type
      if (talentType) {
        conditions.push(eq(musicians.talentType, talentType));
      }

      // Search across multiple fields
      if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        conditions.push(
          or(
            sql`${musicians.name} ILIKE ${searchTerm}`,
            sql`${musicians.stageName} ILIKE ${searchTerm}`,
            sql`${musicians.email} ILIKE ${searchTerm}`,
            sql`${musicians.bio} ILIKE ${searchTerm}`,
            sql`${musicians.genres}::text ILIKE ${searchTerm}`,
            sql`${musicians.instruments}::text ILIKE ${searchTerm}`,
            sql`${musicians.notes} ILIKE ${searchTerm}`
          )
        );
      }

      // Combine conditions
      const whereClause = conditions.length > 0
        ? and(...conditions)
        : undefined;

      // Build ORDER BY clause
      let orderByClause;
      if (sortField === 'name') {
        orderByClause = sortOrder === 'desc' ? desc(musicians.name) : asc(musicians.name);
      } else if (sortField === 'talentType') {
        orderByClause = sortOrder === 'desc' ? desc(musicians.talentType) : asc(musicians.talentType);
      } else if (sortField === 'updatedAt') {
        orderByClause = sortOrder === 'desc' ? desc(musicians.updatedAt) : asc(musicians.updatedAt);
      } else {
        // Default to name ascending
        orderByClause = asc(musicians.name);
      }

      // Execute query with search and sorting
      const musiciansList = await ctx.tenantDb
        .select()
        .from(musicians)
        .where(whereClause)
        .orderBy(orderByClause);

      return musiciansList;
    }),

  /**
   * List musicians with enriched stats (credits count)
   * Used by Talents.tsx for richer display with sorting
   */
  listWithStats: protectedProcedure
    .input(
      z
        .object({
          talentType: z.enum(["musician", "actor"]).optional(),
          searchQuery: z.string().optional(),
          sortField: z.enum(['name', 'talentType', 'credits', 'updatedAt']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { talentType, searchQuery, sortField = 'name', sortOrder = 'asc' } = input || {};

      // Build WHERE conditions for search
      const searchConditions: any[] = [];

      // Filter by talent type
      if (talentType) {
        searchConditions.push(eq(musicians.talentType, talentType));
      }

      // Search across multiple fields
      if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        searchConditions.push(
          or(
            sql`${musicians.name} ILIKE ${searchTerm}`,
            sql`${musicians.stageName} ILIKE ${searchTerm}`,
            sql`${musicians.email} ILIKE ${searchTerm}`,
            sql`${musicians.bio} ILIKE ${searchTerm}`,
            sql`${musicians.genres}::text ILIKE ${searchTerm}`,
            sql`${musicians.instruments}::text ILIKE ${searchTerm}`,
            sql`${musicians.notes} ILIKE ${searchTerm}`
          )
        );
      }

      const whereClause = searchConditions.length > 0
        ? and(...searchConditions)
        : undefined;

      // Query with LEFT JOIN to get credits count
      let query = ctx.tenantDb
        .select({
          id: musicians.id,
          name: musicians.name,
          stageName: musicians.stageName,
          email: musicians.email,
          phone: musicians.phone,
          bio: musicians.bio,
          talentType: musicians.talentType,
          primaryInstrument: musicians.primaryInstrument,
          website: musicians.website,
          spotifyUrl: musicians.spotifyUrl,
          hourlyRate: musicians.hourlyRate,
          instruments: musicians.instruments,
          genres: musicians.genres,
          photoUrl: musicians.photoUrl,
          imageUrl: musicians.imageUrl,
          isActive: musicians.isActive,
          notes: musicians.notes,
          createdAt: musicians.createdAt,
          updatedAt: musicians.updatedAt,
          creditsCount: sql<number>`CAST(COUNT(DISTINCT ${trackCredits.id}) AS INTEGER)`,
        })
        .from(musicians)
        .leftJoin(trackCredits, eq(trackCredits.musicianId, musicians.id))
        .where(whereClause)
        .groupBy(musicians.id);

      // Apply sorting
      if (sortField === 'name') {
        query = query.orderBy(sortOrder === 'desc' ? desc(musicians.name) : asc(musicians.name)) as typeof query;
      } else if (sortField === 'talentType') {
        query = query.orderBy(sortOrder === 'desc' ? desc(musicians.talentType) : asc(musicians.talentType)) as typeof query;
      } else if (sortField === 'credits') {
        // Sort by credits count (computed field)
        query = query.orderBy(
          sortOrder === 'desc'
            ? desc(sql<number>`COUNT(DISTINCT ${trackCredits.id})`)
            : asc(sql<number>`COUNT(DISTINCT ${trackCredits.id})`)
        ) as typeof query;
      } else if (sortField === 'updatedAt') {
        query = query.orderBy(sortOrder === 'desc' ? desc(musicians.updatedAt) : asc(musicians.updatedAt)) as typeof query;
      } else {
        // Default to name ascending
        query = query.orderBy(asc(musicians.name)) as typeof query;
      }

      const musiciansWithStats = await query;

      return musiciansWithStats;
    }),

  /**
   * Get a single musician by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const musician = await ctx.tenantDb
        .select()
        .from(musicians)
        .where(eq(musicians.id, input.id))
        .limit(1);

      if (musician.length === 0) {
        throw new Error("Musician not found");
      }

      return musician[0];
    }),

  /**
   * Get statistics about musicians
   * Enhanced with VIP performers and track credits metrics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    // Total musicians count
    const totalResult = await ctx.tenantDb
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(musicians);
    const total = totalResult[0]?.count || 0;

    // Track credits stats (musicians with many credits are "VIP performers")
    const creditStats = await ctx.tenantDb
      .select({
        musicianId: trackCredits.musicianId,
        creditCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(trackCredits)
      .where(isNotNull(trackCredits.musicianId))
      .groupBy(trackCredits.musicianId);

    // VIP performers: musicians with >10 track credits
    const vipPerformers = creditStats.filter(s => s.creditCount > 10).length;

    // Total track credits across all musicians
    const totalCredits = creditStats.reduce((sum, s) => sum + s.creditCount, 0);

    // Most recent musician update (proxy for "last active")
    const recentUpdate = await ctx.tenantDb
      .select({ lastUpdate: sql<Date>`MAX(${musicians.updatedAt})` })
      .from(musicians);
    const lastActivityDate = recentUpdate[0]?.lastUpdate || null;

    return {
      total,
      vipPerformers,
      totalCredits,
      lastActivityDate,
    };
  }),

  /**
   * Create a new musician
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        stageName: z.string().max(255).optional(),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(50).optional(),
        bio: z.string().optional(),
        talentType: z.enum(["musician", "actor"]).default("musician"),
        website: z.string().url().max(500).optional(),
        spotifyUrl: z.string().url().max(500).optional(),
        instruments: z.string().optional(), // JSON string
        genres: z.string().optional(), // JSON string
        imageUrl: z.string().url().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      console.log("=== DEBUG musicians.create ===");
      console.log("Raw input:", JSON.stringify(input, null, 2));

      try {
        // Use raw SQL to insert only provided fields
        const result = await ctx.tenantDb.execute(sql`
          INSERT INTO musicians (name, talent_type)
          VALUES (${input.name}, ${input.talentType})
          RETURNING *
        `);

        console.log("=== INSERT SUCCESS ===");
        console.log("Result:", JSON.stringify(result, null, 2));

        // Result is an array directly, not an object with rows property
        return result[0] as any;
      } catch (error) {
        console.error("=== INSERT ERROR ===");
        console.error("Error:", error);
        console.error("Error message:", error instanceof Error ? error.message : String(error));
        console.error("Error stack:", error instanceof Error ? error.stack : "no stack");
        throw error;
      }
    }),

  /**
   * Update a musician
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        stageName: z.string().max(255).optional(),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(50).optional(),
        bio: z.string().optional(),
        talentType: z.enum(["musician", "actor"]).optional(),
        website: z.string().url().max(500).optional(),
        spotifyUrl: z.string().url().max(500).optional(),
        instruments: z.string().optional(),
        genres: z.string().optional(),
        imageUrl: z.string().url().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const updatedMusician = await ctx.tenantDb
        .update(musicians)
        .set({
          name: input.name,
          stageName: input.stageName,
          email: input.email,
          phone: input.phone,
          bio: input.bio,
          talentType: input.talentType,
          website: input.website,
          spotifyUrl: input.spotifyUrl,
          instruments: input.instruments,
          genres: input.genres,
          imageUrl: input.imageUrl,
          notes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(musicians.id, input.id))
        .returning();

      if (updatedMusician.length === 0) {
        throw new Error("Musician not found");
      }

      return updatedMusician[0];
    }),

  /**
   * Delete a musician
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      await ctx.tenantDb.delete(musicians).where(eq(musicians.id, input.id));

      return { success: true };
    }),
});

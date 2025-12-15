/**
 * Musicians Router
 *
 * Manage musicians and session contributors:
 * - CRUD musicians
 * - Track instruments/skills
 * - Associate with projects/tracks
 * - Credits management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { musicians, projectCredits, projectTracks, projects } from '@rsm/database/tenant';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const musiciansRouter = router({
  // ============ LIST & GET ============

  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { limit = 50, offset = 0, search, isActive } = input || {};
      const db = await ctx.getTenantDb();

      const conditions = [];
      if (search) {
        conditions.push(
          sql`(${musicians.name} ILIKE ${`%${search}%`} OR ${musicians.stageName} ILIKE ${`%${search}%`} OR ${musicians.instruments} ILIKE ${`%${search}%`})`
        );
      }
      if (isActive !== undefined) {
        conditions.push(eq(musicians.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [musicianList, totalResult] = await Promise.all([
        db.select().from(musicians).where(whereClause).limit(limit).offset(offset).orderBy(desc(musicians.createdAt)),
        db.select({ count: count() }).from(musicians).where(whereClause),
      ]);

      return {
        musicians: musicianList,
        total: totalResult[0]?.count || 0,
        limit,
        offset,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const [musician] = await db.select().from(musicians).where(eq(musicians.id, input.id));
      if (!musician) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Musician not found' });
      }

      // Get credits for this musician
      const credits = await db.select({
        credit: projectCredits,
        project: projects,
        track: projectTracks,
      })
        .from(projectCredits)
        .leftJoin(projects, eq(projectCredits.projectId, projects.id))
        .leftJoin(projectTracks, eq(projectCredits.trackId, projectTracks.id))
        .where(eq(projectCredits.musicianId, input.id))
        .orderBy(desc(projectCredits.createdAt));

      return {
        ...musician,
        credits: credits.map(c => ({
          ...c.credit,
          project: c.project,
          track: c.track,
        })),
      };
    }),

  // ============ CRUD ============

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      stageName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      instruments: z.array(z.string()).optional(),
      bio: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [musician] = await db.insert(musicians).values({
        name: input.name,
        stageName: input.stageName,
        email: input.email,
        phone: input.phone,
        instruments: input.instruments ? input.instruments.join(', ') : null,
        bio: input.bio,
        isActive: true,
      }).returning();

      return musician;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      stageName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      instruments: z.array(z.string()).optional(),
      bio: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const { id, instruments, ...updates } = input;

      const [musician] = await db.update(musicians)
        .set({
          ...updates,
          instruments: instruments ? instruments.join(', ') : undefined,
          updatedAt: new Date(),
        })
        .where(eq(musicians.id, id))
        .returning();

      if (!musician) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Musician not found' });
      }

      return musician;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Check if musician has credits
      const credits = await db.select({ count: count() })
        .from(projectCredits)
        .where(eq(projectCredits.musicianId, input.id));

      if ((credits[0]?.count || 0) > 0) {
        // Soft delete - just deactivate
        await db.update(musicians)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(musicians.id, input.id));
      } else {
        // Hard delete if no credits
        await db.delete(musicians).where(eq(musicians.id, input.id));
      }

      return { success: true };
    }),

  // ============ CREDITS ============

  addCredit: protectedProcedure
    .input(z.object({
      musicianId: z.number(),
      projectId: z.number(),
      trackId: z.number().optional(),
      role: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Verify musician exists
      const [musician] = await db.select().from(musicians).where(eq(musicians.id, input.musicianId));
      if (!musician) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Musician not found' });
      }

      // Verify project exists
      const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId));
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Check for duplicate credit
      const conditions = [
        eq(projectCredits.musicianId, input.musicianId),
        eq(projectCredits.projectId, input.projectId),
        eq(projectCredits.role, input.role),
      ];
      if (input.trackId) {
        conditions.push(eq(projectCredits.trackId, input.trackId));
      }

      const [existing] = await db.select()
        .from(projectCredits)
        .where(and(...conditions));

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This credit already exists' });
      }

      const [credit] = await db.insert(projectCredits).values({
        musicianId: input.musicianId,
        projectId: input.projectId,
        trackId: input.trackId,
        role: input.role,
        notes: input.notes,
      }).returning();

      return credit;
    }),

  removeCredit: protectedProcedure
    .input(z.object({ creditId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      await db.delete(projectCredits).where(eq(projectCredits.id, input.creditId));
      return { success: true };
    }),

  // Get credits for a project
  getProjectCredits: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const credits = await db.select({
        credit: projectCredits,
        musician: musicians,
        track: projectTracks,
      })
        .from(projectCredits)
        .leftJoin(musicians, eq(projectCredits.musicianId, musicians.id))
        .leftJoin(projectTracks, eq(projectCredits.trackId, projectTracks.id))
        .where(eq(projectCredits.projectId, input.projectId))
        .orderBy(projectCredits.role);

      return credits.map(c => ({
        ...c.credit,
        musician: c.musician,
        track: c.track,
      }));
    }),

  // ============ STATISTICS ============

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await ctx.getTenantDb();

    const [
      totalResult,
      activeResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(musicians),
      db.select({ count: count() }).from(musicians).where(eq(musicians.isActive, true)),
    ]);

    // Get credit count
    const creditCount = await db.select({ count: count() }).from(projectCredits);

    // Get unique instruments
    const allMusicians = await db.select().from(musicians);
    const instrumentSet = new Set<string>();
    allMusicians.forEach(m => {
      if (m.instruments) {
        m.instruments.split(',').forEach(i => instrumentSet.add(i.trim()));
      }
    });

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      totalCredits: creditCount[0]?.count || 0,
      uniqueInstruments: instrumentSet.size,
      instruments: Array.from(instrumentSet).sort(),
    };
  }),

  // ============ ROLES ============

  getRoles: protectedProcedure.query(() => {
    return {
      roles: [
        // Performance
        { id: 'vocalist', name: 'Vocalist', category: 'performance' },
        { id: 'guitarist', name: 'Guitarist', category: 'performance' },
        { id: 'bassist', name: 'Bassist', category: 'performance' },
        { id: 'drummer', name: 'Drummer', category: 'performance' },
        { id: 'keyboardist', name: 'Keyboardist', category: 'performance' },
        { id: 'pianist', name: 'Pianist', category: 'performance' },
        { id: 'violinist', name: 'Violinist', category: 'performance' },
        { id: 'cellist', name: 'Cellist', category: 'performance' },
        { id: 'saxophonist', name: 'Saxophonist', category: 'performance' },
        { id: 'trumpeter', name: 'Trumpeter', category: 'performance' },
        { id: 'percussionist', name: 'Percussionist', category: 'performance' },
        { id: 'backing_vocalist', name: 'Backing Vocalist', category: 'performance' },
        // Production
        { id: 'producer', name: 'Producer', category: 'production' },
        { id: 'executive_producer', name: 'Executive Producer', category: 'production' },
        { id: 'co_producer', name: 'Co-Producer', category: 'production' },
        { id: 'arranger', name: 'Arranger', category: 'production' },
        { id: 'programmer', name: 'Programmer', category: 'production' },
        // Engineering
        { id: 'recording_engineer', name: 'Recording Engineer', category: 'engineering' },
        { id: 'mixing_engineer', name: 'Mixing Engineer', category: 'engineering' },
        { id: 'mastering_engineer', name: 'Mastering Engineer', category: 'engineering' },
        { id: 'assistant_engineer', name: 'Assistant Engineer', category: 'engineering' },
        // Writing
        { id: 'songwriter', name: 'Songwriter', category: 'writing' },
        { id: 'composer', name: 'Composer', category: 'writing' },
        { id: 'lyricist', name: 'Lyricist', category: 'writing' },
        // Other
        { id: 'featured_artist', name: 'Featured Artist', category: 'other' },
        { id: 'session_musician', name: 'Session Musician', category: 'other' },
      ],
    };
  }),
});

/**
 * Team Router
 *
 * Manage team members, invitations, and roles:
 * - CRUD team members
 * - Send/manage invitations
 * - Role management
 * - Team statistics
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { teamMembers, teamInvitations } from '@rsm/database/tenant';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { TRPCError } from '@trpc/server';

export const teamRouter = router({
  // ============ TEAM MEMBERS ============

  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
      role: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { limit = 50, offset = 0, search, role, isActive } = input || {};
      const db = await ctx.getTenantDb();

      const conditions = [];
      if (search) {
        conditions.push(
          sql`(${teamMembers.name} ILIKE ${`%${search}%`} OR ${teamMembers.email} ILIKE ${`%${search}%`})`
        );
      }
      if (role) {
        conditions.push(eq(teamMembers.role, role));
      }
      if (isActive !== undefined) {
        conditions.push(eq(teamMembers.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [members, totalResult] = await Promise.all([
        db.select().from(teamMembers).where(whereClause).limit(limit).offset(offset).orderBy(desc(teamMembers.createdAt)),
        db.select({ count: count() }).from(teamMembers).where(whereClause),
      ]);

      return {
        members,
        total: totalResult[0]?.count || 0,
        limit,
        offset,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, input.id));
      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
      }
      return member;
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      role: z.enum(['admin', 'manager', 'engineer', 'producer', 'assistant', 'intern']).default('engineer'),
      title: z.string().optional(),
      department: z.string().optional(),
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),
      hourlyRate: z.number().optional(),
      hiredAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Check if email already exists
      const [existing] = await db.select().from(teamMembers).where(eq(teamMembers.email, input.email));
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'A team member with this email already exists' });
      }

      const [member] = await db.insert(teamMembers).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        title: input.title,
        department: input.department,
        bio: input.bio,
        skills: input.skills ? JSON.stringify(input.skills) : null,
        hourlyRate: input.hourlyRate?.toString(),
        hiredAt: input.hiredAt ? new Date(input.hiredAt) : null,
      }).returning();

      return member;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.enum(['admin', 'manager', 'engineer', 'producer', 'assistant', 'intern']).optional(),
      title: z.string().optional(),
      department: z.string().optional(),
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),
      hourlyRate: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const { id, skills, hourlyRate, ...updates } = input;

      const [member] = await db.update(teamMembers)
        .set({
          ...updates,
          skills: skills ? JSON.stringify(skills) : undefined,
          hourlyRate: hourlyRate?.toString(),
          updatedAt: new Date(),
        })
        .where(eq(teamMembers.id, id))
        .returning();

      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
      }

      return member;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      await db.delete(teamMembers).where(eq(teamMembers.id, input.id));
      return { success: true };
    }),

  // ============ INVITATIONS ============

  listInvitations: adminProcedure
    .input(z.object({
      status: z.enum(['pending', 'accepted', 'expired', 'cancelled']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const { status } = input || {};

      const whereClause = status ? eq(teamInvitations.status, status) : undefined;

      const invitations = await db.select()
        .from(teamInvitations)
        .where(whereClause)
        .orderBy(desc(teamInvitations.createdAt));

      return invitations;
    }),

  sendInvitation: adminProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'manager', 'engineer', 'producer', 'assistant', 'intern']).default('engineer'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Check if email already has a team member
      const [existingMember] = await db.select().from(teamMembers).where(eq(teamMembers.email, input.email));
      if (existingMember) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This email is already a team member' });
      }

      // Check if there's a pending invitation
      const [existingInvitation] = await db.select()
        .from(teamInvitations)
        .where(and(
          eq(teamInvitations.email, input.email),
          eq(teamInvitations.status, 'pending')
        ));
      if (existingInvitation) {
        throw new TRPCError({ code: 'CONFLICT', message: 'An invitation is already pending for this email' });
      }

      // Create invitation
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const [invitation] = await db.insert(teamInvitations).values({
        email: input.email,
        role: input.role,
        invitedBy: ctx.user.name || ctx.user.email,
        token,
        expiresAt,
      }).returning();

      // TODO: Send invitation email

      return {
        ...invitation,
        inviteUrl: `${process.env.APP_URL || 'http://localhost:5174'}/accept-invitation?token=${token}`,
      };
    }),

  cancelInvitation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [invitation] = await db.update(teamInvitations)
        .set({ status: 'cancelled' })
        .where(eq(teamInvitations.id, input.id))
        .returning();

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      return invitation;
    }),

  resendInvitation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Get the invitation
      const [invitation] = await db.select().from(teamInvitations).where(eq(teamInvitations.id, input.id));
      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      // Generate new token and extend expiry
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [updated] = await db.update(teamInvitations)
        .set({ token, expiresAt, status: 'pending' })
        .where(eq(teamInvitations.id, input.id))
        .returning();

      // TODO: Send invitation email

      return {
        ...updated,
        inviteUrl: `${process.env.APP_URL || 'http://localhost:5174'}/accept-invitation?token=${token}`,
      };
    }),

  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Find the invitation
      const [invitation] = await db.select()
        .from(teamInvitations)
        .where(eq(teamInvitations.token, input.token));

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      if (invitation.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invitation is no longer valid' });
      }

      if (new Date() > invitation.expiresAt) {
        await db.update(teamInvitations)
          .set({ status: 'expired' })
          .where(eq(teamInvitations.id, invitation.id));
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invitation has expired' });
      }

      // Create team member
      const [member] = await db.insert(teamMembers).values({
        userId: ctx.user.id,
        name: ctx.user.name || 'New Team Member',
        email: invitation.email,
        role: invitation.role,
        hiredAt: new Date(),
      }).returning();

      // Update invitation status
      await db.update(teamInvitations)
        .set({ status: 'accepted', acceptedAt: new Date() })
        .where(eq(teamInvitations.id, invitation.id));

      return member;
    }),

  // ============ STATISTICS ============

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await ctx.getTenantDb();

    const [
      totalResult,
      activeResult,
      byRoleResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(teamMembers),
      db.select({ count: count() }).from(teamMembers).where(eq(teamMembers.isActive, true)),
      db.select({
        role: teamMembers.role,
        count: count(),
      }).from(teamMembers).groupBy(teamMembers.role),
    ]);

    const pendingInvitations = await db.select({ count: count() })
      .from(teamInvitations)
      .where(eq(teamInvitations.status, 'pending'));

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      pendingInvitations: pendingInvitations[0]?.count || 0,
      byRole: byRoleResult.reduce((acc, r) => {
        acc[r.role] = r.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }),

  // ============ ROLES ============

  getRoles: protectedProcedure.query(() => {
    return {
      roles: [
        { id: 'admin', name: 'Administrator', description: 'Full access to all features', permissions: ['*'] },
        { id: 'manager', name: 'Manager', description: 'Manage team and projects', permissions: ['team.read', 'team.write', 'projects.*', 'sessions.*', 'clients.*'] },
        { id: 'engineer', name: 'Engineer', description: 'Recording and mixing engineer', permissions: ['sessions.*', 'projects.read', 'clients.read'] },
        { id: 'producer', name: 'Producer', description: 'Music producer', permissions: ['sessions.*', 'projects.*', 'clients.read'] },
        { id: 'assistant', name: 'Assistant', description: 'Studio assistant', permissions: ['sessions.read', 'clients.read'] },
        { id: 'intern', name: 'Intern', description: 'Trainee with limited access', permissions: ['sessions.read'] },
      ],
    };
  }),
});

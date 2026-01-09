import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

/**
 * Shares Router (Mock version)
 * TODO: Implement real database integration with shares table
 */

// Mock data for development
const mockShares = [
  {
    id: 1,
    projectId: 1,
    trackId: 1,
    projectName: "Album Jazz 2025",
    trackName: "Blue Notes",
    recipientEmail: "marie.dubois@email.com",
    shareLink: "https://rsm.studio/share/abc123def456",
    shareToken: "abc123def456",
    expiresAt: new Date(2026, 0, 15),
    accessCount: 5,
    maxAccess: 10,
    status: "active" as const,
    createdAt: new Date(2025, 11, 20),
  },
  {
    id: 2,
    projectId: 2,
    trackId: null,
    projectName: "Podcast Episode 12",
    trackName: null,
    recipientEmail: "thomas.martin@email.com",
    shareLink: "https://rsm.studio/share/xyz789ghi012",
    shareToken: "xyz789ghi012",
    expiresAt: new Date(2026, 0, 1),
    accessCount: 12,
    maxAccess: null,
    status: "active" as const,
    createdAt: new Date(2025, 11, 15),
  },
  {
    id: 3,
    projectId: 3,
    trackId: 3,
    projectName: "Démo Rock Band",
    trackName: "Thunder Road",
    recipientEmail: "sophie.bernard@email.com",
    shareLink: "https://rsm.studio/share/jkl345mno678",
    shareToken: "jkl345mno678",
    expiresAt: new Date(2025, 11, 10),
    accessCount: 3,
    maxAccess: 5,
    status: "expired" as const,
    createdAt: new Date(2025, 10, 25),
  },
];

export const sharesRouter = router({
  /**
   * List all shares
   */
  list: protectedProcedure.query(async () => {
    return mockShares;
  }),

  /**
   * Get share by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const share = mockShares.find((s) => s.id === input.id);
      if (!share) {
        throw new Error("Share not found");
      }
      return share;
    }),

  /**
   * Create a new share
   */
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        trackId: z.number().optional(),
        recipientEmail: z.string().email(),
        expiresInDays: z.number().optional(), // null = never expires
        maxAccess: z.number().optional(), // null = unlimited
      })
    )
    .mutation(async ({ input }) => {
      // Generate share token
      const shareToken = Math.random().toString(36).substring(2, 15);

      // Calculate expiration date
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const newShare = {
        id: mockShares.length + 1,
        projectId: input.projectId,
        trackId: input.trackId || null,
        projectName: "Projet Mock", // Would come from DB join
        trackName: input.trackId ? "Track Mock" : null,
        recipientEmail: input.recipientEmail,
        shareLink: `https://rsm.studio/share/${shareToken}`,
        shareToken,
        expiresAt: expiresAt || new Date(2099, 0, 1),
        accessCount: 0,
        maxAccess: input.maxAccess || null,
        status: "active" as const,
        createdAt: new Date(),
      };

      mockShares.push(newShare);
      return newShare;
    }),

  /**
   * Update share
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        recipientEmail: z.string().email().optional(),
        expiresAt: z.coerce.date().optional(),
        maxAccess: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const index = mockShares.findIndex((s) => s.id === input.id);
      if (index === -1) {
        throw new Error("Share not found");
      }

      const { id, ...updateData } = input;
      mockShares[index] = {
        ...mockShares[index],
        ...updateData,
      };

      return mockShares[index];
    }),

  /**
   * Revoke (delete) a share
   */
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const index = mockShares.findIndex((s) => s.id === input.id);
      if (index === -1) {
        throw new Error("Share not found");
      }

      // Mark as expired instead of deleting (using "expired" as revoked status)
      mockShares[index].status = "expired";
      return { success: true };
    }),

  /**
   * Get share stats
   */
  getStats: protectedProcedure.query(async () => {
    const activeShares = mockShares.filter((s) => s.status === "active");
    const expiredShares = mockShares.filter(
      (s) => s.status === "expired"
    );
    const totalAccess = mockShares.reduce((acc, s) => acc + s.accessCount, 0);

    return {
      total: mockShares.length,
      active: activeShares.length,
      expired: expiredShares.length,
      totalAccess,
    };
  }),
});

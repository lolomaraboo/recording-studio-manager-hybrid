import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

/**
 * Files Router (Skeleton version - Mock data)
 * TODO: Implement real S3 integration with audio_files table
 */

// Mock data for development
const mockFiles = [
  {
    id: 1,
    projectId: 1,
    fileName: "vocals_raw_take1.wav",
    fileKey: "audio/1/1734363600000-abc123.wav",
    fileUrl: "https://example.com/audio/1/1734363600000-abc123.wav",
    fileSize: 45678900,
    mimeType: "audio/wav",
    category: "raw",
    description: "Première prise de voix",
    version: "v1",
    createdAt: new Date("2024-12-15"),
  },
  {
    id: 2,
    projectId: 1,
    fileName: "mix_final.mp3",
    fileKey: "audio/1/1734450000000-def456.mp3",
    fileUrl: "https://example.com/audio/1/1734450000000-def456.mp3",
    fileSize: 8900000,
    mimeType: "audio/mpeg",
    category: "mixed",
    description: "Mix final après corrections",
    version: "v3",
    createdAt: new Date("2024-12-16"),
  },
  {
    id: 3,
    projectId: 2,
    fileName: "master_final.flac",
    fileKey: "audio/2/1734536400000-ghi789.flac",
    fileUrl: "https://example.com/audio/2/1734536400000-ghi789.flac",
    fileSize: 67800000,
    mimeType: "audio/flac",
    category: "mastered",
    description: "Mastering final pour distribution",
    version: "final",
    createdAt: new Date("2024-12-17"),
  },
];

export const filesRouter = router({
  /**
   * List all audio files with optional filters
   */
  list: protectedProcedure
    .input(
      z.object({
        category: z.enum(["raw", "mixed", "mastered", "reference", "other"]).optional(),
        search: z.string().optional(),
        projectId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      let files = [...mockFiles];

      // Filter by category
      if (input.category) {
        files = files.filter((f) => f.category === input.category);
      }

      // Filter by search query
      if (input.search) {
        const query = input.search.toLowerCase();
        files = files.filter(
          (f) =>
            f.fileName.toLowerCase().includes(query) ||
            f.description?.toLowerCase().includes(query)
        );
      }

      // Filter by project
      if (input.projectId) {
        files = files.filter((f) => f.projectId === input.projectId);
      }

      return files;
    }),

  /**
   * Get file statistics
   */
  getStats: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => {
      const totalSize = mockFiles.reduce((sum, f) => sum + f.fileSize, 0);
      const byCategory = mockFiles.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: mockFiles.length,
        totalSize,
        byCategory: {
          raw: byCategory.raw || 0,
          mixed: byCategory.mixed || 0,
          mastered: byCategory.mastered || 0,
          reference: byCategory.reference || 0,
          other: byCategory.other || 0,
        },
      };
    }),

  /**
   * Create a new file entry (mock - no actual upload)
   */
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileKey: z.string(),
        fileUrl: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        category: z.enum(["raw", "mixed", "mastered", "reference", "other"]),
        description: z.string().optional(),
        version: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const newFile = {
        id: mockFiles.length + 1,
        ...input,
        createdAt: new Date(),
      };

      mockFiles.push(newFile);
      return newFile;
    }),

  /**
   * Update file metadata (mock - only updates mock array)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        fileName: z.string().optional(),
        category: z.enum(["raw", "mixed", "mastered", "reference", "other"]).optional(),
        description: z.string().optional(),
        version: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const index = mockFiles.findIndex((f) => f.id === input.id);
      if (index === -1) {
        throw new Error("File not found");
      }

      const { id, ...updateData } = input;
      mockFiles[index] = {
        ...mockFiles[index],
        ...updateData,
      };

      return mockFiles[index];
    }),

  /**
   * Delete a file (mock - no actual S3 deletion)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const index = mockFiles.findIndex((f) => f.id === input.id);
      if (index === -1) {
        throw new Error("File not found");
      }

      mockFiles.splice(index, 1);
      return { success: true };
    }),

  /**
   * Get download URL (mock - returns the fileUrl)
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const file = mockFiles.find((f) => f.id === input.id);
      if (!file) {
        throw new Error("File not found");
      }

      // In real implementation, this would generate a presigned S3 URL
      return { url: file.fileUrl };
    }),
});

/**
 * AI Router
 *
 * Endpoints for AI-powered features:
 * - Audio transcription
 * - Lyrics analysis
 * - Metadata suggestions
 * - Musician recommendations
 * - Auto-generated descriptions
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  isAIEnabled,
  getAIConfig,
  transcribeAudioFromUrl,
  analyzeLyrics,
  summarizeSessionNotes,
  suggestMetadataFromContext,
  generateProjectDescription,
  generateTrackDescription,
  generateClientEmail,
  getUsageStats,
} from "../_core/ai";

// ============================================================================
// Input Schemas
// ============================================================================

const transcribeInput = z.object({
  audioUrl: z.string().url(),
  language: z.string().length(2).optional(),
});

const analyzeLyricsInput = z.object({
  lyrics: z.string().min(10).max(10000),
});

const summarizeNotesInput = z.object({
  notes: z.string().min(10).max(50000),
});

const suggestMetadataInput = z.object({
  trackTitle: z.string().min(1).max(200),
  projectGenre: z.string().optional(),
  artistStyle: z.string().optional(),
});

const generateProjectDescInput = z.object({
  projectTitle: z.string().min(1).max(200),
  artistName: z.string().min(1).max(200),
  genre: z.string().min(1).max(100),
  trackTitles: z.array(z.string()).min(1).max(50),
  additionalContext: z.string().max(1000).optional(),
});

const generateTrackDescInput = z.object({
  trackTitle: z.string().min(1).max(200),
  projectGenre: z.string().min(1).max(100),
  lyrics: z.string().max(5000).optional(),
  mood: z.string().max(100).optional(),
});

const generateEmailInput = z.object({
  type: z.enum(["invoice", "session_reminder", "project_update", "payment_thank_you"]),
  context: z.record(z.string()),
});

// ============================================================================
// Router
// ============================================================================

export const aiRouter = router({
  /**
   * Check if AI features are enabled
   */
  isEnabled: protectedProcedure.query(() => {
    return {
      enabled: isAIEnabled(),
      config: getAIConfig(),
    };
  }),

  /**
   * Transcribe audio file from URL
   * Requires AI to be enabled
   */
  transcribe: protectedProcedure
    .input(transcribeInput)
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        throw new Error("AI features are not enabled");
      }

      const result = await transcribeAudioFromUrl(input.audioUrl, input.language);

      return {
        text: result.text,
        segments: result.segments,
        language: result.language,
        durationSeconds: result.duration,
      };
    }),

  /**
   * Analyze lyrics for sentiment, themes, and mood
   */
  analyzeLyrics: protectedProcedure
    .input(analyzeLyricsInput)
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        throw new Error("AI features are not enabled");
      }

      const analysis = await analyzeLyrics(input.lyrics);

      return {
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        themes: analysis.themes,
        mood: analysis.mood,
        keywords: analysis.keywords,
        language: analysis.language,
        summary: analysis.summary,
      };
    }),

  /**
   * Summarize session notes
   */
  summarizeNotes: protectedProcedure
    .input(summarizeNotesInput)
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        throw new Error("AI features are not enabled");
      }

      const summary = await summarizeSessionNotes(input.notes);

      return { summary };
    }),

  /**
   * Suggest metadata for a track based on title and context
   */
  suggestMetadata: protectedProcedure
    .input(suggestMetadataInput)
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        throw new Error("AI features are not enabled");
      }

      const metadata = await suggestMetadataFromContext(
        input.trackTitle,
        input.projectGenre,
        input.artistStyle
      );

      return {
        estimatedBpm: metadata.estimatedBpm,
        estimatedKey: metadata.estimatedKey,
        genre: metadata.genre ?? [],
        mood: metadata.mood ?? [],
        energy: metadata.energy,
        instruments: metadata.instruments ?? [],
      };
    }),

  /**
   * Generate project description from tracks and metadata
   */
  generateProjectDescription: protectedProcedure
    .input(generateProjectDescInput)
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        throw new Error("AI features are not enabled");
      }

      const description = await generateProjectDescription(
        input.projectTitle,
        input.artistName,
        input.genre,
        input.trackTitles,
        input.additionalContext
      );

      return {
        title: description.title,
        shortDescription: description.shortDescription,
        longDescription: description.longDescription,
        tags: description.tags,
        targetAudience: description.targetAudience,
      };
    }),

  /**
   * Generate track description
   */
  generateTrackDescription: protectedProcedure
    .input(generateTrackDescInput)
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        throw new Error("AI features are not enabled");
      }

      const description = await generateTrackDescription(
        input.trackTitle,
        input.projectGenre,
        input.lyrics,
        input.mood
      );

      return { description };
    }),

  /**
   * Generate client email
   */
  generateEmail: protectedProcedure
    .input(generateEmailInput)
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        throw new Error("AI features are not enabled");
      }

      const email = await generateClientEmail(input.type, input.context);

      return {
        subject: email.subject,
        body: email.body,
      };
    }),

  /**
   * Get AI usage statistics (admin only)
   */
  getUsageStats: adminProcedure.query(() => {
    const stats = getUsageStats();

    return {
      totalTokens: stats.totalTokens,
      estimatedCost: stats.totalCost.toFixed(4),
      operationCounts: stats.operationCounts,
    };
  }),
});

export type AIRouter = typeof aiRouter;

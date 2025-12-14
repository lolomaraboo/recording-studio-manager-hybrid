/**
 * Integrations Router
 *
 * Provides endpoints for third-party integrations.
 *
 * Endpoints:
 * - Slack OAuth and messaging
 * - Discord setup
 * - Zapier/webhook configuration
 * - Trigger management
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  getSlackAuthUrl,
  exchangeSlackCode,
  getSlackChannels,
  getDiscordAuthUrl,
  createIntegration,
  getIntegrations,
  getIntegration,
  updateIntegration,
  deleteIntegration,
  addTrigger,
  removeTrigger,
  triggerEvent,
  createZapierSubscription,
  type IntegrationType,
  type TriggerEvent,
  type SlackConfig,
  type ZapierConfig,
  type WebhookConfig,
} from "../_core/integrations";

// ============================================================================
// Input Schemas
// ============================================================================

// integrationTypeSchema available for future use
// const integrationTypeSchema = z.enum(["slack", "zapier", "discord", "webhook"]);

const triggerEventSchema = z.enum([
  "session.created",
  "session.started",
  "session.completed",
  "session.cancelled",
  "booking.created",
  "booking.confirmed",
  "booking.cancelled",
  "invoice.created",
  "invoice.paid",
  "invoice.overdue",
  "client.created",
  "project.created",
  "project.completed",
  "file.uploaded",
  "payment.received",
  "payment.failed",
]);

const slackConnectInput = z.object({
  code: z.string().min(1),
  name: z.string().default("Slack"),
});

const webhookCreateInput = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT"]).default("POST"),
  headers: z.record(z.string()).optional(),
  secret: z.string().optional(),
});

const zapierCreateInput = z.object({
  name: z.string().min(1).max(100).default("Zapier"),
  events: z.array(triggerEventSchema).min(1),
});

const addTriggerInput = z.object({
  integrationId: z.string(),
  event: triggerEventSchema,
  channelId: z.string().optional(),
  enabled: z.boolean().default(true),
  template: z
    .object({
      text: z.string(),
    })
    .optional(),
});

const testTriggerInput = z.object({
  event: triggerEventSchema,
  data: z.record(z.unknown()).optional(),
});

// ============================================================================
// Helper
// ============================================================================

function getOrgId(ctx: { organizationId: number | null }): number {
  if (!ctx.organizationId) {
    throw new Error("Organization context required");
  }
  return ctx.organizationId;
}

// ============================================================================
// Router
// ============================================================================

export const integrationsRouter = router({
  /**
   * List all integrations for organization
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = getOrgId(ctx);
    const orgIntegrations = await getIntegrations(organizationId);

    return orgIntegrations.map((i) => ({
      id: i.id,
      type: i.type,
      name: i.name,
      enabled: i.enabled,
      triggerCount: i.triggers.length,
      lastUsedAt: i.lastUsedAt,
      errorCount: i.errorCount,
      lastError: i.lastError,
      createdAt: i.createdAt,
    }));
  }),

  /**
   * Get integration details
   */
  get: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .query(async ({ input }) => {
      const integration = await getIntegration(input.integrationId);
      if (!integration) {
        throw new Error("Integration not found");
      }

      // Don't expose sensitive config
      const safeConfig = {
        type: integration.config.type,
        ...(integration.config.type === "slack"
          ? {
              teamName: (integration.config as SlackConfig).teamName,
              defaultChannelName: (integration.config as SlackConfig).defaultChannelName,
            }
          : {}),
        ...(integration.config.type === "webhook"
          ? {
              url: (integration.config as WebhookConfig).url,
              method: (integration.config as WebhookConfig).method,
            }
          : {}),
      };

      return {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        enabled: integration.enabled,
        config: safeConfig,
        triggers: integration.triggers,
        lastUsedAt: integration.lastUsedAt,
        errorCount: integration.errorCount,
        lastError: integration.lastError,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    }),

  // =========================================================================
  // Slack
  // =========================================================================

  /**
   * Get Slack OAuth URL
   */
  slackAuthUrl: protectedProcedure.query(({ ctx }) => {
    const state = Buffer.from(
      JSON.stringify({
        userId: ctx.user?.id,
        organizationId: ctx.organizationId,
        timestamp: Date.now(),
      })
    ).toString("base64");

    return { url: getSlackAuthUrl(state) };
  }),

  /**
   * Connect Slack workspace
   */
  slackConnect: protectedProcedure
    .input(slackConnectInput)
    .mutation(async ({ ctx, input }) => {
      const organizationId = getOrgId(ctx);

      const slackConfig = await exchangeSlackCode(input.code);

      const integration = await createIntegration(
        organizationId,
        "slack" as IntegrationType,
        input.name,
        slackConfig
      );

      return {
        integrationId: integration.id,
        teamName: slackConfig.teamName,
        connected: true,
      };
    }),

  /**
   * Get Slack channels for integration
   */
  slackChannels: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .query(async ({ input }) => {
      const integration = await getIntegration(input.integrationId);
      if (!integration || integration.config.type !== "slack") {
        throw new Error("Slack integration not found");
      }

      const slackConfig = integration.config as SlackConfig;
      const channels = await getSlackChannels(slackConfig.accessToken);

      return channels;
    }),

  /**
   * Set default Slack channel
   */
  slackSetChannel: protectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
        channelId: z.string(),
        channelName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const integration = await getIntegration(input.integrationId);
      if (!integration || integration.config.type !== "slack") {
        throw new Error("Slack integration not found");
      }

      const slackConfig = integration.config as SlackConfig;
      slackConfig.defaultChannelId = input.channelId;
      slackConfig.defaultChannelName = input.channelName;

      await updateIntegration(input.integrationId, {});

      return { success: true, channelName: input.channelName };
    }),

  // =========================================================================
  // Discord
  // =========================================================================

  /**
   * Get Discord OAuth URL
   */
  discordAuthUrl: protectedProcedure.query(({ ctx }) => {
    const state = Buffer.from(
      JSON.stringify({
        userId: ctx.user?.id,
        organizationId: ctx.organizationId,
        timestamp: Date.now(),
      })
    ).toString("base64");

    return { url: getDiscordAuthUrl(state) };
  }),

  // =========================================================================
  // Webhook
  // =========================================================================

  /**
   * Create webhook integration
   */
  webhookCreate: protectedProcedure
    .input(webhookCreateInput)
    .mutation(async ({ ctx, input }) => {
      const organizationId = getOrgId(ctx);

      const webhookConfig: WebhookConfig = {
        type: "webhook",
        url: input.url,
        method: input.method,
        headers: input.headers,
        secret: input.secret,
      };

      const integration = await createIntegration(
        organizationId,
        "webhook" as IntegrationType,
        input.name,
        webhookConfig
      );

      return {
        integrationId: integration.id,
        url: input.url,
        created: true,
      };
    }),

  // =========================================================================
  // Zapier
  // =========================================================================

  /**
   * Create Zapier integration with subscription
   */
  zapierCreate: protectedProcedure
    .input(zapierCreateInput)
    .mutation(async ({ ctx, input }) => {
      const organizationId = getOrgId(ctx);

      // Create Zapier subscription
      const { subscriptionId, webhookUrl } = createZapierSubscription(
        organizationId,
        input.events as TriggerEvent[]
      );

      const zapierConfig: ZapierConfig = {
        type: "zapier",
        webhookUrl,
      };

      const integration = await createIntegration(
        organizationId,
        "zapier" as IntegrationType,
        input.name,
        zapierConfig
      );

      // Add triggers for each event
      for (const event of input.events) {
        await addTrigger(integration.id, {
          event: event as TriggerEvent,
          enabled: true,
        });
      }

      return {
        integrationId: integration.id,
        subscriptionId,
        webhookUrl,
        events: input.events,
      };
    }),

  // =========================================================================
  // Integration Management
  // =========================================================================

  /**
   * Enable/disable integration
   */
  toggle: protectedProcedure
    .input(z.object({ integrationId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const updated = await updateIntegration(input.integrationId, {
        enabled: input.enabled,
      });

      if (!updated) {
        throw new Error("Integration not found");
      }

      return { enabled: updated.enabled };
    }),

  /**
   * Rename integration
   */
  rename: protectedProcedure
    .input(z.object({ integrationId: z.string(), name: z.string().min(1).max(100) }))
    .mutation(async ({ input }) => {
      const updated = await updateIntegration(input.integrationId, {
        name: input.name,
      });

      if (!updated) {
        throw new Error("Integration not found");
      }

      return { name: updated.name };
    }),

  /**
   * Delete integration
   */
  delete: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .mutation(async ({ input }) => {
      const deleted = await deleteIntegration(input.integrationId);
      if (!deleted) {
        throw new Error("Integration not found");
      }
      return { success: true };
    }),

  // =========================================================================
  // Triggers
  // =========================================================================

  /**
   * Add trigger to integration
   */
  addTrigger: protectedProcedure.input(addTriggerInput).mutation(async ({ input }) => {
    const trigger = await addTrigger(input.integrationId, {
      event: input.event as TriggerEvent,
      enabled: input.enabled,
      channelId: input.channelId,
      template: input.template,
    });

    if (!trigger) {
      throw new Error("Integration not found");
    }

    return trigger;
  }),

  /**
   * Remove trigger from integration
   */
  removeTrigger: protectedProcedure
    .input(z.object({ integrationId: z.string(), triggerId: z.string() }))
    .mutation(async ({ input }) => {
      const removed = await removeTrigger(input.integrationId, input.triggerId);
      if (!removed) {
        throw new Error("Trigger not found");
      }
      return { success: true };
    }),

  /**
   * Toggle trigger enabled state
   */
  toggleTrigger: protectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
        triggerId: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const integration = await getIntegration(input.integrationId);
      if (!integration) {
        throw new Error("Integration not found");
      }

      const trigger = integration.triggers.find((t) => t.id === input.triggerId);
      if (!trigger) {
        throw new Error("Trigger not found");
      }

      trigger.enabled = input.enabled;
      await updateIntegration(input.integrationId, { triggers: integration.triggers });

      return { enabled: trigger.enabled };
    }),

  // =========================================================================
  // Testing
  // =========================================================================

  /**
   * Test trigger with mock data
   */
  testTrigger: adminProcedure.input(testTriggerInput).mutation(async ({ ctx, input }) => {
    const organizationId = getOrgId(ctx);

    const mockData = input.data ?? {
      title: "Test Session",
      date: new Date().toISOString().split("T")[0],
      time: "14:00 - 17:00",
      room: "Studio A",
      clientName: "Test Client",
      amount: "$500.00",
      invoiceNumber: "INV-001",
      projectName: "Test Project",
      fileName: "test-file.wav",
    };

    const result = await triggerEvent(organizationId, input.event as TriggerEvent, mockData);

    return {
      event: input.event,
      ...result,
    };
  }),

  /**
   * Get available trigger events
   */
  availableEvents: protectedProcedure.query(() => {
    return [
      { event: "session.created", description: "When a new session is created" },
      { event: "session.started", description: "When a session begins" },
      { event: "session.completed", description: "When a session ends" },
      { event: "session.cancelled", description: "When a session is cancelled" },
      { event: "booking.created", description: "When a new booking request comes in" },
      { event: "booking.confirmed", description: "When a booking is confirmed" },
      { event: "booking.cancelled", description: "When a booking is cancelled" },
      { event: "invoice.created", description: "When an invoice is generated" },
      { event: "invoice.paid", description: "When an invoice is paid" },
      { event: "invoice.overdue", description: "When an invoice becomes overdue" },
      { event: "client.created", description: "When a new client is added" },
      { event: "project.created", description: "When a new project is started" },
      { event: "project.completed", description: "When a project is finished" },
      { event: "file.uploaded", description: "When a file is uploaded" },
      { event: "payment.received", description: "When a payment is received" },
      { event: "payment.failed", description: "When a payment fails" },
    ];
  }),
});

export type IntegrationsRouter = typeof integrationsRouter;

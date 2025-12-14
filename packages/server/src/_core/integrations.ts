/**
 * Third-Party Integrations Module
 *
 * Provides integrations with external services:
 * - Slack: Channel notifications, commands
 * - Zapier: Webhook automation
 * - Discord: Channel notifications (similar to Slack)
 * - Email Automation: Drip campaigns, transactional
 *
 * All integrations follow a common pattern:
 * 1. OAuth or API key authentication
 * 2. Webhook registration
 * 3. Event triggers
 * 4. Rate limiting
 */

// =============================================================================
// Types
// =============================================================================

export type IntegrationType = "slack" | "zapier" | "discord" | "webhook";

export interface Integration {
  id: string;
  organizationId: number;
  type: IntegrationType;
  name: string;
  enabled: boolean;
  config: IntegrationConfig;
  triggers: IntegrationTrigger[];
  lastUsedAt?: Date;
  errorCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationConfig =
  | SlackConfig
  | ZapierConfig
  | DiscordConfig
  | WebhookConfig;

export interface SlackConfig {
  type: "slack";
  teamId: string;
  teamName: string;
  accessToken: string;
  botUserId: string;
  defaultChannelId?: string;
  defaultChannelName?: string;
}

export interface ZapierConfig {
  type: "zapier";
  webhookUrl: string;
  webhookSecret?: string;
}

export interface DiscordConfig {
  type: "discord";
  guildId: string;
  guildName: string;
  botToken: string;
  defaultChannelId?: string;
}

export interface WebhookConfig {
  type: "webhook";
  url: string;
  method: "GET" | "POST" | "PUT";
  headers?: Record<string, string>;
  secret?: string;
}

export interface IntegrationTrigger {
  id: string;
  event: TriggerEvent;
  enabled: boolean;
  channelId?: string; // For Slack/Discord
  template?: MessageTemplate;
  filters?: Record<string, unknown>;
}

export type TriggerEvent =
  | "session.created"
  | "session.started"
  | "session.completed"
  | "session.cancelled"
  | "booking.created"
  | "booking.confirmed"
  | "booking.cancelled"
  | "invoice.created"
  | "invoice.paid"
  | "invoice.overdue"
  | "client.created"
  | "project.created"
  | "project.completed"
  | "file.uploaded"
  | "payment.received"
  | "payment.failed";

export interface MessageTemplate {
  text: string;
  blocks?: SlackBlock[];
  embeds?: DiscordEmbed[];
}

export interface SlackBlock {
  type: "section" | "header" | "divider" | "context" | "actions";
  text?: { type: "mrkdwn" | "plain_text"; text: string };
  fields?: Array<{ type: "mrkdwn" | "plain_text"; text: string }>;
  accessory?: unknown;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
}

export interface WebhookPayload {
  event: TriggerEvent;
  timestamp: string;
  organizationId: number;
  data: Record<string, unknown>;
}

// =============================================================================
// Configuration
// =============================================================================

interface IntegrationsConfig {
  slack: {
    clientId: string;
    clientSecret: string;
    signingSecret: string;
    redirectUri: string;
  };
  discord: {
    clientId: string;
    clientSecret: string;
    botToken: string;
    redirectUri: string;
  };
  webhookSecret: string;
  maxRetries: number;
  retryDelayMs: number;
}

const config: IntegrationsConfig = {
  slack: {
    clientId: process.env.SLACK_CLIENT_ID ?? "",
    clientSecret: process.env.SLACK_CLIENT_SECRET ?? "",
    signingSecret: process.env.SLACK_SIGNING_SECRET ?? "",
    redirectUri: process.env.SLACK_REDIRECT_URI ?? "http://localhost:3001/api/integrations/slack/callback",
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID ?? "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    botToken: process.env.DISCORD_BOT_TOKEN ?? "",
    redirectUri: process.env.DISCORD_REDIRECT_URI ?? "http://localhost:3001/api/integrations/discord/callback",
  },
  webhookSecret: process.env.WEBHOOK_SECRET ?? "webhook-secret",
  maxRetries: 3,
  retryDelayMs: 1000,
};

// =============================================================================
// In-memory storage
// =============================================================================

const integrations = new Map<string, Integration>();

// =============================================================================
// Slack Integration
// =============================================================================

/**
 * Get Slack OAuth URL
 */
export function getSlackAuthUrl(state: string): string {
  const scopes = [
    "chat:write",
    "channels:read",
    "groups:read",
    "im:read",
    "mpim:read",
    "users:read",
  ].join(",");

  const params = new URLSearchParams({
    client_id: config.slack.clientId,
    scope: scopes,
    redirect_uri: config.slack.redirectUri,
    state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange Slack OAuth code for tokens
 */
export async function exchangeSlackCode(code: string): Promise<SlackConfig> {
  console.log(`[Slack] Exchanging OAuth code: ${code.substring(0, 10)}...`);

  // In production, this would call Slack API
  return {
    type: "slack",
    teamId: `T${Date.now()}`,
    teamName: "Studio Team",
    accessToken: `xoxb-${Date.now()}`,
    botUserId: `U${Date.now()}`,
  };
}

/**
 * Send Slack message
 */
export async function sendSlackMessage(
  _accessToken: string,
  channelId: string,
  _message: MessageTemplate
): Promise<{ success: boolean; ts?: string; error?: string }> {
  console.log(`[Slack] Sending message to ${channelId}`);

  // In production, call Slack API
  // const response = await fetch("https://slack.com/api/chat.postMessage", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${accessToken}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     channel: channelId,
  //     text: message.text,
  //     blocks: message.blocks,
  //   }),
  // });

  return {
    success: true,
    ts: `${Date.now()}.000001`,
  };
}

/**
 * Get Slack channels
 */
export async function getSlackChannels(
  _accessToken: string
): Promise<Array<{ id: string; name: string; isPrivate: boolean }>> {
  console.log("[Slack] Fetching channels");

  // In production, call Slack API
  return [
    { id: "C001", name: "general", isPrivate: false },
    { id: "C002", name: "studio-alerts", isPrivate: false },
    { id: "C003", name: "bookings", isPrivate: true },
  ];
}

/**
 * Verify Slack request signature
 */
export function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // In production, verify HMAC signature
  console.log(`[Slack] Verifying signature from ${timestamp}`);
  return signature.startsWith("v0=") && timestamp.length > 0 && body.length > 0;
}

// =============================================================================
// Discord Integration
// =============================================================================

/**
 * Get Discord OAuth URL
 */
export function getDiscordAuthUrl(state: string): string {
  const scopes = ["bot", "applications.commands"].join(" ");
  const permissions = "2048"; // Send Messages

  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    permissions,
    scope: scopes,
    redirect_uri: config.discord.redirectUri,
    response_type: "code",
    state,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Send Discord message
 */
export async function sendDiscordMessage(
  channelId: string,
  _message: MessageTemplate
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`[Discord] Sending message to ${channelId}`);

  // In production, call Discord API
  return {
    success: true,
    messageId: `${Date.now()}`,
  };
}

// =============================================================================
// Zapier/Webhook Integration
// =============================================================================

/**
 * Send webhook
 */
export async function sendWebhook(
  url: string,
  _payload: WebhookPayload,
  options?: { method?: string; headers?: Record<string, string>; secret?: string }
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  console.log(`[Webhook] Sending to ${url}`);

  // Add signature if secret provided
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (options?.secret) {
    // In production, compute HMAC signature
    headers["X-Webhook-Signature"] = `sha256=${options.secret}_${Date.now()}`;
  }

  // In production, make actual HTTP request
  // const response = await fetch(url, {
  //   method: options?.method ?? "POST",
  //   headers,
  //   body: JSON.stringify(payload),
  // });

  return {
    success: true,
    statusCode: 200,
  };
}

/**
 * Create Zapier webhook URL
 */
export function createZapierSubscription(
  _organizationId: number,
  _events: TriggerEvent[]
): { subscriptionId: string; webhookUrl: string } {
  const subscriptionId = `zap_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return {
    subscriptionId,
    webhookUrl: `${process.env.API_URL ?? "http://localhost:3001"}/api/webhooks/zapier/${subscriptionId}`,
  };
}

// =============================================================================
// Integration Management
// =============================================================================

/**
 * Create a new integration
 */
export async function createIntegration(
  organizationId: number,
  type: IntegrationType,
  name: string,
  integrationConfig: IntegrationConfig
): Promise<Integration> {
  const id = `int_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const integration: Integration = {
    id,
    organizationId,
    type,
    name,
    enabled: true,
    config: integrationConfig,
    triggers: [],
    errorCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  integrations.set(id, integration);
  console.log(`[Integrations] Created ${type} integration: ${id}`);

  return integration;
}

/**
 * Get organization's integrations
 */
export async function getIntegrations(organizationId: number): Promise<Integration[]> {
  return Array.from(integrations.values()).filter(
    (i) => i.organizationId === organizationId
  );
}

/**
 * Get integration by ID
 */
export async function getIntegration(integrationId: string): Promise<Integration | null> {
  return integrations.get(integrationId) ?? null;
}

/**
 * Update integration
 */
export async function updateIntegration(
  integrationId: string,
  updates: Partial<Pick<Integration, "name" | "enabled" | "triggers">>
): Promise<Integration | null> {
  const integration = integrations.get(integrationId);
  if (!integration) return null;

  const updated = {
    ...integration,
    ...updates,
    updatedAt: new Date(),
  };

  integrations.set(integrationId, updated);
  return updated;
}

/**
 * Delete integration
 */
export async function deleteIntegration(integrationId: string): Promise<boolean> {
  const deleted = integrations.delete(integrationId);
  if (deleted) {
    console.log(`[Integrations] Deleted: ${integrationId}`);
  }
  return deleted;
}

/**
 * Add trigger to integration
 */
export async function addTrigger(
  integrationId: string,
  trigger: Omit<IntegrationTrigger, "id">
): Promise<IntegrationTrigger | null> {
  const integration = integrations.get(integrationId);
  if (!integration) return null;

  const newTrigger: IntegrationTrigger = {
    ...trigger,
    id: `trig_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };

  integration.triggers.push(newTrigger);
  integration.updatedAt = new Date();
  integrations.set(integrationId, integration);

  return newTrigger;
}

/**
 * Remove trigger from integration
 */
export async function removeTrigger(
  integrationId: string,
  triggerId: string
): Promise<boolean> {
  const integration = integrations.get(integrationId);
  if (!integration) return false;

  const initialLength = integration.triggers.length;
  integration.triggers = integration.triggers.filter((t) => t.id !== triggerId);

  if (integration.triggers.length < initialLength) {
    integration.updatedAt = new Date();
    integrations.set(integrationId, integration);
    return true;
  }

  return false;
}

// =============================================================================
// Event Triggering
// =============================================================================

/**
 * Trigger event for all matching integrations
 */
export async function triggerEvent(
  organizationId: number,
  event: TriggerEvent,
  data: Record<string, unknown>
): Promise<{
  triggered: number;
  success: number;
  failed: number;
  errors: string[];
}> {
  const orgIntegrations = await getIntegrations(organizationId);
  const results = { triggered: 0, success: 0, failed: 0, errors: [] as string[] };

  for (const integration of orgIntegrations) {
    if (!integration.enabled) continue;

    const matchingTriggers = integration.triggers.filter(
      (t) => t.enabled && t.event === event
    );

    for (const trigger of matchingTriggers) {
      results.triggered++;

      try {
        const success = await executeTrigger(integration, trigger, event, data);
        if (success) {
          results.success++;
          integration.lastUsedAt = new Date();
        } else {
          results.failed++;
          integration.errorCount++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `${integration.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        integration.errorCount++;
        integration.lastError = error instanceof Error ? error.message : "Unknown error";
      }

      integrations.set(integration.id, integration);
    }
  }

  console.log(
    `[Integrations] Event ${event}: ${results.triggered} triggered, ${results.success} success, ${results.failed} failed`
  );

  return results;
}

/**
 * Execute a single trigger
 */
async function executeTrigger(
  integration: Integration,
  trigger: IntegrationTrigger,
  event: TriggerEvent,
  data: Record<string, unknown>
): Promise<boolean> {
  const message = formatMessage(trigger.template, event, data);

  switch (integration.config.type) {
    case "slack": {
      const slackConfig = integration.config as SlackConfig;
      const channelId = trigger.channelId ?? slackConfig.defaultChannelId;
      if (!channelId) return false;

      const result = await sendSlackMessage(slackConfig.accessToken, channelId, message);
      return result.success;
    }

    case "discord": {
      const channelId = trigger.channelId;
      if (!channelId) return false;

      const result = await sendDiscordMessage(channelId, message);
      return result.success;
    }

    case "zapier":
    case "webhook": {
      const webhookConfig = integration.config as WebhookConfig | ZapierConfig;
      const url = "webhookUrl" in webhookConfig ? webhookConfig.webhookUrl : webhookConfig.url;

      const result = await sendWebhook(
        url,
        {
          event,
          timestamp: new Date().toISOString(),
          organizationId: integration.organizationId,
          data,
        },
        {
          method: "url" in webhookConfig ? webhookConfig.method : "POST",
          secret: "webhookSecret" in webhookConfig ? webhookConfig.webhookSecret : undefined,
        }
      );
      return result.success;
    }

    default:
      return false;
  }
}

/**
 * Format message from template
 */
function formatMessage(
  template: MessageTemplate | undefined,
  event: TriggerEvent,
  data: Record<string, unknown>
): MessageTemplate {
  // Default templates by event
  const defaultTemplates: Record<TriggerEvent, string> = {
    "session.created": "New session created: {{title}} on {{date}}",
    "session.started": "Session started: {{title}}",
    "session.completed": "Session completed: {{title}}",
    "session.cancelled": "Session cancelled: {{title}}",
    "booking.created": "New booking request from {{clientName}}",
    "booking.confirmed": "Booking confirmed: {{title}} on {{date}}",
    "booking.cancelled": "Booking cancelled: {{title}}",
    "invoice.created": "Invoice #{{invoiceNumber}} created for {{clientName}}",
    "invoice.paid": "Invoice #{{invoiceNumber}} paid - {{amount}}",
    "invoice.overdue": "Invoice #{{invoiceNumber}} is overdue",
    "client.created": "New client added: {{clientName}}",
    "project.created": "New project started: {{projectName}}",
    "project.completed": "Project completed: {{projectName}}",
    "file.uploaded": "New file uploaded: {{fileName}}",
    "payment.received": "Payment received: {{amount}} from {{clientName}}",
    "payment.failed": "Payment failed: {{amount}} from {{clientName}}",
  };

  const text = template?.text ?? defaultTemplates[event] ?? `Event: ${event}`;

  // Interpolate variables
  const interpolatedText = text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(data[key] ?? `{{${key}}}`);
  });

  return {
    text: interpolatedText,
    blocks: template?.blocks,
    embeds: template?.embeds,
  };
}

// =============================================================================
// Slack Message Builders
// =============================================================================

/**
 * Build Slack blocks for session notification
 */
export function buildSessionSlackBlocks(data: {
  title: string;
  date: string;
  time: string;
  room: string;
  client: string;
  engineer?: string;
  url?: string;
}): SlackBlock[] {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: data.title },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Date:*\n${data.date}` },
        { type: "mrkdwn", text: `*Time:*\n${data.time}` },
        { type: "mrkdwn", text: `*Room:*\n${data.room}` },
        { type: "mrkdwn", text: `*Client:*\n${data.client}` },
      ],
    },
    ...(data.engineer
      ? [
          {
            type: "context" as const,
            text: { type: "mrkdwn" as const, text: `Engineer: ${data.engineer}` },
          },
        ]
      : []),
    { type: "divider" },
  ];
}

/**
 * Build Slack blocks for invoice notification
 */
export function buildInvoiceSlackBlocks(data: {
  invoiceNumber: string;
  client: string;
  amount: string;
  status: string;
  dueDate?: string;
  url?: string;
}): SlackBlock[] {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: `Invoice #${data.invoiceNumber}` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Client:*\n${data.client}` },
        { type: "mrkdwn", text: `*Amount:*\n${data.amount}` },
        { type: "mrkdwn", text: `*Status:*\n${data.status}` },
        ...(data.dueDate ? [{ type: "mrkdwn" as const, text: `*Due:*\n${data.dueDate}` }] : []),
      ],
    },
    { type: "divider" },
  ];
}

// =============================================================================
// Exports
// =============================================================================

export const integrationsModule = {
  // Slack
  getSlackAuthUrl,
  exchangeSlackCode,
  sendSlackMessage,
  getSlackChannels,
  verifySlackSignature,

  // Discord
  getDiscordAuthUrl,
  sendDiscordMessage,

  // Webhook/Zapier
  sendWebhook,
  createZapierSubscription,

  // Management
  createIntegration,
  getIntegrations,
  getIntegration,
  updateIntegration,
  deleteIntegration,
  addTrigger,
  removeTrigger,

  // Events
  triggerEvent,

  // Builders
  buildSessionSlackBlocks,
  buildInvoiceSlackBlocks,
};

/**
 * Notifications Module
 *
 * Multi-channel notification system:
 * - In-app notifications (WebSocket)
 * - Email notifications
 * - Push notifications (Browser/Mobile)
 * - SMS notifications (optional)
 *
 * Features:
 * - Notification templates
 * - User preferences
 * - Scheduling
 * - Digest mode
 * - Multi-language support
 */

import { sendNotification as sendWSNotification } from "./websocket";

// =============================================================================
// Types
// =============================================================================

export type NotificationType =
  | "session_reminder"
  | "session_started"
  | "session_completed"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_overdue"
  | "payment_received"
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "project_update"
  | "file_shared"
  | "message_received"
  | "mention"
  | "system_alert"
  | "welcome";

export type NotificationChannel = "in_app" | "email" | "push" | "sms";

export interface NotificationTemplate {
  type: NotificationType;
  channels: NotificationChannel[];
  title: Record<string, string>; // by language code
  body: Record<string, string>;
  data?: Record<string, unknown>;
}

export interface NotificationPreferences {
  userId: number;
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  types: Record<NotificationType, boolean>;
  digestMode: boolean;
  digestFrequency: "instant" | "hourly" | "daily" | "weekly";
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string;
  timezone: string;
  language: string;
}

export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel: NotificationChannel;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  scheduledFor?: Date;
  sentAt?: Date;
  expiresAt?: Date;
}

export interface PushSubscription {
  userId: number;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  createdAt: Date;
}

// =============================================================================
// Templates
// =============================================================================

const templates: Record<NotificationType, NotificationTemplate> = {
  session_reminder: {
    type: "session_reminder",
    channels: ["in_app", "email", "push"],
    title: {
      en: "Session Reminder",
      fr: "Rappel de session",
      es: "Recordatorio de sesión",
    },
    body: {
      en: "Your session \"{{sessionTitle}}\" starts in {{timeUntil}}",
      fr: "Votre session \"{{sessionTitle}}\" commence dans {{timeUntil}}",
      es: "Tu sesión \"{{sessionTitle}}\" comienza en {{timeUntil}}",
    },
  },
  session_started: {
    type: "session_started",
    channels: ["in_app", "push"],
    title: {
      en: "Session Started",
      fr: "Session démarrée",
      es: "Sesión iniciada",
    },
    body: {
      en: "The session \"{{sessionTitle}}\" has started",
      fr: "La session \"{{sessionTitle}}\" a démarré",
      es: "La sesión \"{{sessionTitle}}\" ha comenzado",
    },
  },
  session_completed: {
    type: "session_completed",
    channels: ["in_app", "email"],
    title: {
      en: "Session Completed",
      fr: "Session terminée",
      es: "Sesión completada",
    },
    body: {
      en: "The session \"{{sessionTitle}}\" has been completed",
      fr: "La session \"{{sessionTitle}}\" est terminée",
      es: "La sesión \"{{sessionTitle}}\" ha sido completada",
    },
  },
  invoice_created: {
    type: "invoice_created",
    channels: ["in_app"],
    title: {
      en: "Invoice Created",
      fr: "Facture créée",
      es: "Factura creada",
    },
    body: {
      en: "Invoice #{{invoiceNumber}} for {{amount}} has been created",
      fr: "La facture #{{invoiceNumber}} de {{amount}} a été créée",
      es: "La factura #{{invoiceNumber}} por {{amount}} ha sido creada",
    },
  },
  invoice_sent: {
    type: "invoice_sent",
    channels: ["in_app", "email"],
    title: {
      en: "New Invoice",
      fr: "Nouvelle facture",
      es: "Nueva factura",
    },
    body: {
      en: "You have received invoice #{{invoiceNumber}} for {{amount}}. Due: {{dueDate}}",
      fr: "Vous avez reçu la facture #{{invoiceNumber}} de {{amount}}. Échéance: {{dueDate}}",
      es: "Has recibido la factura #{{invoiceNumber}} por {{amount}}. Vence: {{dueDate}}",
    },
  },
  invoice_paid: {
    type: "invoice_paid",
    channels: ["in_app", "email", "push"],
    title: {
      en: "Payment Received",
      fr: "Paiement reçu",
      es: "Pago recibido",
    },
    body: {
      en: "Payment of {{amount}} received for invoice #{{invoiceNumber}}",
      fr: "Paiement de {{amount}} reçu pour la facture #{{invoiceNumber}}",
      es: "Pago de {{amount}} recibido para la factura #{{invoiceNumber}}",
    },
  },
  invoice_overdue: {
    type: "invoice_overdue",
    channels: ["in_app", "email"],
    title: {
      en: "Invoice Overdue",
      fr: "Facture en retard",
      es: "Factura vencida",
    },
    body: {
      en: "Invoice #{{invoiceNumber}} for {{amount}} is now overdue",
      fr: "La facture #{{invoiceNumber}} de {{amount}} est en retard",
      es: "La factura #{{invoiceNumber}} por {{amount}} está vencida",
    },
  },
  payment_received: {
    type: "payment_received",
    channels: ["in_app", "email"],
    title: {
      en: "Payment Confirmed",
      fr: "Paiement confirmé",
      es: "Pago confirmado",
    },
    body: {
      en: "Your payment of {{amount}} has been confirmed. Thank you!",
      fr: "Votre paiement de {{amount}} a été confirmé. Merci!",
      es: "Tu pago de {{amount}} ha sido confirmado. ¡Gracias!",
    },
  },
  booking_created: {
    type: "booking_created",
    channels: ["in_app", "email"],
    title: {
      en: "Booking Request Received",
      fr: "Demande de réservation reçue",
      es: "Solicitud de reserva recibida",
    },
    body: {
      en: "New booking request for {{roomName}} on {{date}} at {{time}}",
      fr: "Nouvelle demande de réservation pour {{roomName}} le {{date}} à {{time}}",
      es: "Nueva solicitud de reserva para {{roomName}} el {{date}} a las {{time}}",
    },
  },
  booking_confirmed: {
    type: "booking_confirmed",
    channels: ["in_app", "email", "push"],
    title: {
      en: "Booking Confirmed",
      fr: "Réservation confirmée",
      es: "Reserva confirmada",
    },
    body: {
      en: "Your booking for {{roomName}} on {{date}} at {{time}} has been confirmed",
      fr: "Votre réservation pour {{roomName}} le {{date}} à {{time}} est confirmée",
      es: "Tu reserva para {{roomName}} el {{date}} a las {{time}} ha sido confirmada",
    },
  },
  booking_cancelled: {
    type: "booking_cancelled",
    channels: ["in_app", "email"],
    title: {
      en: "Booking Cancelled",
      fr: "Réservation annulée",
      es: "Reserva cancelada",
    },
    body: {
      en: "The booking for {{roomName}} on {{date}} has been cancelled",
      fr: "La réservation pour {{roomName}} le {{date}} a été annulée",
      es: "La reserva para {{roomName}} el {{date}} ha sido cancelada",
    },
  },
  project_update: {
    type: "project_update",
    channels: ["in_app", "email"],
    title: {
      en: "Project Update",
      fr: "Mise à jour du projet",
      es: "Actualización del proyecto",
    },
    body: {
      en: "Project \"{{projectTitle}}\" has been updated to {{status}}",
      fr: "Le projet \"{{projectTitle}}\" est passé à {{status}}",
      es: "El proyecto \"{{projectTitle}}\" ha sido actualizado a {{status}}",
    },
  },
  file_shared: {
    type: "file_shared",
    channels: ["in_app", "email"],
    title: {
      en: "File Shared",
      fr: "Fichier partagé",
      es: "Archivo compartido",
    },
    body: {
      en: "{{senderName}} shared \"{{fileName}}\" with you",
      fr: "{{senderName}} a partagé \"{{fileName}}\" avec vous",
      es: "{{senderName}} compartió \"{{fileName}}\" contigo",
    },
  },
  message_received: {
    type: "message_received",
    channels: ["in_app", "push"],
    title: {
      en: "New Message",
      fr: "Nouveau message",
      es: "Nuevo mensaje",
    },
    body: {
      en: "{{senderName}}: {{messagePreview}}",
      fr: "{{senderName}}: {{messagePreview}}",
      es: "{{senderName}}: {{messagePreview}}",
    },
  },
  mention: {
    type: "mention",
    channels: ["in_app", "push"],
    title: {
      en: "You were mentioned",
      fr: "Vous avez été mentionné",
      es: "Te han mencionado",
    },
    body: {
      en: "{{senderName}} mentioned you in {{context}}",
      fr: "{{senderName}} vous a mentionné dans {{context}}",
      es: "{{senderName}} te mencionó en {{context}}",
    },
  },
  system_alert: {
    type: "system_alert",
    channels: ["in_app", "email"],
    title: {
      en: "System Alert",
      fr: "Alerte système",
      es: "Alerta del sistema",
    },
    body: {
      en: "{{message}}",
      fr: "{{message}}",
      es: "{{message}}",
    },
  },
  welcome: {
    type: "welcome",
    channels: ["in_app", "email"],
    title: {
      en: "Welcome to Recording Studio Manager!",
      fr: "Bienvenue sur Recording Studio Manager!",
      es: "¡Bienvenido a Recording Studio Manager!",
    },
    body: {
      en: "Your account has been created. Get started by exploring the dashboard.",
      fr: "Votre compte a été créé. Commencez par explorer le tableau de bord.",
      es: "Tu cuenta ha sido creada. Comienza explorando el panel de control.",
    },
  },
};

// =============================================================================
// State (In production, use database)
// =============================================================================

const notifications: Notification[] = [];
const preferences = new Map<number, NotificationPreferences>();
const pushSubscriptions: PushSubscription[] = [];
const scheduledNotifications: Notification[] = [];

// =============================================================================
// Preferences
// =============================================================================

/**
 * Get default notification preferences
 */
export function getDefaultPreferences(userId: number): NotificationPreferences {
  return {
    userId,
    channels: {
      in_app: true,
      email: true,
      push: true,
      sms: false,
    },
    types: Object.keys(templates).reduce(
      (acc, type) => ({ ...acc, [type]: true }),
      {} as Record<NotificationType, boolean>
    ),
    digestMode: false,
    digestFrequency: "instant",
    quietHoursEnabled: false,
    timezone: "UTC",
    language: "en",
  };
}

/**
 * Get user notification preferences
 */
export function getPreferences(userId: number): NotificationPreferences {
  return preferences.get(userId) ?? getDefaultPreferences(userId);
}

/**
 * Update user notification preferences
 */
export function updatePreferences(
  userId: number,
  updates: Partial<NotificationPreferences>
): NotificationPreferences {
  const current = getPreferences(userId);
  const updated = { ...current, ...updates };
  preferences.set(userId, updated);
  return updated;
}

// =============================================================================
// Sending Notifications
// =============================================================================

/**
 * Send notification to user
 */
export async function notify(
  userId: number,
  type: NotificationType,
  data: Record<string, string> = {},
  options: {
    scheduledFor?: Date;
    expiresAt?: Date;
    channels?: NotificationChannel[];
  } = {}
): Promise<Notification[]> {
  const userPrefs = getPreferences(userId);
  const template = templates[type];

  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  // Check if user has disabled this notification type
  if (!userPrefs.types[type]) {
    return [];
  }

  // Check quiet hours
  if (isInQuietHours(userPrefs)) {
    // Schedule for after quiet hours
    const afterQuietHours = getNextActiveTime(userPrefs);
    options.scheduledFor = afterQuietHours;
  }

  // Determine channels to use
  const channels = options.channels ?? template.channels;
  const activeChannels = channels.filter((ch) => userPrefs.channels[ch]);

  // Create notifications for each channel
  const sentNotifications: Notification[] = [];

  for (const channel of activeChannels) {
    const notification = createNotification(
      userId,
      type,
      template,
      data,
      channel,
      userPrefs.language,
      options
    );

    if (options.scheduledFor && options.scheduledFor > new Date()) {
      // Schedule for later
      scheduledNotifications.push(notification);
    } else {
      // Send immediately
      await sendNotificationByChannel(notification);
    }

    sentNotifications.push(notification);
  }

  return sentNotifications;
}

/**
 * Create notification object
 */
function createNotification(
  userId: number,
  type: NotificationType,
  template: NotificationTemplate,
  data: Record<string, string>,
  channel: NotificationChannel,
  language: string,
  options: { scheduledFor?: Date; expiresAt?: Date }
): Notification {
  const title = interpolate(template.title[language] ?? template.title.en ?? "", data);
  const body = interpolate(template.body[language] ?? template.body.en ?? "", data);

  const notification: Notification = {
    id: generateId(),
    userId,
    type,
    title,
    body,
    data,
    channel,
    read: false,
    createdAt: new Date(),
    scheduledFor: options.scheduledFor,
    expiresAt: options.expiresAt,
  };

  // Store in-app notifications
  if (channel === "in_app") {
    notifications.push(notification);
    // Keep only last 10000
    if (notifications.length > 10000) {
      notifications.shift();
    }
  }

  return notification;
}

/**
 * Send notification via specific channel
 */
async function sendNotificationByChannel(notification: Notification): Promise<void> {
  notification.sentAt = new Date();

  switch (notification.channel) {
    case "in_app":
      sendWSNotification({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
      break;

    case "email":
      await sendEmailNotification(notification);
      break;

    case "push":
      await sendPushNotification(notification);
      break;

    case "sms":
      await sendSMSNotification(notification);
      break;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(notification: Notification): Promise<void> {
  // In production, use email service (SendGrid, SES, etc.)
  console.log(`[Notifications] Email to user ${notification.userId}: ${notification.title}`);
}

/**
 * Send push notification
 */
async function sendPushNotification(notification: Notification): Promise<void> {
  const subscriptions = pushSubscriptions.filter((s) => s.userId === notification.userId);

  for (const subscription of subscriptions) {
    // In production, use web-push library
    console.log(`[Notifications] Push to ${subscription.endpoint}: ${notification.title}`);
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(notification: Notification): Promise<void> {
  // In production, use SMS service (Twilio, etc.)
  console.log(`[Notifications] SMS to user ${notification.userId}: ${notification.title}`);
}

// =============================================================================
// Push Subscriptions
// =============================================================================

/**
 * Register push subscription
 */
export function registerPushSubscription(
  userId: number,
  endpoint: string,
  keys: { p256dh: string; auth: string },
  userAgent: string
): void {
  // Remove existing subscription for same endpoint
  const existingIndex = pushSubscriptions.findIndex((s) => s.endpoint === endpoint);
  if (existingIndex >= 0) {
    pushSubscriptions.splice(existingIndex, 1);
  }

  pushSubscriptions.push({
    userId,
    endpoint,
    keys,
    userAgent,
    createdAt: new Date(),
  });
}

/**
 * Unregister push subscription
 */
export function unregisterPushSubscription(endpoint: string): void {
  const index = pushSubscriptions.findIndex((s) => s.endpoint === endpoint);
  if (index >= 0) {
    pushSubscriptions.splice(index, 1);
  }
}

// =============================================================================
// Notification Management
// =============================================================================

/**
 * Get user notifications
 */
export function getUserNotifications(
  userId: number,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): { notifications: Notification[]; total: number; unread: number } {
  let userNotifications = notifications.filter((n) => n.userId === userId);

  const total = userNotifications.length;
  const unread = userNotifications.filter((n) => !n.read).length;

  if (options.unreadOnly) {
    userNotifications = userNotifications.filter((n) => !n.read);
  }

  // Sort by date descending
  userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Apply pagination
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  userNotifications = userNotifications.slice(offset, offset + limit);

  return { notifications: userNotifications, total, unread };
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string): void {
  const notification = notifications.find((n) => n.id === notificationId);
  if (notification) {
    notification.read = true;
    notification.readAt = new Date();
  }
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead(userId: number): number {
  let count = 0;
  for (const notification of notifications) {
    if (notification.userId === userId && !notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      count++;
    }
  }
  return count;
}

/**
 * Delete notification
 */
export function deleteNotification(notificationId: string): void {
  const index = notifications.findIndex((n) => n.id === notificationId);
  if (index >= 0) {
    notifications.splice(index, 1);
  }
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Interpolate template variables
 */
function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if current time is in user's quiet hours
 */
function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const [startHour, startMin] = prefs.quietHoursStart.split(":").map(Number);
  const [endHour, endMin] = prefs.quietHoursEnd.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
  const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);

  if (startMinutes <= endMinutes) {
    // Same day quiet hours (e.g., 22:00 - 07:00 next day won't match)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight quiet hours
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * Get next time after quiet hours
 */
function getNextActiveTime(prefs: NotificationPreferences): Date {
  if (!prefs.quietHoursEnd) {
    return new Date();
  }

  const [endHour, endMin] = prefs.quietHoursEnd.split(":").map(Number);
  const next = new Date();
  next.setHours(endHour ?? 0, endMin ?? 0, 0, 0);

  if (next <= new Date()) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Process scheduled notifications
 */
export function processScheduledNotifications(): void {
  const now = new Date();
  const toSend = scheduledNotifications.filter(
    (n) => n.scheduledFor && n.scheduledFor <= now
  );

  for (const notification of toSend) {
    sendNotificationByChannel(notification).catch(console.error);

    // Remove from scheduled
    const index = scheduledNotifications.indexOf(notification);
    if (index >= 0) {
      scheduledNotifications.splice(index, 1);
    }
  }
}

// Start processing scheduled notifications every minute
setInterval(processScheduledNotifications, 60000);

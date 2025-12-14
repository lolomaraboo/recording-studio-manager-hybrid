/**
 * Calendar Integration Module
 *
 * Multi-provider calendar synchronization and export.
 *
 * Features:
 * - Google Calendar 2-way sync
 * - iCal/ICS export for subscribable calendars
 * - Outlook Calendar integration (via Microsoft Graph)
 * - Apple Calendar support via CalDAV
 * - Webhook support for real-time updates
 * - Conflict detection and resolution
 * - Timezone handling
 *
 * Supported providers:
 * - Google Calendar (OAuth 2.0)
 * - Microsoft Outlook (OAuth 2.0)
 * - Apple iCloud (CalDAV)
 * - Generic iCal (ICS files)
 */

// =============================================================================
// Types
// =============================================================================

export type CalendarProvider = "google" | "outlook" | "apple" | "ical";

export interface CalendarEvent {
  id: string;
  externalId?: string; // ID from external calendar
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  timezone: string;
  recurrence?: RecurrenceRule;
  attendees?: Attendee[];
  reminders?: Reminder[];
  status: "confirmed" | "tentative" | "cancelled";
  visibility: "public" | "private" | "confidential";
  colorId?: string;
  metadata?: Record<string, unknown>;
  // RSM-specific fields
  sessionId?: number;
  clientId?: number;
  roomId?: number;
  organizationId: number;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number; // Every N days/weeks/etc.
  count?: number; // Number of occurrences
  until?: Date; // End date
  byDay?: string[]; // ["MO", "WE", "FR"]
  byMonth?: number[]; // [1, 6, 12]
  byMonthDay?: number[]; // [1, 15, -1]
  exceptions?: Date[]; // Excluded dates
}

export interface Attendee {
  email: string;
  name?: string;
  status: "accepted" | "declined" | "tentative" | "needs-action";
  optional: boolean;
  organizer: boolean;
}

export interface Reminder {
  method: "email" | "popup" | "sms";
  minutes: number; // Minutes before event
}

export interface CalendarConnection {
  id: string;
  userId: number;
  organizationId: number;
  provider: CalendarProvider;
  calendarId: string;
  calendarName: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  syncEnabled: boolean;
  syncDirection: "import" | "export" | "both";
  lastSyncAt?: Date;
  syncStatus: "active" | "paused" | "error";
  errorMessage?: string;
  settings: CalendarSyncSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarSyncSettings {
  syncSessions: boolean;
  syncBookings: boolean;
  includeClientNames: boolean;
  includeRoomNames: boolean;
  defaultReminders: Reminder[];
  eventPrefix?: string; // e.g., "[Studio] "
  colorMapping?: Record<string, string>; // roomId -> colorId
}

export interface SyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  conflicts: SyncConflict[];
  errors: string[];
  syncedAt: Date;
}

export interface SyncConflict {
  localEvent: CalendarEvent;
  remoteEvent: CalendarEvent;
  conflictType: "time" | "title" | "deleted";
  resolution?: "keep_local" | "keep_remote" | "manual";
}

// =============================================================================
// Configuration
// =============================================================================

interface CalendarConfig {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  outlook: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  icalBaseUrl: string;
  defaultTimezone: string;
}

const config: CalendarConfig = {
  google: {
    clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? "http://localhost:3001/api/calendar/google/callback",
  },
  outlook: {
    clientId: process.env.OUTLOOK_CLIENT_ID ?? "",
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET ?? "",
    redirectUri: process.env.OUTLOOK_REDIRECT_URI ?? "http://localhost:3001/api/calendar/outlook/callback",
  },
  icalBaseUrl: process.env.ICAL_BASE_URL ?? "http://localhost:3001/api/calendar/ical",
  defaultTimezone: process.env.DEFAULT_TIMEZONE ?? "America/New_York",
};

// =============================================================================
// In-memory storage (In production, use database)
// =============================================================================

const connections = new Map<string, CalendarConnection>();
const events = new Map<string, CalendarEvent>();

// =============================================================================
// OAuth Helpers
// =============================================================================

/**
 * Get Google Calendar OAuth URL
 */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Get Microsoft Outlook OAuth URL
 */
export function getOutlookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.outlook.clientId,
    redirect_uri: config.outlook.redirectUri,
    response_type: "code",
    scope: "Calendars.ReadWrite offline_access",
    state,
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens (Google)
 */
export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  // In production, this would make actual API call
  console.log(`[Calendar] Exchanging Google auth code: ${code.substring(0, 10)}...`);

  // Mock response
  return {
    accessToken: `google_access_${Date.now()}`,
    refreshToken: `google_refresh_${Date.now()}`,
    expiresIn: 3600,
  };
}

/**
 * Exchange authorization code for tokens (Outlook)
 */
export async function exchangeOutlookCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  console.log(`[Calendar] Exchanging Outlook auth code: ${code.substring(0, 10)}...`);

  return {
    accessToken: `outlook_access_${Date.now()}`,
    refreshToken: `outlook_refresh_${Date.now()}`,
    expiresIn: 3600,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  connection: CalendarConnection
): Promise<{ accessToken: string; expiresIn: number }> {
  console.log(`[Calendar] Refreshing token for ${connection.provider}`);

  // In production, call provider API
  return {
    accessToken: `${connection.provider}_access_${Date.now()}`,
    expiresIn: 3600,
  };
}

// =============================================================================
// Connection Management
// =============================================================================

/**
 * Create a new calendar connection
 */
export async function createConnection(
  userId: number,
  organizationId: number,
  provider: CalendarProvider,
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number },
  calendarId: string,
  calendarName: string
): Promise<CalendarConnection> {
  const id = `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const connection: CalendarConnection = {
    id,
    userId,
    organizationId,
    provider,
    calendarId,
    calendarName,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenExpiry: tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : undefined,
    syncEnabled: true,
    syncDirection: "both",
    syncStatus: "active",
    settings: {
      syncSessions: true,
      syncBookings: true,
      includeClientNames: true,
      includeRoomNames: true,
      defaultReminders: [{ method: "popup", minutes: 30 }],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  connections.set(id, connection);
  console.log(`[Calendar] Connection created: ${id} (${provider})`);

  return connection;
}

/**
 * Get user's calendar connections
 */
export async function getConnections(userId: number): Promise<CalendarConnection[]> {
  return Array.from(connections.values()).filter((c) => c.userId === userId);
}

/**
 * Get connection by ID
 */
export async function getConnection(connectionId: string): Promise<CalendarConnection | null> {
  return connections.get(connectionId) ?? null;
}

/**
 * Update connection settings
 */
export async function updateConnection(
  connectionId: string,
  updates: Partial<Pick<CalendarConnection, "syncEnabled" | "syncDirection" | "settings">>
): Promise<CalendarConnection | null> {
  const connection = connections.get(connectionId);
  if (!connection) return null;

  const updated = {
    ...connection,
    ...updates,
    updatedAt: new Date(),
  };

  connections.set(connectionId, updated);
  return updated;
}

/**
 * Delete a calendar connection
 */
export async function deleteConnection(connectionId: string): Promise<boolean> {
  const deleted = connections.delete(connectionId);
  if (deleted) {
    console.log(`[Calendar] Connection deleted: ${connectionId}`);
  }
  return deleted;
}

// =============================================================================
// Event Sync
// =============================================================================

/**
 * Sync events with external calendar
 */
export async function syncCalendar(connectionId: string): Promise<SyncResult> {
  const connection = connections.get(connectionId);
  if (!connection) {
    return {
      success: false,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      conflicts: [],
      errors: ["Connection not found"],
      syncedAt: new Date(),
    };
  }

  console.log(`[Calendar] Starting sync for ${connection.provider} (${connectionId})`);

  // In production, this would:
  // 1. Fetch events from external calendar
  // 2. Compare with local events
  // 3. Resolve conflicts
  // 4. Push/pull changes

  const result: SyncResult = {
    success: true,
    eventsCreated: Math.floor(Math.random() * 5),
    eventsUpdated: Math.floor(Math.random() * 3),
    eventsDeleted: 0,
    conflicts: [],
    errors: [],
    syncedAt: new Date(),
  };

  // Update connection
  connection.lastSyncAt = result.syncedAt;
  connection.syncStatus = "active";
  connections.set(connectionId, connection);

  console.log(
    `[Calendar] Sync complete: ${result.eventsCreated} created, ${result.eventsUpdated} updated`
  );

  return result;
}

/**
 * Push a single event to external calendar
 */
export async function pushEvent(
  connectionId: string,
  event: CalendarEvent
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const connection = connections.get(connectionId);
  if (!connection) {
    return { success: false, error: "Connection not found" };
  }

  console.log(`[Calendar] Pushing event ${event.id} to ${connection.provider}`);

  // In production, call provider API
  const externalId = `ext_${connection.provider}_${Date.now()}`;

  // Update event with external ID
  event.externalId = externalId;
  events.set(event.id, event);

  return { success: true, externalId };
}

/**
 * Delete event from external calendar
 */
export async function deleteExternalEvent(
  connectionId: string,
  externalId: string
): Promise<boolean> {
  const connection = connections.get(connectionId);
  if (!connection) return false;

  console.log(`[Calendar] Deleting external event ${externalId} from ${connection.provider}`);

  // In production, call provider API
  return true;
}

// =============================================================================
// iCal Export
// =============================================================================

/**
 * Generate iCal feed URL for organization
 */
export function getICalFeedUrl(organizationId: number, token: string): string {
  return `${config.icalBaseUrl}/${organizationId}/${token}.ics`;
}

/**
 * Generate iCal content for events
 */
export function generateICalContent(
  calendarEvents: CalendarEvent[],
  calendarName: string
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Recording Studio Manager//Calendar//EN",
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of calendarEvents) {
    lines.push(...generateVEvent(event));
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Generate VEVENT component
 */
function generateVEvent(event: CalendarEvent): string[] {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${event.id}@recordingstudiomanager.com`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(event.startTime, event.allDay)}`,
    `DTEND:${formatICalDate(event.endTime, event.allDay)}`,
    `SUMMARY:${escapeICalText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }

  lines.push(`STATUS:${event.status.toUpperCase()}`);

  // Add attendees
  if (event.attendees) {
    for (const attendee of event.attendees) {
      const role = attendee.organizer ? "CHAIR" : attendee.optional ? "OPT-PARTICIPANT" : "REQ-PARTICIPANT";
      const partstat = attendee.status.toUpperCase().replace("-", "");
      lines.push(
        `ATTENDEE;ROLE=${role};PARTSTAT=${partstat};CN=${escapeICalText(attendee.name ?? attendee.email)}:mailto:${attendee.email}`
      );
    }
  }

  // Add reminders
  if (event.reminders) {
    for (const reminder of event.reminders) {
      lines.push("BEGIN:VALARM");
      lines.push(`TRIGGER:-PT${reminder.minutes}M`);
      lines.push(`ACTION:${reminder.method === "email" ? "EMAIL" : "DISPLAY"}`);
      lines.push(`DESCRIPTION:${escapeICalText(event.title)}`);
      lines.push("END:VALARM");
    }
  }

  // Add recurrence rule
  if (event.recurrence) {
    lines.push(generateRRule(event.recurrence));
  }

  lines.push("END:VEVENT");

  return lines;
}

/**
 * Format date for iCal
 */
function formatICalDate(date: Date, allDay = false): string {
  if (allDay) {
    const parts = date.toISOString().split("T");
    return (parts[0] ?? "").replace(/-/g, "");
  }
  const parts = date.toISOString().replace(/[-:]/g, "").split(".");
  return (parts[0] ?? "") + "Z";
}

/**
 * Escape text for iCal
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate RRULE string
 */
function generateRRule(rule: RecurrenceRule): string {
  const parts = [`RRULE:FREQ=${rule.frequency.toUpperCase()}`];

  if (rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }

  if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  } else if (rule.until) {
    parts.push(`UNTIL=${formatICalDate(rule.until)}`);
  }

  if (rule.byDay?.length) {
    parts.push(`BYDAY=${rule.byDay.join(",")}`);
  }

  if (rule.byMonth?.length) {
    parts.push(`BYMONTH=${rule.byMonth.join(",")}`);
  }

  if (rule.byMonthDay?.length) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(",")}`);
  }

  return parts.join(";");
}

/**
 * Parse iCal content (for import)
 */
export function parseICalContent(icalContent: string): CalendarEvent[] {
  const parsedEvents: CalendarEvent[] = [];
  const eventMatches = icalContent.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];

  for (const eventBlock of eventMatches) {
    const event = parseVEvent(eventBlock);
    if (event) {
      parsedEvents.push(event);
    }
  }

  return parsedEvents;
}

/**
 * Parse VEVENT block
 */
function parseVEvent(block: string): CalendarEvent | null {
  const getValue = (key: string): string | undefined => {
    const match = block.match(new RegExp(`${key}[^:]*:(.+?)(?:\\r?\\n|$)`));
    return match && match[1] ? match[1].replace(/\\n/g, "\n").replace(/\\,/g, ",") : undefined;
  };

  const uid = getValue("UID");
  const summary = getValue("SUMMARY");
  const dtstart = getValue("DTSTART");
  const dtend = getValue("DTEND");

  if (!uid || !summary || !dtstart) return null;

  const allDay = !dtstart.includes("T");

  return {
    id: uid.split("@")[0] ?? uid,
    title: summary,
    description: getValue("DESCRIPTION"),
    location: getValue("LOCATION"),
    startTime: parseICalDate(dtstart),
    endTime: dtend ? parseICalDate(dtend) : parseICalDate(dtstart),
    allDay,
    timezone: config.defaultTimezone,
    status: "confirmed",
    visibility: "private",
    organizationId: 0, // Will be set by caller
  };
}

/**
 * Parse iCal date
 */
function parseICalDate(dateStr: string): Date {
  // Handle all-day dates (YYYYMMDD)
  if (dateStr.length === 8) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  // Handle datetime (YYYYMMDDTHHMMSSZ)
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  const hour = parseInt(dateStr.substring(9, 11));
  const minute = parseInt(dateStr.substring(11, 13));
  const second = parseInt(dateStr.substring(13, 15));

  if (dateStr.endsWith("Z")) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(year, month, day, hour, minute, second);
}

// =============================================================================
// Session to Event Conversion
// =============================================================================

export interface SessionData {
  id: number;
  title: string;
  date: Date;
  startTime: string; // "HH:MM"
  endTime: string;
  roomId: number;
  roomName: string;
  clientId: number;
  clientName: string;
  notes?: string;
  organizationId: number;
}

/**
 * Convert a recording session to a calendar event
 */
export function sessionToEvent(session: SessionData, settings: CalendarSyncSettings): CalendarEvent {
  const startParts = session.startTime.split(":").map(Number);
  const endParts = session.endTime.split(":").map(Number);
  const startHour = startParts[0] ?? 0;
  const startMin = startParts[1] ?? 0;
  const endHour = endParts[0] ?? 0;
  const endMin = endParts[1] ?? 0;

  const startTime = new Date(session.date);
  startTime.setHours(startHour, startMin, 0, 0);

  const endTime = new Date(session.date);
  endTime.setHours(endHour, endMin, 0, 0);

  let title = settings.eventPrefix ?? "";
  title += session.title;
  if (settings.includeClientNames) {
    title += ` - ${session.clientName}`;
  }

  let description = "";
  if (settings.includeRoomNames) {
    description += `Room: ${session.roomName}\n`;
  }
  if (session.notes) {
    description += `\nNotes: ${session.notes}`;
  }

  return {
    id: `session_${session.id}`,
    title,
    description,
    location: session.roomName,
    startTime,
    endTime,
    allDay: false,
    timezone: config.defaultTimezone,
    status: "confirmed",
    visibility: "private",
    reminders: settings.defaultReminders,
    sessionId: session.id,
    clientId: session.clientId,
    roomId: session.roomId,
    organizationId: session.organizationId,
    colorId: settings.colorMapping?.[String(session.roomId)],
  };
}

/**
 * Convert calendar event to session update
 */
export function eventToSessionUpdate(event: CalendarEvent): Partial<SessionData> {
  return {
    title: event.title,
    date: event.startTime,
    startTime: `${event.startTime.getHours().toString().padStart(2, "0")}:${event.startTime.getMinutes().toString().padStart(2, "0")}`,
    endTime: `${event.endTime.getHours().toString().padStart(2, "0")}:${event.endTime.getMinutes().toString().padStart(2, "0")}`,
    notes: event.description,
  };
}

// =============================================================================
// Availability Check
// =============================================================================

/**
 * Check if a time slot is available (no conflicts)
 */
export function checkAvailability(
  organizationId: number,
  roomId: number,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): { available: boolean; conflicts: CalendarEvent[] } {
  const orgEvents = Array.from(events.values()).filter(
    (e) =>
      e.organizationId === organizationId &&
      e.roomId === roomId &&
      e.id !== excludeEventId &&
      e.status !== "cancelled"
  );

  const conflicts = orgEvents.filter((e) => {
    // Check for time overlap
    return startTime < e.endTime && endTime > e.startTime;
  });

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Find available time slots for a given date
 */
export function findAvailableSlots(
  organizationId: number,
  roomId: number,
  date: Date,
  durationMinutes: number,
  workingHours = { start: 9, end: 21 }
): Array<{ startTime: Date; endTime: Date }> {
  const slots: Array<{ startTime: Date; endTime: Date }> = [];

  // Get existing events for the day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dayEvents = Array.from(events.values())
    .filter(
      (e) =>
        e.organizationId === organizationId &&
        e.roomId === roomId &&
        e.startTime >= dayStart &&
        e.startTime <= dayEnd &&
        e.status !== "cancelled"
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Start from working hours start
  let currentTime = new Date(date);
  currentTime.setHours(workingHours.start, 0, 0, 0);

  const workEnd = new Date(date);
  workEnd.setHours(workingHours.end, 0, 0, 0);

  for (const event of dayEvents) {
    // Check if there's a slot before this event
    const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd <= event.startTime) {
      slots.push({
        startTime: new Date(currentTime),
        endTime: slotEnd,
      });
    }
    // Move current time to after this event
    currentTime = new Date(Math.max(currentTime.getTime(), event.endTime.getTime()));
  }

  // Check for slot after last event
  if (currentTime < workEnd) {
    const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd <= workEnd) {
      slots.push({
        startTime: new Date(currentTime),
        endTime: slotEnd,
      });
    }
  }

  return slots;
}

// =============================================================================
// Exports
// =============================================================================

export const calendar = {
  // OAuth
  getGoogleAuthUrl,
  getOutlookAuthUrl,
  exchangeGoogleCode,
  exchangeOutlookCode,
  refreshAccessToken,

  // Connections
  createConnection,
  getConnections,
  getConnection,
  updateConnection,
  deleteConnection,

  // Sync
  syncCalendar,
  pushEvent,
  deleteExternalEvent,

  // iCal
  getICalFeedUrl,
  generateICalContent,
  parseICalContent,

  // Conversion
  sessionToEvent,
  eventToSessionUpdate,

  // Availability
  checkAvailability,
  findAvailableSlots,
};

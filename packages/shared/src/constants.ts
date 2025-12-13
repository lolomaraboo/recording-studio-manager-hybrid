/**
 * Shared constants
 */

export const COOKIE_NAME = "rsm_session";

export const USER_ROLES = ["admin", "member", "guest"] as const;

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;

export const SESSION_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"] as const;

export const CLIENT_TYPES = ["individual", "company"] as const;

export const CURRENCIES = ["EUR", "USD", "GBP", "CAD"] as const;

export const TIMEZONES = [
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
] as const;

export const LANGUAGES = ["fr", "en", "es", "de"] as const;

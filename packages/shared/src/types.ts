/**
 * Shared TypeScript types
 */

export type UserRole = "admin" | "member" | "guest";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type ClientType = "individual" | "company";

// Common utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

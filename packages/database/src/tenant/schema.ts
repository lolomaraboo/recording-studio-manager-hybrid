/**
 * Tenant Database Schema
 *
 * Each organization has its own PostgreSQL database with these tables:
 * - clients: Client records
 * - sessions: Recording sessions
 * - invoices: Invoices and billing
 * - equipment: Studio equipment
 * - rooms: Studio rooms
 * - projects: Projects and tracks
 */

import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";

/**
 * Clients table (Tenant DB)
 */
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Optional link to Master DB user
  name: varchar("name", { length: 255 }).notNull(),
  artistName: varchar("artist_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  type: varchar("type", { length: 50 }).notNull().default("individual"), // "individual" | "company"
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  notes: text("notes"),
  isVip: boolean("is_vip").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  portalAccess: boolean("portal_access").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Rooms table (Tenant DB)
 * Studio rooms/spaces for recording, mixing, mastering, etc.
 */
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),

  // Basic Info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull().default("recording"), // "recording" | "mixing" | "mastering" | "rehearsal" | "live"

  // Pricing
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  halfDayRate: decimal("half_day_rate", { precision: 10, scale: 2 }),
  fullDayRate: decimal("full_day_rate", { precision: 10, scale: 2 }),

  // Capacity & Features
  capacity: integer("capacity").notNull().default(1), // Number of people
  size: integer("size"), // Size in square meters
  hasIsolationBooth: boolean("has_isolation_booth").notNull().default(false),
  hasLiveRoom: boolean("has_live_room").notNull().default(false),
  hasControlRoom: boolean("has_control_room").notNull().default(false),

  // Equipment (JSON array of fixed equipment IDs)
  equipmentList: text("equipment_list"), // JSON array: [1, 2, 3, ...]

  // Status
  isActive: boolean("is_active").notNull().default(true),
  isAvailableForBooking: boolean("is_available_for_booking").notNull().default(true),

  // Visual
  color: varchar("color", { length: 7 }).default("#3498db"), // Hex color for calendar
  imageUrl: varchar("image_url", { length: 500 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

/**
 * Sessions table (Tenant DB)
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"), // "scheduled" | "in_progress" | "completed" | "cancelled"
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * Invoices table (Tenant DB)
 */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // "draft" | "sent" | "paid" | "overdue" | "cancelled"
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("20.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Invoice Items table (Tenant DB)
 */
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1.00"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

/**
 * Equipment table (Tenant DB)
 * Studio equipment, gear, and instruments
 */
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id), // Optional: equipment can be assigned to a room

  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),

  // Category
  category: varchar("category", { length: 100 }).notNull(), // "microphone" | "preamp" | "interface" | "outboard" | "instrument" | "monitoring" | "computer" | "cable" | "accessory" | "other"

  // Details
  description: text("description"),
  specifications: text("specifications"), // JSON object with technical specs

  // Financial
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  warrantyUntil: timestamp("warranty_until"),

  // Status & Condition
  status: varchar("status", { length: 50 }).notNull().default("operational"), // "operational" | "maintenance" | "out_of_service" | "rented"
  condition: varchar("condition", { length: 50 }).notNull().default("good"), // "excellent" | "good" | "fair" | "poor"

  // Maintenance
  lastMaintenanceAt: timestamp("last_maintenance_at"),
  nextMaintenanceAt: timestamp("next_maintenance_at"),
  maintenanceNotes: text("maintenance_notes"),

  // Location & Availability
  location: varchar("location", { length: 255 }),
  isAvailable: boolean("is_available").notNull().default(true),

  // Visual
  imageUrl: varchar("image_url", { length: 500 }),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

/**
 * Projects table (Tenant DB)
 * Musical projects, albums, EPs, singles
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),

  // Basic Info
  name: varchar("name", { length: 255 }).notNull(),
  artistName: varchar("artist_name", { length: 255 }),
  description: text("description"),
  genre: varchar("genre", { length: 100 }),

  // Type & Status
  type: varchar("type", { length: 50 }).notNull().default("album"), // "album" | "ep" | "single" | "demo" | "soundtrack" | "podcast"
  status: varchar("status", { length: 50 }).notNull().default("pre_production"), // "pre_production" | "recording" | "editing" | "mixing" | "mastering" | "completed" | "delivered" | "archived"

  // Timeline
  startDate: timestamp("start_date"),
  targetDeliveryDate: timestamp("target_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  endDate: timestamp("end_date"),

  // Financial
  budget: decimal("budget", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),

  // Details
  trackCount: integer("track_count").default(0),
  label: varchar("label", { length: 200 }),
  catalogNumber: varchar("catalog_number", { length: 100 }),

  // Links
  coverArtUrl: varchar("cover_art_url", { length: 500 }),
  spotifyUrl: varchar("spotify_url", { length: 500 }),
  appleMusicUrl: varchar("apple_music_url", { length: 500 }),

  // Storage
  storageLocation: varchar("storage_location", { length: 500 }), // Path to project files
  storageSize: integer("storage_size"), // Size in MB

  // Notes
  notes: text("notes"),
  technicalNotes: text("technical_notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Tracks table (Tenant DB)
 * Individual tracks/songs within projects
 */
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),

  // Basic Info
  title: varchar("title", { length: 255 }).notNull(),
  trackNumber: integer("track_number"),
  duration: integer("duration"), // Duration in seconds
  isrc: varchar("isrc", { length: 50 }), // International Standard Recording Code

  // Status
  status: varchar("status", { length: 50 }).notNull().default("recording"), // "recording" | "editing" | "mixing" | "mastering" | "completed"

  // Details
  bpm: integer("bpm"),
  key: varchar("key", { length: 20 }), // Musical key (e.g., "C Major", "Am")
  lyrics: text("lyrics"),

  // Files
  fileUrl: varchar("file_url", { length: 500 }),
  waveformUrl: varchar("waveform_url", { length: 500 }),

  // Notes
  notes: text("notes"),
  technicalNotes: text("technical_notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

/**
 * Musicians table (Tenant DB)
 * Musicians/artists involved in projects
 */
export const musicians = pgTable("musicians", {
  id: serial("id").primaryKey(),

  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  stageName: varchar("stage_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),

  // Professional
  bio: text("bio"),
  talentType: varchar("talent_type", { length: 50 }).notNull().default("musician"), // "musician" | "actor"
  primaryInstrument: varchar("primary_instrument", { length: 100 }), // Legacy field
  website: varchar("website", { length: 500 }),
  spotifyUrl: varchar("spotify_url", { length: 500 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // Legacy pricing

  // Details
  instruments: text("instruments"), // JSON array
  genres: text("genres"), // JSON array

  // Image
  photoUrl: varchar("photo_url", { length: 500 }), // Legacy field
  imageUrl: varchar("image_url", { length: 500 }),

  // Status
  isActive: boolean("is_active").notNull().default(true), // Legacy status

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Musician = typeof musicians.$inferSelect;
export type InsertMusician = typeof musicians.$inferInsert;

/**
 * Track Credits table (Tenant DB)
 * Credits for each track (producer, engineer, musician, etc.)
 */
export const trackCredits = pgTable("track_credits", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  musicianId: integer("musician_id").references(() => musicians.id),

  // Credit Info
  role: varchar("role", { length: 100 }).notNull(), // "producer" | "engineer" | "mixing" | "mastering" | "vocals" | "guitar" | "drums" | "bass" | etc.
  creditName: varchar("credit_name", { length: 255 }).notNull(), // Name as it should appear in credits
  isPrimary: boolean("is_primary").notNull().default(false),

  // Details
  description: text("description"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TrackCredit = typeof trackCredits.$inferSelect;
export type InsertTrackCredit = typeof trackCredits.$inferInsert;

/**
 * Quotes table (Tenant DB)
 * Price quotes/estimates for clients before creating invoices
 */
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number", { length: 100 }).notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),

  // Dates
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  validUntil: timestamp("valid_until").notNull(), // Quote expiration date

  // Status
  status: varchar("status", { length: 50 }).notNull().default("draft"), // "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted"

  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("20.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  // Conversion
  convertedToInvoiceId: integer("converted_to_invoice_id").references(() => invoices.id),
  convertedAt: timestamp("converted_at"),

  // Details
  title: varchar("title", { length: 255 }),
  description: text("description"),
  terms: text("terms"), // Payment terms and conditions
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Quote Items table (Tenant DB)
 * Line items for quotes
 */
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),

  // Item Info
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1.00"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  // Optional links
  sessionId: integer("session_id").references(() => sessions.id),
  equipmentId: integer("equipment_id").references(() => equipment.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

/**
 * Contracts table (Tenant DB)
 * Legal contracts with clients
 */
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  contractNumber: varchar("contract_number", { length: 100 }).notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),

  // Type & Status
  type: varchar("type", { length: 50 }).notNull(), // "recording" | "mixing" | "mastering" | "production" | "exclusivity" | "distribution" | "studio_rental" | "services" | "partnership" | "other"
  status: varchar("status", { length: 50 }).notNull().default("draft"), // "draft" | "sent" | "pending_signature" | "signed" | "active" | "expired" | "terminated" | "cancelled"

  // Content
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  terms: text("terms").notNull(), // Full contract text/terms

  // Dates
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  signedAt: timestamp("signed_at"),

  // Financial
  value: decimal("value", { precision: 10, scale: 2 }), // Total contract value

  // Documents
  documentUrl: varchar("document_url", { length: 500 }), // PDF or document link
  signedDocumentUrl: varchar("signed_document_url", { length: 500 }),

  // E-signature (DocuSign, etc.)
  signatureRequestId: varchar("signature_request_id", { length: 255 }),
  signedBy: varchar("signed_by", { length: 255 }), // Client signature name

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Expenses table (Tenant DB)
 * Business expenses and costs
 */
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),

  // Category & Type
  category: varchar("category", { length: 100 }).notNull(), // "rent" | "utilities" | "insurance" | "maintenance" | "salary" | "marketing" | "software" | "supplies" | "equipment" | "other"

  // Basic Info
  description: varchar("description", { length: 500 }).notNull(),
  vendor: varchar("vendor", { length: 255 }), // Company/person paid

  // Financial
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),

  // Dates
  expenseDate: timestamp("expense_date").notNull(),
  paidAt: timestamp("paid_at"),

  // Payment
  paymentMethod: varchar("payment_method", { length: 50 }), // "cash" | "card" | "bank_transfer" | "check" | "other"
  referenceNumber: varchar("reference_number", { length: 100 }), // Invoice/receipt number

  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending" | "paid" | "cancelled"
  isRecurring: boolean("is_recurring").notNull().default(false),

  // Optional links
  projectId: integer("project_id").references(() => projects.id),
  equipmentId: integer("equipment_id").references(() => equipment.id),

  // Documents
  receiptUrl: varchar("receipt_url", { length: 500 }),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Payments table (Tenant DB)
 * Payments received from clients
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),

  // Links
  clientId: integer("client_id").notNull().references(() => clients.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),

  // Payment Info
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),

  // Method
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // "cash" | "card" | "bank_transfer" | "check" | "stripe" | "paypal" | "other"
  referenceNumber: varchar("reference_number", { length: 100 }), // Transaction ID, check number, etc.

  // Stripe Integration
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),

  // Status
  status: varchar("status", { length: 50 }).notNull().default("completed"), // "pending" | "completed" | "failed" | "refunded"

  // Refunds
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }),
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Notifications table (Tenant DB)
 * User notifications for events, reminders, and updates
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),

  // Type & Priority
  type: varchar("type", { length: 50 }).notNull(), // "info" | "success" | "warning" | "error" | "reminder" | "system"
  priority: varchar("priority", { length: 50 }).notNull().default("normal"), // "low" | "normal" | "high" | "urgent"

  // Content
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  // Action
  actionUrl: varchar("action_url", { length: 500 }), // Optional URL to navigate to when clicked
  actionLabel: varchar("action_label", { length: 100 }), // Optional label for action button

  // Metadata
  metadata: text("metadata"), // JSON object with additional data

  // Status
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),

  // Optional links
  clientId: integer("client_id").references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  sessionId: integer("session_id").references(() => sessions.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

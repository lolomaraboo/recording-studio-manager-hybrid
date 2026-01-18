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

import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal, date, jsonb } from "drizzle-orm/pg-core";

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

  // NEW: vCard 4.0 compatible fields
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  middleName: varchar("middle_name", { length: 100 }),
  prefix: varchar("prefix", { length: 20 }), // Mr., Mrs., Dr., etc.
  suffix: varchar("suffix", { length: 20 }), // Jr., III, etc.
  avatarUrl: varchar("avatar_url", { length: 500 }), // For individuals
  logoUrl: varchar("logo_url", { length: 500 }), // For companies
  phones: jsonb("phones").$type<Array<{type: string; number: string}>>().default([]),
  emails: jsonb("emails").$type<Array<{type: string; email: string}>>().default([]),
  websites: jsonb("websites").$type<Array<{type: string; url: string}>>().default([]),
  street: varchar("street", { length: 255 }),
  postalCode: varchar("postal_code", { length: 20 }),
  region: varchar("region", { length: 100 }),
  birthday: date("birthday"),
  gender: varchar("gender", { length: 20 }),
  customFields: jsonb("custom_fields").$type<Array<{label: string; type: string; value: any}>>().default([]),

  // Music Profile - Multi-value fields
  genres: jsonb("genres").$type<string[]>().default([]),
  instruments: jsonb("instruments").$type<string[]>().default([]),

  // Streaming Platforms
  spotifyUrl: varchar("spotify_url", { length: 500 }),
  appleMusicUrl: varchar("apple_music_url", { length: 500 }),
  youtubeUrl: varchar("youtube_url", { length: 500 }),
  soundcloudUrl: varchar("soundcloud_url", { length: 500 }),
  bandcampUrl: varchar("bandcamp_url", { length: 500 }),
  deezerUrl: varchar("deezer_url", { length: 500 }),
  tidalUrl: varchar("tidal_url", { length: 500 }),
  amazonMusicUrl: varchar("amazon_music_url", { length: 500 }),
  audiomackUrl: varchar("audiomack_url", { length: 500 }),
  beatportUrl: varchar("beatport_url", { length: 500 }),
  otherPlatformsUrl: text("other_platforms_url"), // For custom/additional platforms

  // Industry Information
  recordLabel: varchar("record_label", { length: 255 }),
  distributor: varchar("distributor", { length: 255 }),
  managerContact: varchar("manager_contact", { length: 255 }),
  publisher: varchar("publisher", { length: 255 }),
  performanceRightsSociety: varchar("performance_rights_society", { length: 100 }), // SACEM, SOCAN, BMI, ASCAP, PRS

  // Career Information
  yearsActive: varchar("years_active", { length: 100 }), // e.g., "2015-present" or "2010-2018"
  notableWorks: text("notable_works"),
  awardsRecognition: text("awards_recognition"),
  biography: text("biography"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Client Notes table (Tenant DB)
 * Timestamped history of notes for each client
 */
export const clientNotes = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by"), // Optional FK to master.users for future multi-user
});

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

/**
 * Client Contacts table (Tenant DB)
 * Multiple contacts for company/group clients
 */
export const clientContacts = pgTable("client_contacts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  title: varchar("title", { length: 100 }), // Job title
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ClientContact = typeof clientContacts.$inferSelect;
export type InsertClientContact = typeof clientContacts.$inferInsert;

/**
 * Company Members table (Tenant DB)
 * Many-to-many relationship between company clients and individual clients
 */
export const companyMembers = pgTable("company_members", {
  id: serial("id").primaryKey(),
  companyClientId: integer("company_client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  memberClientId: integer("member_client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 255 }), // e.g., "Directeur Général", "Lead Vocalist"
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CompanyMember = typeof companyMembers.$inferSelect;
export type InsertCompanyMember = typeof companyMembers.$inferInsert;

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
 * Booking sessions with payment tracking
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"), // "scheduled" | "in_progress" | "completed" | "cancelled"

  // Payment fields
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }), // Required deposit (e.g., 30% of total)
  depositPaid: boolean("deposit_paid").notNull().default(false),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("unpaid"), // "unpaid" | "partial" | "paid" | "refunded"

  // Stripe tracking
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }), // Stripe Checkout Session ID
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }), // Stripe Payment Intent ID

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

  // Deposit & Advance Payments
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }), // Amount requested as deposit (nullable = no deposit)
  depositPaidAt: timestamp("deposit_paid_at"), // When deposit was paid
  stripeDepositPaymentIntentId: varchar("stripe_deposit_payment_intent_id", { length: 255 }), // Stripe PI for deposit
  remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }), // Calculated: total - depositAmount (or total if no deposit)

  paidAt: timestamp("paid_at"),
  notes: text("notes"),

  // PDF Storage
  pdfS3Key: text("pdf_s3_key"), // S3 key (path) for invoice PDF file
  sentAt: timestamp("sent_at"), // When invoice email was sent

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
 * Invoice Relations
 */
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  items: many(invoiceItems),
  timeEntries: many(timeEntries),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

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

  // Musical Details
  bpm: integer("bpm"),
  key: varchar("key", { length: 20 }), // Musical key (e.g., "C Major", "Am")
  lyrics: text("lyrics"),

  // Files (Original)
  fileUrl: varchar("file_url", { length: 500 }),
  waveformUrl: varchar("waveform_url", { length: 500 }),

  // ========== VERSIONING (4 champs) - Phase 5 ==========
  // Different versions of the track through production stages
  demoUrl: varchar("demo_url", { length: 500 }),
  roughMixUrl: varchar("rough_mix_url", { length: 500 }),
  finalMixUrl: varchar("final_mix_url", { length: 500 }),
  masterUrl: varchar("master_url", { length: 500 }),

  // ========== COPYRIGHT METADATA (8 champs) - Phase 5 ==========
  // Music industry metadata for distribution and rights management
  composer: varchar("composer", { length: 300 }), // Who wrote the music
  lyricist: varchar("lyricist", { length: 300 }), // Who wrote the lyrics
  copyrightHolder: varchar("copyright_holder", { length: 300 }), // Owner of rights
  copyrightYear: integer("copyright_year"),
  genreTags: text("genre_tags"), // JSON array: ["Rock", "Indie", "Alternative"]
  mood: varchar("mood", { length: 100 }), // "Energetic", "Melancholic", "Upbeat", etc.
  language: varchar("language", { length: 50 }).default("fr"), // ISO 639-1 code
  explicitContent: boolean("explicit_content").default(false),

  // ========== TECHNICAL DETAILS (5 champs) - Phase 5 ==========
  // Production technical information for studio reference
  patchPreset: text("patch_preset"), // JSON: Synth/instrument settings
  instrumentsUsed: text("instruments_used"), // JSON array: ["Fender Stratocaster", "Prophet-5"]
  microphonesUsed: text("microphones_used"), // JSON array: ["Neumann U87", "Shure SM57"]
  effectsChain: text("effects_chain"), // JSON: {pre: [...], post: [...], master: [...]}
  dawSessionPath: varchar("daw_session_path", { length: 500 }), // Path to DAW project file
  recordedInRoomId: integer("recorded_in_room_id").references(() => rooms.id), // Which studio room

  // Notes
  notes: text("notes"),
  technicalNotes: text("technical_notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

/**
 * Track Comments table (Tenant DB)
 * Timestamped comments on track versions for collaboration and feedback
 */
export const trackComments = pgTable("track_comments", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),

  // Version-specific comments (demo, rough, final, master)
  versionType: varchar("version_type", { length: 50 }).notNull(), // "demo" | "roughMix" | "finalMix" | "master"

  // Author (from Master DB users table - for now use client portal user)
  authorId: integer("author_id").notNull(), // FK to master DB users (or client_id for now)
  authorName: varchar("author_name", { length: 255 }).notNull(), // Denormalized for performance
  authorType: varchar("author_type", { length: 50 }).notNull().default("client"), // "client" | "staff" | "admin"

  // Comment content
  content: text("content").notNull(),
  timestamp: decimal("timestamp", { precision: 10, scale: 3 }).notNull(), // Time in seconds (e.g., 125.500 = 2:05.5)

  // Thread support (for replies)
  parentId: integer("parent_id").references((): any => trackComments.id, { onDelete: "cascade" }), // null = root comment

  // Status
  status: varchar("status", { length: 50 }).notNull().default("open"), // "open" | "resolved" | "archived"

  // Metadata
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  resolvedBy: integer("resolved_by"), // User ID who resolved
  resolvedAt: timestamp("resolved_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TrackComment = typeof trackComments.$inferSelect;
export type InsertTrackComment = typeof trackComments.$inferInsert;

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
 * Price quotes/estimates for clients with 7-state workflow
 * States: draft → sent → accepted/rejected/expired → converted_to_project
 */
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number", { length: 100 }).notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),

  // Status & Workflow (7-state FSM)
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  // "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled" | "converted_to_project"

  // Timestamps (for state tracking)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),          // When quote was sent to client
  respondedAt: timestamp("responded_at"), // When client accepted/rejected
  expiresAt: timestamp("expires_at"),    // Calculated expiration deadline (locked when sent)

  // Financial (mirror invoice pattern)
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("20.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  // Quote-specific fields
  validityDays: integer("validity_days").notNull().default(30), // Quote valid for N days
  terms: text("terms"), // Terms and conditions
  notes: text("notes"), // Client-visible notes
  internalNotes: text("internal_notes"), // Not visible to client

  // Conversion tracking (quote → project, NOT invoice)
  convertedToProjectId: integer("converted_to_project_id").references(() => projects.id),
  convertedAt: timestamp("converted_at"),
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

  // Service details
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1.00"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  // Optional: Link to service templates (future feature)
  serviceTemplateId: integer("service_template_id"), // Nullable - for future templates

  // Ordering
  displayOrder: integer("display_order").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

/**
 * Service Catalog table (Tenant DB)
 * Pre-defined service items for quick quote insertion
 */
export const serviceCatalog = pgTable("service_catalog", {
  id: serial("id").primaryKey(),

  // Service details
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // "Studio" | "Post-production" | "Location matériel" | "Autre"

  // Pricing
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("20.00"),

  // Defaults for quote insertion
  defaultQuantity: decimal("default_quantity", { precision: 10, scale: 2 }).notNull().default("1.00"),

  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ServiceCatalog = typeof serviceCatalog.$inferSelect;
export type InsertServiceCatalog = typeof serviceCatalog.$inferInsert;

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

/**
 * AI Conversations table (Tenant DB)
 * Stores AI chatbot conversation history
 */
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),

  // Session ID for grouping messages
  sessionId: varchar("session_id", { length: 255 }).notNull(),

  // Context
  userId: integer("user_id"), // User from master DB
  pageContext: text("page_context"), // JSON object: { url, project_id, etc. }

  // Messages
  messages: text("messages").notNull(), // JSON array of { role, content, timestamp }

  // Metadata
  totalMessages: integer("total_messages").notNull().default(0),
  actionsCalled: text("actions_called"), // JSON array of action names

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AIConversation = typeof aiConversations.$inferSelect;
export type InsertAIConversation = typeof aiConversations.$inferInsert;

/**
 * AI Action Logs table (Tenant DB)
 * Logs all AI function calls and results
 */
export const aiActionLogs = pgTable("ai_action_logs", {
  id: serial("id").primaryKey(),

  // Conversation link
  sessionId: varchar("session_id", { length: 255 }).notNull(),

  // Action details
  actionName: varchar("action_name", { length: 100 }).notNull(),
  params: text("params"), // JSON object with action parameters
  result: text("result"), // JSON object with action result

  // Status
  status: varchar("status", { length: 50 }).notNull().default("success"), // "success" | "error"
  error: text("error"), // Error message if status = "error"

  // Performance
  executionTimeMs: integer("execution_time_ms"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AIActionLog = typeof aiActionLogs.$inferSelect;
export type InsertAIActionLog = typeof aiActionLogs.$inferInsert;

/**
 * Client Portal Accounts table (Tenant DB)
 * Stores client portal authentication credentials
 */
export const clientPortalAccounts = pgTable("client_portal_accounts", {
  id: serial("id").primaryKey(),

  // Link to client
  clientId: integer("client_id").notNull().references(() => clients.id),

  // Email/Password auth
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }), // Optional - null if only using magic links

  // Security
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  lastLoginAt: timestamp("last_login_at"),
  loginCount: integer("login_count").notNull().default(0),

  // Account status
  isActive: boolean("is_active").notNull().default(true),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedAt: timestamp("locked_at"),
  lockedReason: text("locked_reason"),

  // Password reset
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ClientPortalAccount = typeof clientPortalAccounts.$inferSelect;
export type InsertClientPortalAccount = typeof clientPortalAccounts.$inferInsert;

/**
 * Client Portal Magic Links table (Tenant DB)
 * Stores magic link tokens for passwordless authentication
 */
export const clientPortalMagicLinks = pgTable("client_portal_magic_links", {
  id: serial("id").primaryKey(),

  // Link to client
  clientId: integer("client_id").notNull().references(() => clients.id),

  // Token
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),

  // Usage
  usedAt: timestamp("used_at"),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),

  // Purpose
  purpose: varchar("purpose", { length: 50 }).notNull().default("login"), // "login" | "email_verification" | "password_reset"

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ClientPortalMagicLink = typeof clientPortalMagicLinks.$inferSelect;
export type InsertClientPortalMagicLink = typeof clientPortalMagicLinks.$inferInsert;

/**
 * Client Portal Sessions table (Tenant DB)
 * Stores active client portal sessions
 */
export const clientPortalSessions = pgTable("client_portal_sessions", {
  id: serial("id").primaryKey(),

  // Link to client
  clientId: integer("client_id").notNull().references(() => clients.id),

  // Session token
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),

  // Session info
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),

  // Device info
  deviceType: varchar("device_type", { length: 50 }), // "desktop" | "mobile" | "tablet"
  deviceName: varchar("device_name", { length: 255 }),
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ClientPortalSession = typeof clientPortalSessions.$inferSelect;
export type InsertClientPortalSession = typeof clientPortalSessions.$inferInsert;

/**
 * Client Portal Activity Logs table (Tenant DB)
 * Audit log for client portal actions
 */
export const clientPortalActivityLogs = pgTable("client_portal_activity_logs", {
  id: serial("id").primaryKey(),

  // Link to client
  clientId: integer("client_id").notNull().references(() => clients.id),

  // Activity
  action: varchar("action", { length: 100 }).notNull(), // "login" | "logout" | "view_invoice" | "book_session" | "make_payment" | "download_file"
  description: text("description"),

  // Context
  resourceType: varchar("resource_type", { length: 50 }), // "invoice" | "session" | "file" | "payment"
  resourceId: integer("resource_id"),

  // Metadata
  metadata: text("metadata"), // JSON object with additional data
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  // Status
  status: varchar("status", { length: 50 }).notNull().default("success"), // "success" | "failed" | "pending"
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ClientPortalActivityLog = typeof clientPortalActivityLogs.$inferSelect;
export type InsertClientPortalActivityLog = typeof clientPortalActivityLogs.$inferInsert;

/**
 * Payment Transactions table (Tenant DB)
 * Stores all payment transactions from Stripe
 */
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),

  // Links
  clientId: integer("client_id").notNull().references(() => clients.id),
  sessionId: integer("session_id").references(() => sessions.id), // Booking session

  // Stripe IDs
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).unique(),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),

  // Payment Details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount in dollars
  currency: varchar("currency", { length: 3 }).notNull().default("usd"), // ISO currency code
  paymentType: varchar("payment_type", { length: 50 }).notNull(), // "deposit" | "balance" | "full" | "refund"

  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending" | "succeeded" | "failed" | "canceled" | "refunded"

  // Stripe Details
  stripeStatus: varchar("stripe_status", { length: 50 }), // Raw Stripe status
  paymentMethod: varchar("payment_method", { length: 50 }), // "card" | "bank_transfer" | etc.
  last4: varchar("last4", { length: 4 }), // Last 4 digits of card
  brand: varchar("brand", { length: 50 }), // "visa" | "mastercard" | etc.

  // Fees
  stripeFee: decimal("stripe_fee", { precision: 10, scale: 2 }), // Stripe fee in dollars
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }), // Amount after fees

  // Refund Info
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }), // Amount refunded
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),

  // Metadata
  metadata: text("metadata"), // JSON object with additional data
  description: text("description"),

  // Error Info
  errorCode: varchar("error_code", { length: 100 }),
  errorMessage: text("error_message"),

  // Timestamps
  paidAt: timestamp("paid_at"), // When payment succeeded
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;

/**
 * Relations
 * Define relationships between tables for Drizzle query API
 */
import { relations } from 'drizzle-orm';

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  items: many(quoteItems),
  project: one(projects, {
    fields: [quotes.convertedToProjectId],
    references: [projects.id],
  }),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}));

/**
 * Task Types table (Tenant DB)
 * Pre-defined task types for time tracking (Setup, Recording, Mixing, etc.)
 */
export const taskTypes = pgTable("task_types", {
  id: serial("id").primaryKey(),

  // Task details
  name: varchar("name", { length: 100 }).notNull(), // "Setup", "Recording", "Mixing", "Mastering", "Break"
  description: text("description"), // Detailed explanation

  // Pricing
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(), // Default rate in organization currency

  // Category
  category: varchar("category", { length: 50 }).notNull().default("billable"), // "billable" | "non-billable" (for breaks)

  // UI
  color: varchar("color", { length: 7 }), // Hex color for UI display (e.g., "#FF5733")
  sortOrder: integer("sort_order").notNull().default(0), // For UI ordering

  // Status
  isActive: boolean("is_active").notNull().default(true), // Soft delete - hide inactive types

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TaskType = typeof taskTypes.$inferSelect;
export type InsertTaskType = typeof taskTypes.$inferInsert;

/**
 * Time Entries table (Tenant DB)
 * Time tracking entries for tasks during sessions or projects
 */
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),

  // Task type reference
  taskTypeId: integer("task_type_id").notNull().references(() => taskTypes.id),

  // Flexible linking: time tracked on session, project, OR track
  sessionId: integer("session_id").references(() => sessions.id, { onDelete: "set null" }), // Links to session if time tracked during session
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }), // Links to project if time tracked on project
  trackId: integer("track_id").references(() => tracks.id, { onDelete: "set null" }), // Links to track if time tracked on specific track

  // Time tracking
  startTime: timestamp("start_time").notNull(), // When timer started
  endTime: timestamp("end_time"), // When timer stopped (null = currently running)
  durationMinutes: integer("duration_minutes"), // Calculated duration in minutes (stored for performance)

  // Pricing snapshot
  hourlyRateSnapshot: decimal("hourly_rate_snapshot", { precision: 10, scale: 2 }).notNull(), // Snapshot of task_type hourly rate at entry time

  // Manual adjustments
  manuallyAdjusted: boolean("manually_adjusted").notNull().default(false), // True if user edited start/end times after auto-tracking

  // Invoicing
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }), // Links to invoice if time has been invoiced

  // Notes
  notes: text("notes"), // Optional notes about this time entry

  // Audit
  createdBy: integer("created_by"), // FK to master.users for future multi-user tracking

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// NOTE: CHECK constraint (session_id IS NOT NULL OR project_id IS NOT NULL OR track_id IS NOT NULL) will be added manually to migration SQL

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

/**
 * Time Tracking Relations
 */
export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  taskType: one(taskTypes, {
    fields: [timeEntries.taskTypeId],
    references: [taskTypes.id],
  }),
  session: one(sessions, {
    fields: [timeEntries.sessionId],
    references: [sessions.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  track: one(tracks, {
    fields: [timeEntries.trackId],
    references: [tracks.id],
  }),
  invoice: one(invoices, {
    fields: [timeEntries.invoiceId],
    references: [invoices.id],
  }),
}));

export const taskTypesRelations = relations(taskTypes, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  client: one(clients, {
    fields: [sessions.clientId],
    references: [clients.id],
  }),
  room: one(rooms, {
    fields: [sessions.roomId],
    references: [rooms.id],
  }),
  project: one(projects, {
    fields: [sessions.projectId],
    references: [projects.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  sessions: many(sessions),
}));

/**
 * Stripe Webhook Events table (Tenant DB)
 * Tracks processed webhook events for idempotency
 */
export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 255 }).notNull().unique(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type InsertStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;

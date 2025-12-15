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
 *
 * Clients can optionally have portal access for self-service features.
 * When portalAccess is true, the client can log in using their email + password.
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
  // Portal access fields
  portalAccess: boolean("portal_access").notNull().default(false),
  passwordHash: varchar("password_hash", { length: 255 }), // For client portal login
  portalLastLogin: timestamp("portal_last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Rooms table (Tenant DB)
 */
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity"),
  isActive: boolean("is_active").notNull().default(true),
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
  // Multi-currency support
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"), // ISO 4217 currency code
  exchangeRate: decimal("exchange_rate", { precision: 12, scale: 6 }).default("1.000000"), // Exchange rate at time of creation
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
 */
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // "microphone" | "instrument" | "software" | "other"
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  condition: varchar("condition", { length: 50 }).notNull().default("good"), // "excellent" | "good" | "fair" | "poor"
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

/**
 * Projects table (Tenant DB)
 *
 * Represents a music production project (album, EP, single, etc.)
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectType: varchar("project_type", { length: 50 }).notNull().default("album"), // "album" | "ep" | "single" | "compilation" | "soundtrack" | "other"
  genre: varchar("genre", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("pre_production"), // "pre_production" | "recording" | "mixing" | "mastering" | "completed" | "on_hold" | "cancelled"
  startDate: timestamp("start_date"),
  targetEndDate: timestamp("target_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project Tracks table (Tenant DB)
 *
 * Individual songs/tracks within a project
 */
export const projectTracks = pgTable("project_tracks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  trackNumber: integer("track_number"),
  duration: integer("duration"), // Duration in seconds
  status: varchar("status", { length: 50 }).notNull().default("writing"), // "writing" | "pre_production" | "recording" | "editing" | "mixing" | "mastering" | "completed"
  bpm: integer("bpm"),
  key: varchar("key", { length: 20 }), // Musical key (e.g., "C major", "A minor")
  isrc: varchar("isrc", { length: 20 }), // International Standard Recording Code
  lyrics: text("lyrics"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProjectTrack = typeof projectTracks.$inferSelect;
export type InsertProjectTrack = typeof projectTracks.$inferInsert;

/**
 * Musicians table (Tenant DB)
 *
 * Musicians who can be credited on projects
 */
export const musicians = pgTable("musicians", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  stageName: varchar("stage_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  instruments: text("instruments"), // Comma-separated list or JSON
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Musician = typeof musicians.$inferSelect;
export type InsertMusician = typeof musicians.$inferInsert;

/**
 * Project Credits table (Tenant DB)
 *
 * Credits/contributions for musicians on tracks
 */
export const projectCredits = pgTable("project_credits", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  trackId: integer("track_id").references(() => projectTracks.id), // Optional: can be project-level or track-level
  musicianId: integer("musician_id").notNull().references(() => musicians.id),
  role: varchar("role", { length: 100 }).notNull(), // "producer" | "engineer" | "vocalist" | "guitarist" | "drummer" | "bassist" | "keyboardist" | "songwriter" | "mixer" | "mastering" | etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProjectCredit = typeof projectCredits.$inferSelect;
export type InsertProjectCredit = typeof projectCredits.$inferInsert;

/**
 * Project Files table (Tenant DB)
 *
 * Files associated with projects (audio, documents, images)
 */
export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  trackId: integer("track_id").references(() => projectTracks.id), // Optional: can be project-level or track-level
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // "audio" | "document" | "image" | "video" | "other"
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"), // Size in bytes
  storagePath: varchar("storage_path", { length: 1000 }).notNull(), // S3 path or local path
  version: integer("version").notNull().default(1),
  isLatest: boolean("is_latest").notNull().default(true),
  uploadedBy: varchar("uploaded_by", { length: 255 }), // User name or ID who uploaded
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;

/**
 * Quotes table (Tenant DB)
 *
 * Quotes/estimates that can be converted to invoices
 */
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number", { length: 100 }).notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id), // Optional link to project
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  validUntil: timestamp("valid_until").notNull(), // Quote expiration date
  status: varchar("status", { length: 50 }).notNull().default("draft"), // "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted"
  // Multi-currency support
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"), // ISO 4217 currency code
  exchangeRate: decimal("exchange_rate", { precision: 12, scale: 6 }).default("1.000000"), // Exchange rate at time of creation
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("20.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  convertedInvoiceId: integer("converted_invoice_id").references(() => invoices.id), // If converted to invoice
  notes: text("notes"),
  terms: text("terms"), // Terms & conditions
  // DocuSign integration
  docusignEnvelopeId: varchar("docusign_envelope_id", { length: 255 }),
  docusignStatus: varchar("docusign_status", { length: 50 }), // "sent" | "delivered" | "completed" | "declined" | "voided"
  signedAt: timestamp("signed_at"),
  signedByName: varchar("signed_by_name", { length: 255 }),
  signedByEmail: varchar("signed_by_email", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Quote Items table (Tenant DB)
 */
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1.00"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

/**
 * Contracts table (Tenant DB)
 *
 * Contracts for projects or sessions, with e-signature support
 */
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  contractNumber: varchar("contract_number", { length: 100 }).notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  quoteId: integer("quote_id").references(() => quotes.id),
  title: varchar("title", { length: 255 }).notNull(),
  contractType: varchar("contract_type", { length: 50 }).notNull().default("project"), // "project" | "session" | "license" | "nda" | "other"
  content: text("content").notNull(), // Full contract text (HTML/Markdown)
  status: varchar("status", { length: 50 }).notNull().default("draft"), // "draft" | "pending_signature" | "signed" | "cancelled" | "expired"
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  // DocuSign integration
  docusignEnvelopeId: varchar("docusign_envelope_id", { length: 255 }),
  docusignStatus: varchar("docusign_status", { length: 50 }),
  signedAt: timestamp("signed_at"),
  signedByName: varchar("signed_by_name", { length: 255 }),
  signedByEmail: varchar("signed_by_email", { length: 255 }),
  pdfPath: varchar("pdf_path", { length: 1000 }), // Path to generated PDF
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Exchange Rates table (Tenant DB)
 *
 * Historical exchange rates for currency conversion
 * Base currency is organization's default (usually EUR)
 */
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("EUR"), // ISO 4217
  targetCurrency: varchar("target_currency", { length: 3 }).notNull(), // ISO 4217
  rate: decimal("rate", { precision: 12, scale: 6 }).notNull(), // 1 base = X target
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validTo: timestamp("valid_to"), // null = current rate
  source: varchar("source", { length: 100 }), // "manual" | "ecb" | "xe" | etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

/**
 * Team Members table (Tenant DB)
 *
 * Staff members within an organization (engineers, producers, admins)
 */
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Optional link to Master DB user
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 50 }).notNull().default("engineer"), // "admin" | "manager" | "engineer" | "producer" | "assistant" | "intern"
  title: varchar("title", { length: 255 }), // Job title
  department: varchar("department", { length: 100 }), // "Engineering" | "Production" | "Administration" | etc.
  bio: text("bio"),
  avatarUrl: varchar("avatar_url", { length: 1000 }),
  skills: text("skills"), // JSON array or comma-separated
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  hiredAt: timestamp("hired_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Team Invitations table (Tenant DB)
 *
 * Pending invitations to join the organization
 */
export const teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("engineer"),
  invitedBy: varchar("invited_by", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending" | "accepted" | "expired" | "cancelled"
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

/**
 * File Shares table (Tenant DB)
 *
 * Shared file links for external access
 */
export const fileShares = pgTable("file_shares", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  fileId: integer("file_id").references(() => projectFiles.id),
  shareToken: varchar("share_token", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(), // Share link name/description
  accessType: varchar("access_type", { length: 50 }).notNull().default("view"), // "view" | "download" | "comment" | "edit"
  password: varchar("password", { length: 255 }), // Optional password protection (hashed)
  expiresAt: timestamp("expires_at"), // Optional expiration
  maxDownloads: integer("max_downloads"), // Optional download limit
  downloadCount: integer("download_count").notNull().default(0),
  allowedEmails: text("allowed_emails"), // JSON array of allowed emails
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type FileShare = typeof fileShares.$inferSelect;
export type InsertFileShare = typeof fileShares.$inferInsert;

/**
 * Share Access Logs table (Tenant DB)
 *
 * Track who accessed shared files
 */
export const shareAccessLogs = pgTable("share_access_logs", {
  id: serial("id").primaryKey(),
  shareId: integer("share_id").notNull().references(() => fileShares.id),
  accessedAt: timestamp("accessed_at").notNull().defaultNow(),
  accessType: varchar("access_type", { length: 50 }).notNull(), // "view" | "download"
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  email: varchar("email", { length: 255 }), // If authenticated
  country: varchar("country", { length: 100 }), // Geo-detected
});

export type ShareAccessLog = typeof shareAccessLogs.$inferSelect;
export type InsertShareAccessLog = typeof shareAccessLogs.$inferInsert;

/**
 * Bookings table (Tenant DB)
 *
 * Room booking requests from client portal
 */
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  sessionId: integer("session_id").references(() => sessions.id), // Link to session once confirmed
  requestedDate: timestamp("requested_date").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(), // "HH:MM" format
  endTime: varchar("end_time", { length: 10 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending" | "confirmed" | "rejected" | "cancelled"
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  confirmedBy: varchar("confirmed_by", { length: 255 }),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Audio Files table (Tenant DB)
 *
 * Audio files stored in S3 with metadata
 */
export const audioFiles = pgTable("audio_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  trackId: integer("track_id").references(() => projectTracks.id),
  sessionId: integer("session_id").references(() => sessions.id),

  // File identification
  filename: varchar("filename", { length: 500 }).notNull(),
  originalFilename: varchar("original_filename", { length: 500 }).notNull(),
  path: varchar("path", { length: 1000 }).notNull().default(""), // Storage path (S3 or local)

  // Format & metadata
  format: varchar("format", { length: 20 }).notNull().default("wav"), // wav, mp3, flac, etc.
  category: varchar("category", { length: 50 }), // recording, mix, master, stem, etc.
  sizeBytes: varchar("size_bytes", { length: 50 }), // File size in bytes
  durationMs: integer("duration_ms"), // Duration in milliseconds
  sampleRate: integer("sample_rate"), // Hz (44100, 48000, 96000, etc.)
  bitDepth: integer("bit_depth"), // 16, 24, 32 bits
  channels: integer("channels"), // 1 = mono, 2 = stereo

  // Waveform visualization
  waveformData: text("waveform_data"), // Base64 or URL to waveform image
  waveformPeaks: text("waveform_peaks"), // JSON array of peak values

  // Version control
  version: integer("version").notNull().default(1),

  // Status & notes
  status: varchar("status", { length: 20 }).notNull().default("ready"), // uploading, processing, ready, error, archived
  notes: text("notes"),
  metadata: text("metadata"), // Additional JSON metadata

  // Transcription (AI-generated)
  transcription: text("transcription"),

  // Tags & categorization
  tags: text("tags"), // JSON array

  // Access control
  uploadedBy: integer("uploaded_by"),
  isPublic: boolean("is_public").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AudioFile = typeof audioFiles.$inferSelect;
export type InsertAudioFile = typeof audioFiles.$inferInsert;

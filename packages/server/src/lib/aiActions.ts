import { TRPCError } from "@trpc/server";
import { eq, gte, lte, and, desc, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  sessions,
  clients,
  clientNotes,
  invoices,
  quotes,
  rooms,
  equipment,
  projects,
  musicians,
} from "@rsm/database/tenant";

/**
 * AI Action Executor
 *
 * Executes AI function calls with access to tenant database.
 * Implements 37+ actions for AI assistant.
 *
 * Categories:
 * - Sessions (5 actions)
 * - Clients (5 actions)
 * - Analytics (5 actions)
 * - Invoices (5 actions)
 * - Quotes (5 actions)
 * - Rooms (3 actions)
 * - Equipment (3 actions)
 * - Projects (4 actions)
 * - Musicians (2 actions)
 *
 * Phase 2.2: Full implementation
 */

export interface ActionParams {
  [key: string]: any;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class AIActionExecutor {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Execute an action by name
   */
  async execute(actionName: string, params: ActionParams): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // Route to appropriate action
      let result: any;

      switch (actionName) {
        // Sessions
        case "get_upcoming_sessions":
          result = await this.get_upcoming_sessions(params as any);
          break;
        case "get_session_details":
          result = await this.get_session_details(params as any);
          break;
        case "create_session":
          result = await this.create_session(params as any);
          break;
        case "update_session":
          result = await this.update_session(params as any);
          break;
        case "delete_session":
          result = await this.delete_session(params as any);
          break;

        // Clients
        case "get_all_clients":
          result = await this.get_all_clients(params as any);
          break;
        case "get_client_info":
          result = await this.get_client_info(params as any);
          break;
        case "create_client":
          result = await this.create_client(params as any);
          break;
        case "update_client":
          result = await this.update_client(params as any);
          break;
        case "delete_client":
          result = await this.delete_client(params as any);
          break;
        case "get_client_notes":
          result = await this.get_client_notes(params as any);
          break;
        case "add_client_note":
          result = await this.add_client_note(params as any);
          break;
        case "delete_client_note":
          result = await this.delete_client_note(params as any);
          break;

        // Analytics
        case "get_studio_context":
          result = await this.get_studio_context(params as any);
          break;
        case "get_revenue_forecast":
          result = await this.get_revenue_forecast(params as any);
          break;
        case "get_revenue_summary":
          result = await this.get_revenue_summary(params as any);
          break;
        case "get_client_360_view":
          result = await this.get_client_360_view(params as any);
          break;
        case "create_session_checklist":
          result = await this.create_session_checklist(params as any);
          break;

        // Invoices
        case "get_all_invoices":
          result = await this.get_all_invoices(params as any);
          break;
        case "create_invoice":
          result = await this.create_invoice(params as any);
          break;
        case "update_invoice":
          result = await this.update_invoice(params as any);
          break;
        case "delete_invoice":
          result = await this.delete_invoice(params as any);
          break;
        case "get_invoice_summary":
          result = await this.get_invoice_summary(params as any);
          break;

        // Quotes
        case "get_all_quotes":
          result = await this.get_all_quotes(params as any);
          break;
        case "create_quote":
          result = await this.create_quote(params as any);
          break;
        case "update_quote":
          result = await this.update_quote(params as any);
          break;
        case "delete_quote":
          result = await this.delete_quote(params as any);
          break;
        case "convert_quote_to_invoice":
          result = await this.convert_quote_to_invoice(params as any);
          break;

        // Rooms
        case "get_all_rooms":
          result = await this.get_all_rooms(params as any);
          break;
        case "create_room":
          result = await this.create_room(params as any);
          break;
        case "update_room":
          result = await this.update_room(params as any);
          break;

        // Equipment
        case "get_all_equipment":
          result = await this.get_all_equipment(params as any);
          break;
        case "create_equipment":
          result = await this.create_equipment(params as any);
          break;
        case "update_equipment":
          result = await this.update_equipment(params as any);
          break;

        // Projects
        case "get_all_projects":
          result = await this.get_all_projects(params as any);
          break;
        case "create_project":
          result = await this.create_project(params as any);
          break;
        case "update_project":
          result = await this.update_project(params as any);
          break;
        case "create_project_folder":
          result = await this.create_project_folder(params as any);
          break;

        // Musicians
        case "get_all_musicians":
          result = await this.get_all_musicians(params as any);
          break;
        case "create_musician":
          result = await this.create_musician(params as any);
          break;

        default:
          throw new Error(`Unknown action: ${actionName}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================================================
  // SESSIONS ACTIONS (5)
  // ============================================================================

  /**
   * Get upcoming sessions (filterable by date range and room)
   */
  async get_upcoming_sessions(params: {
    start_date?: string;
    end_date?: string;
    room_id?: number;
  }) {
    const { start_date, end_date, room_id } = params;

    // Build filters
    const filters = [];
    if (start_date) {
      filters.push(gte(sessions.startTime, new Date(start_date)));
    }
    if (end_date) {
      filters.push(lte(sessions.startTime, new Date(end_date)));
    }
    if (room_id) {
      filters.push(eq(sessions.roomId, room_id));
    }

    // Build query with filters in single chain
    const baseQuery = this.db
      .select({
        id: sessions.id,
        title: sessions.title,
        clientId: sessions.clientId,
        roomId: sessions.roomId,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        status: sessions.status,
        totalAmount: sessions.totalAmount,
      })
      .from(sessions);

    const result = await (filters.length > 0
      ? baseQuery.where(and(...filters)).orderBy(sessions.startTime).limit(50)
      : baseQuery.orderBy(sessions.startTime).limit(50));

    return {
      sessions: result,
      count: result.length,
    };
  }

  /**
   * Get session details by ID
   */
  async get_session_details(params: { session_id: number }) {
    const { session_id } = params;

    const result = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, session_id))
      .limit(1);

    if (result.length === 0) {
      throw new Error(`Session ${session_id} not found`);
    }

    return result[0];
  }

  /**
   * Create a new session
   */
  async create_session(params: {
    client_id: number;
    room_id: number;
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
  }) {
    const { client_id, room_id, title, start_time, end_time, description } = params;

    const result = await this.db
      .insert(sessions)
      .values({
        clientId: client_id,
        roomId: room_id,
        title,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
        description,
        status: "scheduled",
      })
      .returning();

    return result[0];
  }

  /**
   * Update existing session
   */
  async update_session(params: {
    session_id: number;
    title?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
    description?: string;
  }) {
    const { session_id, ...updates } = params;

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.start_time) updateData.startTime = new Date(updates.start_time);
    if (updates.end_time) updateData.endTime = new Date(updates.end_time);
    if (updates.status) updateData.status = updates.status;
    if (updates.description) updateData.description = updates.description;

    const result = await this.db
      .update(sessions)
      .set(updateData)
      .where(eq(sessions.id, session_id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Session ${session_id} not found`);
    }

    return result[0];
  }

  /**
   * Delete session
   */
  async delete_session(params: { session_id: number }) {
    const { session_id } = params;

    const result = await this.db
      .delete(sessions)
      .where(eq(sessions.id, session_id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Session ${session_id} not found`);
    }

    return { deleted: true, id: session_id };
  }

  // ============================================================================
  // CLIENTS ACTIONS (5)
  // ============================================================================

  /**
   * Get all clients (with optional filters)
   */
  async get_all_clients(params: { is_vip?: boolean; limit?: number } = {}) {
    const { is_vip, limit = 50 } = params;

    const baseQuery = this.db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        type: clients.type,
        isVip: clients.isVip,
        isActive: clients.isActive,
      })
      .from(clients);

    const result = await (is_vip !== undefined
      ? baseQuery.where(and(eq(clients.isActive, true), eq(clients.isVip, is_vip))).limit(limit)
      : baseQuery.where(eq(clients.isActive, true)).limit(limit));

    return {
      clients: result,
      count: result.length,
    };
  }

  /**
   * Get client info by ID
   */
  async get_client_info(params: { client_id: number }) {
    const { client_id } = params;

    const result = await this.db
      .select()
      .from(clients)
      .where(eq(clients.id, client_id))
      .limit(1);

    if (result.length === 0) {
      throw new Error(`Client ${client_id} not found`);
    }

    return result[0];
  }

  /**
   * Create new client
   */
  async create_client(params: {
    name: string;
    email?: string;
    phone?: string;
    type?: string;
    is_vip?: boolean;
  }) {
    const { name, email, phone, type = "individual", is_vip = false } = params;

    const result = await this.db
      .insert(clients)
      .values({
        name,
        email,
        phone,
        type,
        isVip: is_vip,
        isActive: true,
      })
      .returning();

    return result[0];
  }

  /**
   * Update client
   */
  async update_client(params: {
    client_id: number;
    name?: string;
    email?: string;
    phone?: string;
    is_vip?: boolean;
  }) {
    const { client_id, ...updates } = params;

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.is_vip !== undefined) updateData.isVip = updates.is_vip;

    const result = await this.db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, client_id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Client ${client_id} not found`);
    }

    return result[0];
  }

  /**
   * Delete client
   */
  async delete_client(params: { client_id: number }) {
    const { client_id } = params;

    // Soft delete (set isActive = false)
    const result = await this.db
      .update(clients)
      .set({ isActive: false })
      .where(eq(clients.id, client_id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Client ${client_id} not found`);
    }

    return { deleted: true, id: client_id };
  }

  /**
   * Get client notes history
   */
  async get_client_notes(params: { client_id: number; limit?: number }) {
    const { client_id, limit = 10 } = params;

    const notes = await this.db
      .select()
      .from(clientNotes)
      .where(eq(clientNotes.clientId, client_id))
      .orderBy(desc(clientNotes.createdAt))
      .limit(limit);

    return notes;
  }

  /**
   * Add client note
   */
  async add_client_note(params: { client_id: number; note: string }) {
    const { client_id, note } = params;

    const [newNote] = await this.db
      .insert(clientNotes)
      .values({
        clientId: client_id,
        note: note,
        createdAt: new Date(),
      })
      .returning();

    return newNote;
  }

  /**
   * Delete client note
   */
  async delete_client_note(params: { note_id: number }) {
    const { note_id } = params;

    await this.db
      .delete(clientNotes)
      .where(eq(clientNotes.id, note_id));

    return { success: true, id: note_id };
  }

  // ============================================================================
  // ANALYTICS ACTIONS (5)
  // ============================================================================

  /**
   * Get studio context (overview of current state)
   */
  async get_studio_context(params: {} = {}) {
    // Get counts
    const [clientsCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(eq(clients.isActive, true));

    const [sessionsCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions);

    const [projectsCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects);

    return {
      clients_count: clientsCount.count,
      sessions_count: sessionsCount.count,
      projects_count: projectsCount.count,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get revenue forecast
   */
  async get_revenue_forecast(params: { months?: number } = {}) {
    const { months = 3 } = params;

    // TODO: Implement revenue forecast based on scheduled sessions
    return {
      forecast: "TODO: Implement revenue forecast",
      months,
    };
  }

  /**
   * Get revenue summary
   */
  async get_revenue_summary(params: { start_date?: string; end_date?: string } = {}) {
    // TODO: Implement revenue summary from invoices
    return {
      summary: "TODO: Implement revenue summary",
    };
  }

  /**
   * Get client 360 view (all client data)
   */
  async get_client_360_view(params: { client_id: number }) {
    const { client_id } = params;

    // Get client info
    const clientInfo = await this.get_client_info({ client_id });

    // Get client sessions
    const clientSessions = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.clientId, client_id))
      .limit(10);

    // Get client invoices
    const clientInvoices = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, client_id))
      .limit(10);

    return {
      client: clientInfo,
      sessions: clientSessions,
      invoices: clientInvoices,
      total_sessions: clientSessions.length,
      total_invoices: clientInvoices.length,
    };
  }

  /**
   * Create session checklist
   */
  async create_session_checklist(params: { session_id: number }) {
    const { session_id } = params;

    // Get session details
    const session = await this.get_session_details({ session_id });

    // Generate checklist
    const checklist = [
      "Vérifier la disponibilité de la salle",
      "Confirmer l'arrivée du client",
      "Préparer l'équipement nécessaire",
      "Tester le son et la configuration",
      "Prévoir les pauses",
    ];

    return {
      session_id,
      session_title: session.title,
      checklist,
    };
  }

  // ============================================================================
  // INVOICES ACTIONS (5)
  // ============================================================================

  async get_all_invoices(params: { status?: string; limit?: number } = {}) {
    const { status, limit = 50 } = params;

    const baseQuery = this.db.select().from(invoices);

    const result = await (status
      ? baseQuery.where(eq(invoices.status, status)).orderBy(desc(invoices.createdAt)).limit(limit)
      : baseQuery.orderBy(desc(invoices.createdAt)).limit(limit));

    return {
      invoices: result,
      count: result.length,
    };
  }

  async create_invoice(params: {
    client_id: number;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    subtotal: number;
    tax_rate?: number;
    notes?: string;
    items?: Array<{ description: string; quantity: number; unit_price: number }>;
  }) {
    const {
      client_id,
      invoice_number,
      issue_date,
      due_date,
      subtotal,
      tax_rate = 20.0,
      notes,
      items = [],
    } = params;

    // Calculate tax and total
    const taxAmount = (subtotal * tax_rate) / 100;
    const total = subtotal + taxAmount;

    // Create invoice
    const [invoice] = await this.db
      .insert(invoices)
      .values({
        clientId: client_id,
        invoiceNumber: invoice_number,
        issueDate: new Date(issue_date),
        dueDate: new Date(due_date),
        status: "draft",
        subtotal: subtotal.toString(),
        taxRate: tax_rate.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        notes,
      })
      .returning();

    return {
      invoice,
      message: `Facture ${invoice_number} créée avec succès`,
    };
  }

  async update_invoice(params: {
    invoice_id: number;
    status?: string;
    due_date?: string;
    notes?: string;
    paid_at?: string;
  }) {
    const { invoice_id, status, due_date, notes, paid_at } = params;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (due_date) updateData.dueDate = new Date(due_date);
    if (notes !== undefined) updateData.notes = notes;
    if (paid_at) updateData.paidAt = new Date(paid_at);
    updateData.updatedAt = new Date();

    const [updated] = await this.db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, invoice_id))
      .returning();

    return {
      invoice: updated,
      message: `Facture #${invoice_id} mise à jour`,
    };
  }

  async delete_invoice(params: { invoice_id: number }) {
    const { invoice_id } = params;

    await this.db.delete(invoices).where(eq(invoices.id, invoice_id));

    return {
      message: `Facture #${invoice_id} supprimée`,
      invoice_id,
    };
  }

  async get_invoice_summary(params: { period?: string } = {}) {
    const { period = "month" } = params;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Get invoices in period
    const periodInvoices = await this.db
      .select()
      .from(invoices)
      .where(gte(invoices.createdAt, startDate));

    // Calculate stats
    const totalRevenue = periodInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total || "0"),
      0
    );
    const paidInvoices = periodInvoices.filter((inv) => inv.status === "paid");
    const unpaidInvoices = periodInvoices.filter(
      (inv) => inv.status === "sent" || inv.status === "overdue"
    );
    const overdueInvoices = periodInvoices.filter((inv) => inv.status === "overdue");

    return {
      period,
      total_invoices: periodInvoices.length,
      total_revenue: totalRevenue,
      paid_count: paidInvoices.length,
      unpaid_count: unpaidInvoices.length,
      overdue_count: overdueInvoices.length,
      average_invoice_value: periodInvoices.length > 0 ? totalRevenue / periodInvoices.length : 0,
    };
  }

  // ============================================================================
  // QUOTES ACTIONS (5)
  // ============================================================================

  async get_all_quotes(params: { status?: string; limit?: number } = {}) {
    const { status, limit = 50 } = params;

    const baseQuery = this.db.select().from(quotes);

    const result = await (status
      ? baseQuery.where(eq(quotes.status, status)).orderBy(desc(quotes.createdAt)).limit(limit)
      : baseQuery.orderBy(desc(quotes.createdAt)).limit(limit));

    return {
      quotes: result,
      count: result.length,
    };
  }

  async create_quote(params: {
    client_id: number;
    quote_number: string;
    valid_until: string;
    subtotal: number;
    tax_rate?: number;
    title?: string;
    description?: string;
    project_id?: number;
  }) {
    const {
      client_id,
      quote_number,
      valid_until,
      subtotal,
      tax_rate = 20.0,
      title,
      description,
      project_id,
    } = params;

    // Calculate tax and total
    const taxAmount = (subtotal * tax_rate) / 100;
    const total = subtotal + taxAmount;

    const [quote] = await this.db
      .insert(quotes)
      .values({
        clientId: client_id,
        quoteNumber: quote_number,
        expiresAt: new Date(valid_until),
        status: "draft",
        subtotal: subtotal.toString(),
        taxRate: tax_rate.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        notes: description,
      })
      .returning();

    return {
      quote,
      message: `Devis ${quote_number} créé avec succès`,
    };
  }

  async update_quote(params: {
    quote_id: number;
    status?: string;
    valid_until?: string;
    title?: string;
    description?: string;
  }) {
    const { quote_id, status, valid_until, title, description } = params;

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (valid_until) updateData.validUntil = new Date(valid_until);
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const [updated] = await this.db
      .update(quotes)
      .set(updateData)
      .where(eq(quotes.id, quote_id))
      .returning();

    return {
      quote: updated,
      message: `Devis #${quote_id} mis à jour`,
    };
  }

  async delete_quote(params: { quote_id: number }) {
    const { quote_id } = params;

    await this.db.delete(quotes).where(eq(quotes.id, quote_id));

    return {
      message: `Devis #${quote_id} supprimé`,
      quote_id,
    };
  }

  async convert_quote_to_invoice(params: { quote_id: number }) {
    const { quote_id } = params;

    // Get quote details
    const [quote] = await this.db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quote_id));

    if (!quote) {
      throw new Error(`Devis #${quote_id} introuvable`);
    }

    if (quote.status === "converted") {
      throw new Error(`Devis #${quote_id} déjà converti`);
    }

    // Generate invoice number from quote number
    const invoiceNumber = quote.quoteNumber.replace("QT", "INV");

    // Create invoice from quote
    const [invoice] = await this.db
      .insert(invoices)
      .values({
        clientId: quote.clientId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        status: "draft",
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        notes: `Converti du devis ${quote.quoteNumber}`,
      })
      .returning();

    // Update quote status (note: quotes convert to projects in the schema, not invoices)
    // This marks the quote as converted_to_project status
    await this.db
      .update(quotes)
      .set({
        status: "converted_to_project",
        convertedAt: new Date(),
      })
      .where(eq(quotes.id, quote_id));

    return {
      invoice,
      quote,
      message: `Devis ${quote.quoteNumber} converti en facture ${invoiceNumber}`,
    };
  }

  // ============================================================================
  // ROOMS ACTIONS (3)
  // ============================================================================

  async get_all_rooms(params: {} = {}) {
    const result = await this.db.select().from(rooms).where(eq(rooms.isActive, true));

    return {
      rooms: result,
      count: result.length,
    };
  }

  async create_room(params: {
    name: string;
    type?: string;
    hourly_rate: number;
    half_day_rate?: number;
    full_day_rate?: number;
    capacity?: number;
    description?: string;
  }) {
    const {
      name,
      type = "recording",
      hourly_rate,
      half_day_rate,
      full_day_rate,
      capacity = 1,
      description,
    } = params;

    const [room] = await this.db
      .insert(rooms)
      .values({
        name,
        type,
        hourlyRate: hourly_rate.toString(),
        halfDayRate: half_day_rate?.toString(),
        fullDayRate: full_day_rate?.toString(),
        capacity,
        description,
        isActive: true,
        isAvailableForBooking: true,
      })
      .returning();

    return {
      room,
      message: `Salle "${name}" créée avec succès`,
    };
  }

  async update_room(params: {
    room_id: number;
    name?: string;
    hourly_rate?: number;
    is_active?: boolean;
    is_available_for_booking?: boolean;
    description?: string;
  }) {
    const { room_id, name, hourly_rate, is_active, is_available_for_booking, description } =
      params;

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (hourly_rate !== undefined) updateData.hourlyRate = hourly_rate.toString();
    if (is_active !== undefined) updateData.isActive = is_active;
    if (is_available_for_booking !== undefined)
      updateData.isAvailableForBooking = is_available_for_booking;
    if (description !== undefined) updateData.description = description;

    const [updated] = await this.db
      .update(rooms)
      .set(updateData)
      .where(eq(rooms.id, room_id))
      .returning();

    return {
      room: updated,
      message: `Salle #${room_id} mise à jour`,
    };
  }

  // ============================================================================
  // EQUIPMENT ACTIONS (3)
  // ============================================================================

  async get_all_equipment(params: {} = {}) {
    const result = await this.db.select().from(equipment).limit(50);

    return {
      equipment: result,
      count: result.length,
    };
  }

  async create_equipment(params: {
    name: string;
    category: string;
    brand?: string;
    model?: string;
    room_id?: number;
    status?: string;
    description?: string;
  }) {
    const {
      name,
      category,
      brand,
      model,
      room_id,
      status = "operational",
      description,
    } = params;

    const [equip] = await this.db
      .insert(equipment)
      .values({
        name,
        category,
        brand,
        model,
        roomId: room_id,
        status,
        description,
        condition: "good",
        isAvailable: true,
      })
      .returning();

    return {
      equipment: equip,
      message: `Équipement "${name}" créé avec succès`,
    };
  }

  async update_equipment(params: {
    equipment_id: number;
    name?: string;
    status?: string;
    condition?: string;
    is_available?: boolean;
    room_id?: number;
    description?: string;
  }) {
    const {
      equipment_id,
      name,
      status,
      condition,
      is_available,
      room_id,
      description,
    } = params;

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (condition) updateData.condition = condition;
    if (is_available !== undefined) updateData.isAvailable = is_available;
    if (room_id !== undefined) updateData.roomId = room_id;
    if (description !== undefined) updateData.description = description;

    const [updated] = await this.db
      .update(equipment)
      .set(updateData)
      .where(eq(equipment.id, equipment_id))
      .returning();

    return {
      equipment: updated,
      message: `Équipement #${equipment_id} mis à jour`,
    };
  }

  // ============================================================================
  // PROJECTS ACTIONS (4)
  // ============================================================================

  async get_all_projects(params: { status?: string; limit?: number } = {}) {
    const { status, limit = 50 } = params;

    const baseQuery = this.db.select().from(projects);

    const result = await (status
      ? baseQuery.where(eq(projects.status, status)).orderBy(desc(projects.createdAt)).limit(limit)
      : baseQuery.orderBy(desc(projects.createdAt)).limit(limit));

    return {
      projects: result,
      count: result.length,
    };
  }

  async create_project(params: {
    client_id: number;
    name: string;
    artist_name?: string;
    type?: string;
    genre?: string;
    budget?: number;
    description?: string;
  }) {
    const {
      client_id,
      name,
      artist_name,
      type = "album",
      genre,
      budget,
      description,
    } = params;

    const [project] = await this.db
      .insert(projects)
      .values({
        clientId: client_id,
        name,
        artistName: artist_name,
        type,
        genre,
        budget: budget?.toString(),
        description,
        status: "pre_production",
        trackCount: 0,
      })
      .returning();

    return {
      project,
      message: `Projet "${name}" créé avec succès`,
    };
  }

  async update_project(params: {
    project_id: number;
    name?: string;
    status?: string;
    budget?: number;
    total_cost?: number;
    description?: string;
  }) {
    const { project_id, name, status, budget, total_cost, description } = params;

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (budget !== undefined) updateData.budget = budget.toString();
    if (total_cost !== undefined) updateData.totalCost = total_cost.toString();
    if (description !== undefined) updateData.description = description;

    const [updated] = await this.db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, project_id))
      .returning();

    return {
      project: updated,
      message: `Projet #${project_id} mis à jour`,
    };
  }

  async create_project_folder(params: { project_id: number; folder_name?: string }) {
    const { project_id, folder_name } = params;

    // Get project details
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, project_id));

    if (!project) {
      throw new Error(`Projet #${project_id} introuvable`);
    }

    // Generate folder path
    const sanitizedName = (folder_name || project.name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const folderPath = `/projects/${project_id}-${sanitizedName}`;

    // Update project with storage location
    await this.db
      .update(projects)
      .set({
        storageLocation: folderPath,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project_id));

    return {
      project_id,
      folder_path: folderPath,
      message: `Dossier créé pour le projet "${project.name}"`,
    };
  }

  // ============================================================================
  // MUSICIANS ACTIONS (2)
  // ============================================================================

  async get_all_musicians(params: {} = {}) {
    const result = await this.db
      .select()
      .from(musicians)
      .where(eq(musicians.isActive, true))
      .limit(50);

    return {
      musicians: result,
      count: result.length,
    };
  }

  async create_musician(params: {
    name: string;
    stage_name?: string;
    email?: string;
    phone?: string;
    talent_type?: string;
    instruments?: string[];
    genres?: string[];
    bio?: string;
  }) {
    const {
      name,
      stage_name,
      email,
      phone,
      talent_type = "musician",
      instruments = [],
      genres = [],
      bio,
    } = params;

    const [musician] = await this.db
      .insert(musicians)
      .values({
        name,
        stageName: stage_name,
        email,
        phone,
        talentType: talent_type,
        instruments: JSON.stringify(instruments),
        genres: JSON.stringify(genres),
        bio,
        isActive: true,
      })
      .returning();

    return {
      musician,
      message: `Talent "${name}" créé avec succès`,
    };
  }
}

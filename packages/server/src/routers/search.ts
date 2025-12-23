import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "../db";
import { clients, sessions, invoices, equipment, musicians } from "@database/schema";
import { or, ilike, sql, and, eq } from "drizzle-orm";

export const searchRouter = router({
  /**
   * Global search across all entities
   * Returns results from clients, sessions, invoices, equipment, and musicians
   */
  global: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2, "Query must be at least 2 characters"),
        limit: z.number().min(1).max(50).default(20),
        types: z
          .array(z.enum(["client", "session", "invoice", "equipment", "musician"]))
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, limit, types } = input;
      const searchTerm = `%${query}%`;
      const organizationId = ctx.user.organizationId;

      const results: Array<{
        id: number;
        type: "client" | "session" | "invoice" | "equipment" | "musician";
        title: string;
        subtitle: string;
        description?: string;
        url: string;
        score: number;
      }> = [];

      // Search clients (if enabled or no filter)
      if (!types || types.includes("client")) {
        const clientResults = await db
          .select({
            id: clients.id,
            firstName: clients.firstName,
            lastName: clients.lastName,
            email: clients.email,
            phone: clients.phone,
          })
          .from(clients)
          .where(
            and(
              eq(clients.organizationId, organizationId),
              or(
                ilike(clients.firstName, searchTerm),
                ilike(clients.lastName, searchTerm),
                ilike(clients.email, searchTerm),
                ilike(clients.phone, searchTerm)
              )
            )
          )
          .limit(limit);

        results.push(
          ...clientResults.map((client) => ({
            id: client.id,
            type: "client" as const,
            title: `${client.firstName} ${client.lastName}`,
            subtitle: client.email || "",
            description: client.phone || undefined,
            url: `/clients/${client.id}`,
            score: 1.0, // Base score, can be improved with ranking algorithm
          }))
        );
      }

      // Search sessions (if enabled or no filter)
      if (!types || types.includes("session")) {
        const sessionResults = await db
          .select({
            id: sessions.id,
            title: sessions.title,
            scheduledDate: sessions.scheduledDate,
            clientId: clients.id,
            clientName: sql<string>`${clients.firstName} || ' ' || ${clients.lastName}`,
          })
          .from(sessions)
          .leftJoin(clients, eq(sessions.clientId, clients.id))
          .where(
            and(
              eq(sessions.organizationId, organizationId),
              or(
                ilike(sessions.title, searchTerm),
                ilike(clients.firstName, searchTerm),
                ilike(clients.lastName, searchTerm)
              )
            )
          )
          .limit(limit);

        results.push(
          ...sessionResults.map((session) => ({
            id: session.id,
            type: "session" as const,
            title: session.title || "Session sans titre",
            subtitle: session.clientName || "Client inconnu",
            description: session.scheduledDate
              ? new Date(session.scheduledDate).toLocaleDateString("fr-FR")
              : undefined,
            url: `/sessions/${session.id}`,
            score: 0.9,
          }))
        );
      }

      // Search invoices (if enabled or no filter)
      if (!types || types.includes("invoice")) {
        const invoiceResults = await db
          .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            clientId: clients.id,
            clientName: sql<string>`${clients.firstName} || ' ' || ${clients.lastName}`,
            totalAmount: invoices.totalAmount,
            status: invoices.status,
          })
          .from(invoices)
          .leftJoin(clients, eq(invoices.clientId, clients.id))
          .where(
            and(
              eq(invoices.organizationId, organizationId),
              or(
                ilike(invoices.invoiceNumber, searchTerm),
                ilike(clients.firstName, searchTerm),
                ilike(clients.lastName, searchTerm)
              )
            )
          )
          .limit(limit);

        results.push(
          ...invoiceResults.map((invoice) => ({
            id: invoice.id,
            type: "invoice" as const,
            title: invoice.invoiceNumber || `Facture #${invoice.id}`,
            subtitle: invoice.clientName || "Client inconnu",
            description: `${((invoice.totalAmount || 0) / 100).toFixed(2)}€ - ${
              invoice.status || "pending"
            }`,
            url: `/invoices/${invoice.id}`,
            score: 0.85,
          }))
        );
      }

      // Search equipment (if enabled or no filter)
      if (!types || types.includes("equipment")) {
        const equipmentResults = await db
          .select({
            id: equipment.id,
            name: equipment.name,
            category: equipment.category,
            manufacturer: equipment.manufacturer,
            status: equipment.status,
          })
          .from(equipment)
          .where(
            and(
              eq(equipment.organizationId, organizationId),
              or(
                ilike(equipment.name, searchTerm),
                ilike(equipment.manufacturer, searchTerm),
                ilike(equipment.category, searchTerm)
              )
            )
          )
          .limit(limit);

        results.push(
          ...equipmentResults.map((eq) => ({
            id: eq.id,
            type: "equipment" as const,
            title: eq.name || "Équipement sans nom",
            subtitle: eq.manufacturer || eq.category || "",
            description: eq.status || undefined,
            url: `/equipment/${eq.id}`,
            score: 0.7,
          }))
        );
      }

      // Search musicians/talents (if enabled or no filter)
      if (!types || types.includes("musician")) {
        const musicianResults = await db
          .select({
            id: musicians.id,
            firstName: musicians.firstName,
            lastName: musicians.lastName,
            specialty: musicians.specialty,
          })
          .from(musicians)
          .where(
            and(
              eq(musicians.organizationId, organizationId),
              or(
                ilike(musicians.firstName, searchTerm),
                ilike(musicians.lastName, searchTerm),
                ilike(musicians.specialty, searchTerm)
              )
            )
          )
          .limit(limit);

        results.push(
          ...musicianResults.map((musician) => ({
            id: musician.id,
            type: "musician" as const,
            title: `${musician.firstName} ${musician.lastName}`,
            subtitle: musician.specialty || "Musicien",
            url: `/talents/${musician.id}`,
            score: 0.8,
          }))
        );
      }

      // Sort by score (desc) and limit total results
      return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }),
});

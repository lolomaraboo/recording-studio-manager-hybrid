import { router } from '../_core/trpc';
import { authRouter } from './auth';
import { organizationsRouter } from './organizations';
import { sessionsRouter } from './sessions';
import { clientsRouter } from './clients';
import { invoicesRouter } from './invoices';

/**
 * Main App Router
 *
 * Combines all sub-routers:
 * - auth: Authentication (login, logout, me)
 * - organizations: Organization CRUD (Master DB)
 * - sessions: Recording sessions CRUD (Tenant DB)
 * - clients: Clients CRUD (Tenant DB)
 * - invoices: Invoices CRUD (Tenant DB)
 *
 * Future routers to add (from Manus):
 * - rooms, equipment, projects, analytics, reports, admin,
 * - stripe, files, shares, bookings, ai, calendar,
 * - notifications, musicians, clientAuth, clientPortal,
 * - sidebar, quotes
 */
export const appRouter = router({
  auth: authRouter,
  organizations: organizationsRouter,
  sessions: sessionsRouter,
  clients: clientsRouter,
  invoices: invoicesRouter,
});

/**
 * Export type for use in client
 */
export type AppRouter = typeof appRouter;

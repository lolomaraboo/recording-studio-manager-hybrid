import { router } from '../_core/trpc';
import { authRouter } from './auth';
import { organizationsRouter } from './organizations';
import { sessionsRouter } from './sessions';
import { clientsRouter } from './clients';
import { invoicesRouter } from './invoices';
import { roomsRouter } from './rooms';
import { equipmentRouter } from './equipment';
import { projectsRouter } from './projects';
import { quotesRouter } from './quotes';
import { contractsRouter } from './contracts';
import { expensesRouter } from './expenses';
import { notificationsRouter } from './notifications';

/**
 * Main App Router
 *
 * Combines all sub-routers:
 *
 * **Master DB:**
 * - auth: Authentication (login, logout, me)
 * - organizations: Organization CRUD
 *
 * **Tenant DB:**
 * - clients: Clients CRUD
 * - sessions: Recording sessions CRUD
 * - rooms: Studio rooms/spaces CRUD
 * - equipment: Equipment & gear CRUD
 * - projects: Projects, tracks, musicians CRUD
 * - invoices: Invoices & invoice items CRUD
 * - quotes: Quotes & quote items CRUD
 * - contracts: Legal contracts CRUD
 * - expenses: Business expenses CRUD
 *
 * **Future routers to add:**
 * - payments, analytics, reports, admin, stripe, files,
 * - notifications, clientAuth, clientPortal, calendar
 */
export const appRouter = router({
  auth: authRouter,
  organizations: organizationsRouter,
  sessions: sessionsRouter,
  clients: clientsRouter,
  invoices: invoicesRouter,
  rooms: roomsRouter,
  equipment: equipmentRouter,
  projects: projectsRouter,
  quotes: quotesRouter,
  contracts: contractsRouter,
  expenses: expensesRouter,
  notifications: notificationsRouter,
});

/**
 * Export type for use in client
 */
export type AppRouter = typeof appRouter;

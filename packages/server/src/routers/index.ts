import { router } from '../_core/trpc';
import { authRouter } from './auth';
import { organizationsRouter } from './organizations';
import { sessionsRouter } from './sessions';
import { clientsRouter } from './clients';
import { invoicesRouter } from './invoices';
import { roomsRouter } from './rooms';
import { equipmentRouter } from './equipment';
import { projectsRouter } from './projects';
import { musiciansRouter } from './musicians';
import { quotesRouter } from './quotes';
import { contractsRouter } from './contracts';
import { expensesRouter } from './expenses';
import { notificationsRouter } from './notifications';
import { filesRouter } from './files';
import { aiRouter } from './ai';
import { clientPortalAuthRouter } from './client-portal-auth';
import { clientPortalDashboardRouter } from './client-portal-dashboard';

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
 * - ai: AI Chatbot (Phase 2 - P0 Priority)
 * - clientPortalAuth: Client Portal Authentication (Phase 4.1)
 * - clientPortalDashboard: Client Portal Dashboard (Phase 4.1)
 *
 * **Future routers to add:**
 * - payments, analytics, reports, admin, stripe,
 * - clientPortal (bookings), calendar
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
  musicians: musiciansRouter,
  quotes: quotesRouter,
  contracts: contractsRouter,
  expenses: expensesRouter,
  notifications: notificationsRouter,
  files: filesRouter,
  ai: aiRouter,
  clientPortalAuth: clientPortalAuthRouter,
  clientPortalDashboard: clientPortalDashboardRouter,
});

/**
 * Export type for use in client
 */
export type AppRouter = typeof appRouter;

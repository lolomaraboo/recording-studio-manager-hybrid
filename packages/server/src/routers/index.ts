import { router } from '../_core/trpc.js';
import { authRouter } from './auth.js';
import { organizationsRouter } from './organizations.js';
import { sessionsRouter } from './sessions.js';
import { clientsRouter } from './clients.js';
import { invoicesRouter } from './invoices.js';
import { roomsRouter } from './rooms.js';
import { equipmentRouter } from './equipment.js';
import { projectsRouter } from './projects.js';
import { musiciansRouter } from './musicians.js';
import { quotesRouter } from './quotes.js';
import { contractsRouter } from './contracts.js';
import { expensesRouter } from './expenses.js';
import { notificationsRouter } from './notifications.js';
import { filesRouter } from './files.js';
import { sharesRouter } from './shares.js';
import { aiRouter } from './ai.js';
import { searchRouter } from './search.js';
import { clientPortalAuthRouter } from './client-portal-auth.js';
import { clientPortalDashboardRouter } from './client-portal-dashboard.js';
import { clientPortalBookingRouter } from './client-portal-booking.js';
import { clientPortalStripeRouter } from './client-portal-stripe.js';
import { adminRouter } from './admin.js';
import { subscriptionsRouter } from './subscriptions.js';
import { superadminRouter } from './superadmin.js';
import { clientNotesRouter } from './clientNotes.js';
import { serviceCatalogRouter } from './serviceCatalog.js';

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
 * - clientNotes: Client notes history CRUD
 * - sessions: Recording sessions CRUD
 * - rooms: Studio rooms/spaces CRUD
 * - equipment: Equipment & gear CRUD
 * - projects: Projects, tracks, musicians CRUD
 * - invoices: Invoices & invoice items CRUD
 * - quotes: Quotes & quote items CRUD
 * - contracts: Legal contracts CRUD
 * - expenses: Business expenses CRUD
 * - serviceCatalog: Service catalog for quick quote insertion CRUD
 * - ai: AI Chatbot (Phase 2 - P0 Priority)
 * - search: Global search across all entities
 * - clientPortalAuth: Client Portal Authentication (Phase 4.1)
 * - clientPortalDashboard: Client Portal Dashboard (Phase 4.1)
 * - clientPortalBooking: Client Portal Booking System (Phase 4.1)
 * - clientPortalStripe: Client Portal Stripe Payments (Phase 4.1)
 *
 * **Future routers to add:**
 * - payments, analytics, reports, admin, calendar
 */
export const appRouter = router({
  auth: authRouter,
  organizations: organizationsRouter,
  admin: adminRouter,
  subscriptions: subscriptionsRouter,
  superadmin: superadminRouter,
  sessions: sessionsRouter,
  clients: clientsRouter,
  clientNotes: clientNotesRouter,
  invoices: invoicesRouter,
  rooms: roomsRouter,
  equipment: equipmentRouter,
  projects: projectsRouter,
  musicians: musiciansRouter,
  quotes: quotesRouter,
  contracts: contractsRouter,
  expenses: expensesRouter,
  serviceCatalog: serviceCatalogRouter,
  notifications: notificationsRouter,
  files: filesRouter,
  shares: sharesRouter,
  ai: aiRouter,
  search: searchRouter,
  clientPortalAuth: clientPortalAuthRouter,
  clientPortalDashboard: clientPortalDashboardRouter,
  clientPortalBooking: clientPortalBookingRouter,
  clientPortalStripe: clientPortalStripeRouter,
});

/**
 * Export type for use in client
 */
export type AppRouter = typeof appRouter;

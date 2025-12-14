import { router } from '../_core/trpc';
import { authRouter } from './auth';
import { organizationsRouter } from './organizations';
import { sessionsRouter } from './sessions';
import { clientsRouter } from './clients';
import { invoicesRouter } from './invoices';
import { roomsRouter } from './rooms';
import { clientAuthRouter } from './clientAuth';
import { clientPortalRouter } from './clientPortal';
import { stripeRouter } from './stripe';
import { bookingsRouter } from './bookings';
import { projectsRouter } from './projects';
import { filesRouter } from './files';
import { quotesRouter } from './quotes';
import { twoFactorRouter } from './twoFactor';
import { auditRouter } from './audit';
import { currencyRouter } from './currency';
import { brandingRouter } from './branding';
import { ssoRouter } from './sso';
import { regionRouter } from './region';
import { monitoringRouter } from './monitoring';
import { aiRouter } from './ai';
import { notificationsRouter } from './notifications';
import { analyticsRouter } from './analytics';
import { calendarRouter } from './calendar';
import { integrationsRouter } from './integrations';

/**
 * Main App Router
 *
 * Combines all sub-routers:
 * - auth: Staff authentication (login, logout, me)
 * - clientAuth: Client portal authentication (separate from staff)
 * - clientPortal: Client self-service dashboard and data access
 * - stripe: Payment processing (Stripe integration)
 * - organizations: Organization CRUD (Master DB)
 * - sessions: Recording sessions CRUD (Tenant DB)
 * - clients: Clients CRUD (Tenant DB)
 * - invoices: Invoices CRUD (Tenant DB)
 * - rooms: Studio rooms CRUD (Tenant DB)
 * - bookings: Client self-service booking (Client Portal)
 * - projects: Music projects with tracks, musicians, credits
 * - files: File uploads (S3) with versioning
 * - quotes: Quotes/estimates with PDF generation & DocuSign e-signature
 * - twoFactor: 2FA TOTP authentication (QR code, backup codes)
 * - audit: SOC2 compliant audit logging (Master DB)
 * - currency: Multi-currency support with exchange rates
 * - branding: White-label branding (logo, colors, custom domain)
 * - sso: Single Sign-On (SAML 2.0, OpenID Connect)
 * - region: Multi-region deployment (geo-routing, health checks, replication)
 * - monitoring: System monitoring, metrics, alerts, health checks
 * - ai: AI-powered features (transcription, analysis, recommendations)
 * - notifications: Multi-channel notification system
 * - analytics: Dashboards, KPIs, reports, trends, forecasting
 * - calendar: Google/Outlook calendar sync, iCal export
 * - integrations: Slack, Discord, Zapier, webhooks
 *
 * Future routers to add:
 * - equipment, admin, shares
 */
export const appRouter = router({
  auth: authRouter,
  twoFactor: twoFactorRouter,
  audit: auditRouter,
  currency: currencyRouter,
  branding: brandingRouter,
  sso: ssoRouter,
  region: regionRouter,
  monitoring: monitoringRouter,
  ai: aiRouter,
  notifications: notificationsRouter,
  analytics: analyticsRouter,
  calendar: calendarRouter,
  integrations: integrationsRouter,
  clientAuth: clientAuthRouter,
  clientPortal: clientPortalRouter,
  stripe: stripeRouter,
  bookings: bookingsRouter,
  projects: projectsRouter,
  files: filesRouter,
  quotes: quotesRouter,
  organizations: organizationsRouter,
  sessions: sessionsRouter,
  clients: clientsRouter,
  invoices: invoicesRouter,
  rooms: roomsRouter,
});

/**
 * Export type for use in client
 */
export type AppRouter = typeof appRouter;

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
 *
 * Future routers to add:
 * - equipment, analytics, reports, admin,
 * - shares, ai, calendar, notifications
 */
export const appRouter = router({
  auth: authRouter,
  twoFactor: twoFactorRouter,
  audit: auditRouter,
  currency: currencyRouter,
  branding: brandingRouter,
  sso: ssoRouter,
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

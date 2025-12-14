# Recording Studio Manager - API Documentation

> **Version:** 1.0.0
> **Base URL:** `https://api.example.com` (or `http://localhost:3001` for development)
> **Protocol:** tRPC over HTTP

## Overview

RSM uses tRPC for type-safe API communication. All endpoints are available at `/api/trpc/{procedure}`.

### Authentication

Most endpoints require authentication via JWT Bearer token:

```http
Authorization: Bearer <access_token>
```

Tokens are obtained via the `auth.login` procedure.

### Response Format

All responses follow tRPC format:

```json
{
  "result": {
    "data": { /* response data */ }
  }
}
```

Errors:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

---

## Routers

### Auth Router (`auth.*`)

Authentication and session management.

#### `auth.login`

Login with email and password.

**Input:**
```typescript
{
  email: string;
  password: string;
  organizationSlug?: string;
}
```

**Response:**
```typescript
{
  user: {
    id: number;
    email: string;
    name: string;
    role: "admin" | "member" | "client";
  };
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor?: boolean;
}
```

#### `auth.logout`

Logout current session.

**Response:** `{ success: true }`

#### `auth.me`

Get current user info.

**Response:**
```typescript
{
  id: number;
  email: string;
  name: string;
  role: string;
  organizationId: number;
}
```

#### `auth.refreshToken`

Refresh access token.

**Input:** `{ refreshToken: string }`

**Response:** `{ accessToken: string; refreshToken: string }`

---

### Two-Factor Router (`twoFactor.*`)

TOTP-based two-factor authentication.

#### `twoFactor.setup`

Generate 2FA secret and QR code.

**Response:**
```typescript
{
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
```

#### `twoFactor.verify`

Verify and enable 2FA.

**Input:** `{ token: string }`

**Response:** `{ success: true }`

#### `twoFactor.disable`

Disable 2FA.

**Input:** `{ token: string }`

**Response:** `{ success: true }`

#### `twoFactor.verifyLogin`

Verify 2FA during login.

**Input:** `{ userId: number; token: string }`

**Response:** `{ accessToken: string; refreshToken: string }`

---

### Organizations Router (`organizations.*`)

Organization (tenant) management. Admin only.

#### `organizations.list`

List all organizations.

**Response:** `Organization[]`

#### `organizations.get`

Get organization by ID.

**Input:** `{ id: number }`

**Response:** `Organization`

#### `organizations.create`

Create new organization.

**Input:**
```typescript
{
  name: string;
  slug: string;
  plan?: "free" | "starter" | "professional" | "enterprise";
}
```

**Response:** `Organization`

#### `organizations.update`

Update organization.

**Input:** `{ id: number; name?: string; plan?: string; ... }`

**Response:** `Organization`

---

### Clients Router (`clients.*`)

Studio client management.

#### `clients.list`

List all clients for current organization.

**Query params:** `{ search?: string; page?: number; limit?: number }`

**Response:**
```typescript
{
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
}
```

#### `clients.get`

Get client by ID.

**Input:** `{ id: number }`

**Response:** `Client`

#### `clients.create`

Create new client.

**Input:**
```typescript
{
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
}
```

**Response:** `Client`

#### `clients.update`

Update client.

**Input:** `{ id: number; name?: string; email?: string; ... }`

**Response:** `Client`

#### `clients.delete`

Delete client (soft delete).

**Input:** `{ id: number }`

**Response:** `{ success: true }`

---

### Sessions Router (`sessions.*`)

Recording session management.

#### `sessions.list`

List sessions with filters.

**Input:**
```typescript
{
  clientId?: number;
  roomId?: number;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  sessions: Session[];
  total: number;
}
```

#### `sessions.get`

Get session by ID.

**Input:** `{ id: number }`

**Response:** `Session` with client and room details

#### `sessions.create`

Create new session.

**Input:**
```typescript
{
  clientId: number;
  roomId: number;
  title: string;
  startTime: string; // ISO 8601
  endTime: string;
  hourlyRate: number;
  notes?: string;
}
```

**Response:** `Session`

#### `sessions.update`

Update session.

**Input:** `{ id: number; title?: string; status?: string; ... }`

**Response:** `Session`

#### `sessions.complete`

Mark session as completed and calculate total.

**Input:** `{ id: number; actualEndTime?: string }`

**Response:** `Session` with calculated total

---

### Rooms Router (`rooms.*`)

Studio room management.

#### `rooms.list`

List all rooms.

**Response:** `Room[]`

#### `rooms.get`

Get room by ID with availability.

**Input:** `{ id: number; date?: string }`

**Response:** `Room` with scheduled sessions

#### `rooms.create`

Create new room.

**Input:**
```typescript
{
  name: string;
  type: "recording" | "mixing" | "mastering" | "rehearsal";
  hourlyRate: number;
  capacity?: number;
  equipment?: string[];
}
```

**Response:** `Room`

#### `rooms.availability`

Check room availability.

**Input:**
```typescript
{
  roomId: number;
  startTime: string;
  endTime: string;
}
```

**Response:** `{ available: boolean; conflicts?: Session[] }`

---

### Invoices Router (`invoices.*`)

Invoice management and PDF generation.

#### `invoices.list`

List invoices with filters.

**Input:**
```typescript
{
  clientId?: number;
  status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  invoices: Invoice[];
  total: number;
}
```

#### `invoices.get`

Get invoice with line items.

**Input:** `{ id: number }`

**Response:** `Invoice` with items array

#### `invoices.create`

Create invoice from sessions.

**Input:**
```typescript
{
  clientId: number;
  sessionIds?: number[];
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  dueDate: string;
  notes?: string;
}
```

**Response:** `Invoice`

#### `invoices.send`

Send invoice to client via email.

**Input:** `{ id: number }`

**Response:** `{ success: true; sentAt: string }`

#### `invoices.markPaid`

Mark invoice as paid.

**Input:** `{ id: number; paidAt?: string; paymentMethod?: string }`

**Response:** `Invoice`

#### `invoices.generatePdf`

Generate PDF for invoice.

**Input:** `{ id: number }`

**Response:** `{ url: string }` (S3 presigned URL)

---

### Projects Router (`projects.*`)

Music project and track management.

#### `projects.list`

List projects with pipeline stages.

**Input:**
```typescript
{
  clientId?: number;
  status?: "planning" | "recording" | "mixing" | "mastering" | "delivered";
  page?: number;
}
```

**Response:**
```typescript
{
  projects: Project[];
  total: number;
}
```

#### `projects.get`

Get project with tracks and credits.

**Input:** `{ id: number }`

**Response:** `Project` with tracks, musicians, credits

#### `projects.create`

Create new project.

**Input:**
```typescript
{
  clientId: number;
  title: string;
  genre?: string;
  targetReleaseDate?: string;
  budget?: number;
}
```

**Response:** `Project`

#### `projects.addTrack`

Add track to project.

**Input:**
```typescript
{
  projectId: number;
  title: string;
  duration?: number;
  bpm?: number;
  key?: string;
}
```

**Response:** `Track`

#### `projects.updateStatus`

Update project pipeline status.

**Input:** `{ id: number; status: string }`

**Response:** `Project`

---

### Files Router (`files.*`)

File upload and management (S3).

#### `files.getUploadUrl`

Get presigned URL for upload.

**Input:**
```typescript
{
  filename: string;
  contentType: string;
  projectId?: number;
  sessionId?: number;
}
```

**Response:**
```typescript
{
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}
```

#### `files.getDownloadUrl`

Get presigned URL for download.

**Input:** `{ fileKey: string }`

**Response:** `{ downloadUrl: string; expiresIn: number }`

#### `files.list`

List files for project or session.

**Input:** `{ projectId?: number; sessionId?: number }`

**Response:** `File[]`

#### `files.delete`

Delete file (soft delete).

**Input:** `{ fileKey: string }`

**Response:** `{ success: true }`

---

### Quotes Router (`quotes.*`)

Quote/estimate management.

#### `quotes.list`

List quotes.

**Response:** `Quote[]`

#### `quotes.create`

Create new quote.

**Input:**
```typescript
{
  clientId: number;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  validUntil: string;
  notes?: string;
}
```

**Response:** `Quote`

#### `quotes.accept`

Accept quote and optionally create invoice.

**Input:** `{ id: number; createInvoice?: boolean }`

**Response:** `{ quote: Quote; invoice?: Invoice }`

#### `quotes.generatePdf`

Generate PDF for quote.

**Input:** `{ id: number }`

**Response:** `{ url: string }`

---

### Stripe Router (`stripe.*`)

Payment processing.

#### `stripe.createCheckoutSession`

Create Stripe Checkout session.

**Input:**
```typescript
{
  invoiceId: number;
  successUrl: string;
  cancelUrl: string;
}
```

**Response:** `{ sessionId: string; url: string }`

#### `stripe.createPaymentIntent`

Create payment intent for custom UI.

**Input:** `{ invoiceId: number }`

**Response:**
```typescript
{
  clientSecret: string;
  amount: number;
  currency: string;
}
```

#### `stripe.getPaymentStatus`

Get payment status for invoice.

**Input:** `{ invoiceId: number }`

**Response:** `{ status: string; paidAt?: string }`

---

### Currency Router (`currency.*`)

Multi-currency support.

#### `currency.getSupportedCurrencies`

Get list of supported currencies.

**Response:**
```typescript
{
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}[]
```

#### `currency.convert`

Convert amount between currencies.

**Input:**
```typescript
{
  amount: number;
  from: string;
  to: string;
}
```

**Response:** `{ amount: number; rate: number }`

#### `currency.getRates`

Get current exchange rates.

**Input:** `{ base?: string }`

**Response:** `{ base: string; rates: Record<string, number> }`

---

### Branding Router (`branding.*`)

White-label branding.

#### `branding.get`

Get organization branding.

**Response:**
```typescript
{
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  organizationName: string;
}
```

#### `branding.getTheme`

Get CSS theme variables.

**Response:**
```typescript
{
  cssVariables: Record<string, string>;
}
```

#### `branding.update`

Update branding settings.

**Input:**
```typescript
{
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}
```

**Response:** `{ success: true }`

---

### SSO Router (`sso.*`)

Single Sign-On (SAML/OIDC).

#### `sso.getConfig`

Get SSO configuration (admin only).

**Response:** SSO configuration (secrets redacted)

#### `sso.configureSAML`

Configure SAML SSO.

**Input:**
```typescript
{
  provider: "okta" | "azure_ad" | "onelogin" | "custom";
  entityId: string;
  ssoUrl: string;
  certificate: string;
  allowedDomains?: string[];
}
```

**Response:** `{ success: true }`

#### `sso.configureOIDC`

Configure OIDC SSO.

**Input:**
```typescript
{
  provider: "auth0" | "google" | "custom";
  clientId: string;
  clientSecret: string;
  issuer?: string;
  allowedDomains?: string[];
}
```

**Response:** `{ success: true }`

#### `sso.initiate`

Initiate SSO login flow.

**Input:** `{ organizationSlug: string }`

**Response:** `{ type: "saml" | "oidc"; redirectUrl: string }`

#### `sso.checkAvailability`

Check if SSO is available for organization.

**Input:** `{ organizationSlug: string }`

**Response:** `{ available: boolean; provider?: string }`

---

### Region Router (`region.*`)

Multi-region management.

#### `region.getCurrent`

Get current server region.

**Response:**
```typescript
{
  code: "us-east-1" | "eu-west-1" | "ap-southeast-1";
  name: string;
  location: string;
  isPrimary: boolean;
}
```

#### `region.getAll`

Get all available regions.

**Response:** `Region[]`

#### `region.getOptimal`

Get optimal region for client.

**Input:** `{ countryCode?: string }`

**Response:**
```typescript
{
  selectedRegion: string;
  reason: "geo" | "latency" | "affinity" | "failover";
  alternativeRegions: string[];
}
```

#### `region.healthCheck`

Perform health check (admin only).

**Response:**
```typescript
{
  region: string;
  status: "healthy" | "degraded" | "unhealthy";
  apiLatencyMs: number;
  dbLatencyMs: number;
}
```

---

### Monitoring Router (`monitoring.*`)

System monitoring and metrics.

#### `monitoring.health`

Public health check endpoint.

**Response:**
```typescript
{
  status: "healthy" | "degraded" | "unhealthy";
  region: string;
  timestamp: string;
  checks: {
    database: { status: string; latencyMs: number };
    redis: { status: string };
    memory: { percentage: number };
  };
}
```

#### `monitoring.ping`

Simple ping for latency testing.

**Response:** `{ pong: true; region: string; timestamp: string }`

#### `monitoring.getMetrics`

Get current system metrics.

**Response:**
```typescript
{
  timestamp: string;
  memory: { usedMB: number; percentage: number };
  requests: {
    total: number;
    errors: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
  };
}
```

#### `monitoring.getAlerts`

Get active alerts.

**Response:** `Alert[]`

#### `monitoring.getDashboard`

Get dashboard data (admin only).

**Response:**
```typescript
{
  currentRegion: string;
  regions: { code: string; status: string; isHealthy: boolean }[];
  metrics: { ... };
  alerts: Alert[];
}
```

---

### Audit Router (`audit.*`)

SOC2 compliant audit logging.

#### `audit.list`

List audit logs with filters.

**Input:**
```typescript
{
  userId?: number;
  action?: string;
  category?: "auth" | "data" | "admin" | "billing" | "security";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  logs: AuditLog[];
  total: number;
}
```

#### `audit.stats`

Get audit statistics.

**Input:** `{ days?: number }`

**Response:**
```typescript
{
  totalEvents: number;
  byCategory: Record<string, number>;
  byAction: Record<string, number>;
  topUsers: { userId: number; count: number }[];
}
```

#### `audit.export`

Export audit logs to CSV.

**Input:** `{ startDate: string; endDate: string; format?: "csv" | "json" }`

**Response:** `{ url: string }` (download URL)

---

## Client Portal Routers

### Client Auth Router (`clientAuth.*`)

Client portal authentication.

#### `clientAuth.login`

Login to client portal.

**Input:** `{ email: string; password: string; organizationSlug: string }`

**Response:** Same as `auth.login`

### Client Portal Router (`clientPortal.*`)

Client self-service endpoints.

#### `clientPortal.getDashboard`

Get client dashboard data.

**Response:**
```typescript
{
  upcomingSessions: Session[];
  recentInvoices: Invoice[];
  activeProjects: Project[];
  stats: {
    totalSessions: number;
    pendingInvoices: number;
    totalSpent: number;
  };
}
```

#### `clientPortal.getSessions`

Get client's sessions.

**Response:** `Session[]`

#### `clientPortal.getInvoices`

Get client's invoices.

**Response:** `Invoice[]`

#### `clientPortal.getProjects`

Get client's projects.

**Response:** `Project[]`

---

### Bookings Router (`bookings.*`)

Client self-service booking.

#### `bookings.getAvailableSlots`

Get available booking slots.

**Input:**
```typescript
{
  roomId: number;
  date: string;
  duration: number; // hours
}
```

**Response:**
```typescript
{
  slots: {
    startTime: string;
    endTime: string;
    available: boolean;
  }[];
}
```

#### `bookings.create`

Create new booking request.

**Input:**
```typescript
{
  roomId: number;
  startTime: string;
  endTime: string;
  title: string;
  notes?: string;
}
```

**Response:** `Booking` with status "pending"

#### `bookings.cancel`

Cancel booking.

**Input:** `{ id: number; reason?: string }`

**Response:** `{ success: true }`

---

## Rate Limits

| Endpoint Type | Rate Limit |
|--------------|------------|
| Public | 100/minute |
| Authenticated | 1000/minute |
| Admin | 5000/minute |
| Webhooks | 10/second |

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `CONFLICT` | Resource conflict (e.g., double booking) |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## Webhooks

Configure webhooks at Settings > Integrations.

### Events

- `session.created`
- `session.completed`
- `invoice.created`
- `invoice.paid`
- `payment.succeeded`
- `payment.failed`
- `booking.created`
- `booking.confirmed`

### Payload Format

```json
{
  "event": "invoice.paid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": 123,
    "amount": 500.00,
    "currency": "USD"
  },
  "signature": "sha256=..."
}
```

---

## SDKs

- **TypeScript/JavaScript:** `npm install @rsm/client`
- **React hooks:** `import { trpc } from '@rsm/client'`

Example:

```typescript
import { createTRPCClient } from '@rsm/client';

const client = createTRPCClient({
  url: 'https://api.example.com/api/trpc',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Type-safe API calls
const sessions = await client.sessions.list.query({ clientId: 1 });
const invoice = await client.invoices.create.mutate({ clientId: 1, items: [...] });
```

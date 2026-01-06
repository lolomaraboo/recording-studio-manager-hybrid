# Phase 10 Discovery: Quote System Backend

**Research Date:** 2026-01-05
**Research Level:** Standard (Level 2)
**Stack Context:** Node.js, TypeScript, tRPC, PostgreSQL, Drizzle ORM

## Research Summary

This discovery phase evaluated industry-standard patterns for implementing a quote management system backend. The research focused on four critical areas: state machine workflows for quote lifecycle management, PDF generation libraries for server-side document creation, template patterns for dynamic service items, and conversion logic for transforming accepted quotes into active projects.

**Key Finding:** The quote system should follow a calculated expiration pattern (rather than status flags), use PDFKit for server-side PDF generation (avoiding Puppeteer overhead), implement a finite state machine for quote lifecycle management, and leverage the existing invoice schema as a foundation to maintain consistency across billing documents.

---

## 1. Quote State Machine

### Recommended Pattern

Use a **Finite State Machine (FSM)** with five primary states and calculated transitions:

```
DRAFT → SENT → (ACCEPTED | REJECTED | EXPIRED)
  ↓                       ↓
CANCELLED           CONVERTED_TO_PROJECT
```

**State Definitions:**

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| `draft` | Initial state, quote being created/edited | → `sent`, `cancelled` |
| `sent` | Quote delivered to client, awaiting response | → `accepted`, `rejected`, `expired`, `draft` |
| `accepted` | Client accepted the quote | → `converted_to_project` |
| `rejected` | Client declined the quote | → `draft` (revision) |
| `expired` | Quote validity period passed (calculated) | → `draft` (new version) |
| `cancelled` | Quote cancelled before sending | - (terminal) |
| `converted_to_project` | Quote transformed into active project | - (terminal) |

**Sources:**
- [Quote statuses: Draft, Pending, Accepted, Rejected - Tool Time](https://support.tooltime.app/en/articles/6579342-quote-statuses-draft-pending-accepted-rejected-invoiced)
- [Workflows and State Machines - Symfony](https://symfony.com/doc/current/workflow/workflow-and-state-machine.html)
- [Designing a Workflow Engine Database Part 4: States and Transitions](https://exceptionnotfound.net/designing-a-workflow-engine-database-part-4-states-and-transitions/)

### Database Schema Approach

**Base Table (`quotes`):**

```typescript
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number", { length: 100 }).notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),

  // Status & Workflow
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  // "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled" | "converted_to_project"

  // Timestamps (for state tracking)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),          // When quote was sent to client
  respondedAt: timestamp("responded_at"), // When client accepted/rejected
  expiresAt: timestamp("expires_at"),    // Calculated expiration deadline

  // Financial (same pattern as invoices)
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("20.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  // Quote-specific fields
  validityDays: integer("validity_days").notNull().default(30), // Quote valid for N days
  terms: text("terms"), // Terms and conditions
  notes: text("notes"),
  internalNotes: text("internal_notes"), // Not visible to client

  // Conversion tracking
  convertedToProjectId: integer("converted_to_project_id").references(() => projects.id),
  convertedAt: timestamp("converted_at"),
});
```

**Line Items Table (`quote_items`):**

```typescript
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),

  // Service details
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1.00"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  // Optional: Link to service templates or predefined services
  serviceTemplateId: integer("service_template_id"), // Future: references service_templates

  // Ordering
  displayOrder: integer("display_order").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**Optional: State Transition History Table (for audit trail):**

```typescript
export const quoteStateHistory = pgTable("quote_state_history", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  fromState: varchar("from_state", { length: 50 }),
  toState: varchar("to_state", { length: 50 }).notNull(),
  triggeredBy: integer("triggered_by"), // Future: user_id
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### Expiration Logic Pattern

**Best Practice:** Use **calculated expiration** instead of cron jobs updating status flags.

**Implementation:**

```typescript
// In tRPC query/resolver
const isExpired = (quote: Quote): boolean => {
  if (!quote.expiresAt || quote.status !== 'sent') return false;
  return new Date() > new Date(quote.expiresAt);
};

// Set expiresAt when quote is sent
const sendQuote = async (quoteId: number) => {
  const quote = await getQuote(quoteId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + quote.validityDays);

  await updateQuote(quoteId, {
    status: 'sent',
    sentAt: new Date(),
    expiresAt: expiresAt,
  });
};

// Query with automatic expiration detection
const listQuotes = async () => {
  const quotes = await db.select().from(quotes);

  return quotes.map(quote => ({
    ...quote,
    // Calculated field, not stored
    isExpired: isExpired(quote),
    // Display status considers expiration
    displayStatus: isExpired(quote) ? 'expired' : quote.status,
  }));
};
```

**Advantages:**
- No cron job overhead
- Accurate real-time expiration
- Reduces database writes
- Prevents I/O bloat from frequent updates

**Sources:**
- [Automatically expire rows in Postgres](https://schinckel.net/2021/09/09/automatically-expire-rows-in-postgres/)
- [PostgreSQL Interval, Date, Timestamp Data Types](https://www.enterprisedb.com/blog/postgresql-interval-date-timestamp-and-time-data-types)

### Key Decisions

**Decision 1: Calculated Expiration (not status updates)**
**Rationale:** Avoids cron jobs, reduces database writes, provides real-time accuracy. PostgreSQL's `TIMESTAMPTZ` and interval queries (`WHERE now() < expires_at`) are efficient and standard practice.

**Decision 2: Store `expiresAt` timestamp, not just `validityDays`**
**Rationale:** Locks in expiration date when quote is sent, preventing retroactive changes if `validityDays` default is updated later.

**Decision 3: Optional state transition history table**
**Rationale:** Provides audit trail for compliance, debugging, and understanding quote lifecycle. Can be added in Phase 10 or deferred to Phase 11 (UI) if not critical for MVP.

**Decision 4: Reuse invoice financial pattern**
**Rationale:** Consistency across billing documents. Users familiar with invoice structure will understand quotes. Simplifies future quote-to-invoice conversion (if needed separate from projects).

---

## 2. PDF Generation Library

### Options Evaluated

| Library | Pros | Cons | Score | Best For |
|---------|------|------|-------|----------|
| **PDFKit** | ✅ Mature (since 2012)<br>✅ TypeScript types available<br>✅ Direct PDF creation (no browser)<br>✅ Small footprint<br>✅ Active maintenance | ⚠️ Manual layout coding<br>⚠️ No HTML/CSS templating | **8/10** | Server-side generation, programmatic layouts, invoices/quotes |
| **react-pdf** | ✅ React component syntax<br>✅ Uses PDFKit under the hood<br>✅ Declarative templates | ❌ Requires React (not server-only)<br>⚠️ Overkill for simple docs | **6/10** | React apps, client-side generation |
| **Puppeteer** | ✅ Pixel-perfect HTML/CSS rendering<br>✅ Complex layouts easy | ❌ Heavy (Chromium headless)<br>❌ Slow startup time<br>❌ Large container size<br>❌ High latency | **4/10** | Complex dashboards, existing HTML templates |

### Recommendation: **PDFKit**

**Rationale:**
1. **No React Dependency:** Server backend is Express/tRPC, not React SSR
2. **Performance:** No browser overhead, fast generation (<100ms per PDF)
3. **Container Size:** Critical for Docker deployment (Puppeteer adds ~300MB Chromium)
4. **Use Case Fit:** Quotes/invoices are structured documents (not complex web layouts)
5. **TypeScript Support:** Full type definitions available via `@types/pdfkit`
6. **Proven Pattern:** Multiple invoice generator packages built on PDFKit

**Example Invoice Generators Using PDFKit:**
- [@zed378/invoice-pdfkit](https://www.npmjs.com/package/@zed378/invoice-pdfkit): Internationalized business PDFs
- [microinvoice](https://github.com/baptistejamin/node-microinvoice): Minimal fast generator
- [node-pdf-invoice](https://github.com/Astrocoders/node-pdf-invoice): Line item support

**Sources:**
- [A full comparison of 6 JS libraries for generating PDFs](https://dev.to/handdot/generate-a-pdf-in-js-summary-and-comparison-of-libraries-3k0p)
- [Popular Libraries 2025 for PDF Generation Using Node JS](https://pdfnoodle.com/blog/popular-libraries-2025-for-pdf-generation-using-node-js/)
- [Best HTML to PDF libraries for Node.js - LogRocket](https://blog.logrocket.com/best-html-pdf-libraries-node-js/)
- [How to generate PDF invoices in Node.js using PDFKit](https://pspdfkit.com/blog/2019/generate-pdf-invoices-pdfkit-nodejs/)

---

## 3. Service Item Templates

### Recommended Approach

**Hybrid: Predefined service templates (optional FK) + freeform line items**

This provides flexibility (custom items) while enabling automation (templates).

### Database Schema

**Service Templates Table (Optional - Phase 10 or future):**

```typescript
export const serviceTemplates = pgTable("service_templates", {
  id: serial("id").primaryKey(),

  // Template info
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Recording Session (Hourly)"
  description: text("description"),
  category: varchar("category", { length: 100 }), // "recording" | "mixing" | "mastering" | "rehearsal"

  // Default pricing
  defaultUnitPrice: decimal("default_unit_price", { precision: 10, scale: 2 }).notNull(),
  defaultQuantity: decimal("default_quantity", { precision: 10, scale: 2 }).default("1.00"),
  unit: varchar("unit", { length: 50 }), // "hour" | "day" | "session" | "track" | "project"

  // Template variables (JSON)
  variables: jsonb("variables").$type<Array<{
    key: string;        // e.g., "room_name", "engineer_name"
    label: string;      // e.g., "Studio Room"
    type: "text" | "number" | "select";
    required: boolean;
    options?: string[]; // For select type
  }>>().default([]),

  // Dynamic description template
  descriptionTemplate: text("description_template"),
  // e.g., "Recording session in {{room_name}} with {{engineer_name}} ({{quantity}} hours)"

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### Template Structure Example

```typescript
// Service template for "Studio Recording Session"
{
  name: "Studio Recording Session",
  category: "recording",
  defaultUnitPrice: "75.00", // $75/hour
  defaultQuantity: "4.00",   // 4 hours
  unit: "hour",
  descriptionTemplate: "Recording session in {{room_name}} with engineer {{engineer_name}} ({{quantity}} hours @ {{unit_price}}/hour)",
  variables: [
    { key: "room_name", label: "Studio Room", type: "select", required: true, options: ["Studio A", "Studio B"] },
    { key: "engineer_name", label: "Engineer", type: "text", required: false }
  ]
}

// When user creates quote item from template, they fill variables:
{
  room_name: "Studio A",
  engineer_name: "John Smith"
}

// Result (quote_items.description):
"Recording session in Studio A with engineer John Smith (4 hours @ $75/hour)"
```

### Variable Substitution Pattern

**Server-side rendering (simple string replacement):**

```typescript
const renderTemplate = (template: string, variables: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
};

// Usage
const description = renderTemplate(
  serviceTemplate.descriptionTemplate,
  { room_name: "Studio A", engineer_name: "John Smith", quantity: "4", unit_price: "75" }
);
```

### Storage Approach

**Recommendation: Relational + JSON hybrid**

- **Relational:** Core fields (`id`, `name`, `defaultUnitPrice`, `isActive`) for queries/filters
- **JSON (`variables`):** Flexible schema for template-specific metadata
- **Advantage:** Type-safe in TypeScript via Drizzle's `.$type<T>()` inference

**Why not pure JSON?**
- Harder to query/filter templates by category or price range
- Loses referential integrity (FK constraints)
- Drizzle ORM optimized for relational patterns

**Why not pure relational?**
- Variable fields differ per template (recording vs. mastering vs. mixing)
- Avoids EAV (Entity-Attribute-Value) anti-pattern complexity

---

## 4. Quote-to-Project Conversion Logic

### Data Mapping Pattern

**Quote → Project Transformation:**

```typescript
// High-level conversion flow
const convertQuoteToProject = async (quoteId: number) => {
  const tenantDb = await getTenantDb();

  // 1. Fetch quote with items
  const quote = await tenantDb.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: { items: true, client: true }
  });

  if (quote.status !== 'accepted') {
    throw new Error('Only accepted quotes can be converted');
  }

  // 2. Create project from quote
  const [project] = await tenantDb.insert(projects).values({
    clientId: quote.clientId,
    name: `Project from Quote ${quote.quoteNumber}`,
    description: quote.notes || `Converted from quote ${quote.quoteNumber}`,
    status: 'pre_production',
    budget: quote.total, // Total becomes project budget
    startDate: new Date(),
    // Other fields: fill from quote metadata or leave default
  }).returning();

  // 3. Optional: Convert quote items to project tasks (future phase)
  // For now, quote items are reference only

  // 4. Update quote status
  await tenantDb.update(quotes)
    .set({
      status: 'converted_to_project',
      convertedToProjectId: project.id,
      convertedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId));

  return project;
};
```

### Workflow After Acceptance

**Step-by-step process:**

1. **Client accepts quote** (via client portal or admin marks as accepted)
   - Update `quotes.status = 'accepted'`
   - Set `quotes.respondedAt = now()`

2. **Admin/system triggers conversion** (manual button or automatic)
   - Call `convertQuoteToProject(quoteId)`
   - Creates new `projects` record
   - Links project via `quotes.convertedToProjectId`

3. **Quote becomes read-only reference**
   - Status: `converted_to_project` (terminal state)
   - Visible in project detail page as "Original Quote"
   - PDF remains accessible for audit/reference

4. **Project enters workflow**
   - Status: `pre_production`
   - Budget set from quote total
   - Admin can now schedule sessions, add tracks, etc.

5. **Financial tracking**
   - Quote total → Project budget
   - Actual costs tracked in `projects.totalCost`
   - Future invoices reference project, not quote

### Data Mapping Details

| Quote Field | → | Project Field | Notes |
|-------------|---|---------------|-------|
| `quoteNumber` | → | `description` | Include in project description for reference |
| `clientId` | → | `clientId` | Direct FK copy |
| `total` | → | `budget` | Quote total becomes project budget |
| `notes` | → | `description` | User-facing notes become project description |
| `internalNotes` | → | `notes` | Internal notes move to project notes |
| `quote_items[]` | → | *(reference only)* | Items not converted to tasks in Phase 10 (future) |
| `sentAt` | → | `startDate` | Optional: Use quote sent date as project start |

### Edge Cases

**Case 1: Client wants to modify accepted quote**
**Handling:**
- Original quote cannot be edited (immutable once accepted)
- Create new quote as revision (copy items, increment version)
- Link via `originalQuoteId` (future schema field)
- Original quote remains linked to project

**Case 2: Partial conversion (only some quote items)**
**Handling:**
- **Phase 10 Scope:** All-or-nothing conversion (full quote → project)
- **Future (Phase 14/15):** Task system can selectively import items
- Quote items stored in `quote_items` table for manual reference

**Case 3: Quote accepted but project creation fails**
**Handling:**
- Use database transaction to ensure atomicity
- If project creation fails, rollback quote status update
- Log error for admin to retry conversion manually

**Case 4: Multiple projects from one quote (rare)**
**Handling:**
- **Phase 10:** Not supported (1 quote → 1 project)
- **Future:** Add `quotes.allowMultipleProjects` flag + conversion history table

### Conversion Code Example

```typescript
// packages/server/src/routers/quotes.ts
import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { quotes, projects } from '@rsm/database/tenant';
import { eq } from 'drizzle-orm';

export const quotesRouter = router({
  // ... other endpoints ...

  convertToProject: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Use transaction for atomicity
      return await tenantDb.transaction(async (tx) => {
        // 1. Get quote
        const quote = await tx.query.quotes.findFirst({
          where: eq(quotes.id, input.quoteId),
        });

        if (!quote) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found' });
        }

        if (quote.status !== 'accepted') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only accepted quotes can be converted to projects'
          });
        }

        if (quote.convertedToProjectId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Quote already converted to project'
          });
        }

        // 2. Create project
        const [project] = await tx.insert(projects).values({
          clientId: quote.clientId,
          name: `Project from Quote ${quote.quoteNumber}`,
          description: quote.notes || undefined,
          status: 'pre_production',
          budget: quote.total,
          startDate: new Date(),
        }).returning();

        // 3. Update quote
        await tx.update(quotes)
          .set({
            status: 'converted_to_project',
            convertedToProjectId: project.id,
            convertedAt: new Date(),
          })
          .where(eq(quotes.id, input.quoteId));

        return { project, quote };
      });
    }),
});
```

**Sources:**
- [Quote-to-Invoice: A Complete Guide for Contractors](https://www.depositfix.com/blog/quote-to-invoice)
- [The Quote To Cash Process: Everything You Need To Know](https://staxpayments.com/blog/quote-to-cash/)
- [Mastering the Quote-to-Cash Process: Benefits & Challenges](https://conga.com/resources/blog/quote-to-cash-process-10-steps)
- [Quote-to-invoice automation in project workflows](https://workflowmax.com/blog/quote-to-invoice-automation-in-project-workflows)

---

## Implementation Guidance

### Phase 10 Tasks Should Include

1. **Database Schema Creation**
   - Create `quotes` table (mirroring invoice structure + quote-specific fields)
   - Create `quote_items` table (line items)
   - Optional: Create `quote_state_history` table (audit trail)
   - Generate Drizzle migration: `pnpm db:generate`
   - Apply migration: `pnpm db:migrate`

2. **tRPC Quotes Router** (`packages/server/src/routers/quotes.ts`)
   - CRUD endpoints: `list`, `get`, `create`, `update`, `delete`
   - State transitions: `send`, `accept`, `reject`, `cancel`
   - Conversion: `convertToProject`
   - PDF generation: `generatePDF`

3. **PDF Generation Service** (`packages/server/src/utils/quote-pdf-service.ts`)
   - Install `pdfkit` and `@types/pdfkit`
   - Create `generateQuotePDF(quoteId)` function
   - Template layout: header (org info), client info, line items table, totals, terms
   - Return PDF as buffer or save to temp file

4. **Quote Number Generation**
   - Auto-generate unique quote numbers (e.g., `Q-2026-0001`)
   - Use sequence pattern similar to invoice numbers
   - Store in `quotes.quoteNumber` (unique constraint)

5. **Expiration Logic**
   - Implement `isExpired()` helper function
   - Add virtual `displayStatus` field in list queries
   - UI can filter/sort by expired quotes

6. **Testing**
   - Unit tests: State transitions, conversion logic
   - Integration tests: Full quote lifecycle (draft → sent → accepted → project)
   - E2E tests: Create quote, generate PDF, convert to project

### What to Avoid

**Anti-pattern 1: Cron jobs for expiration**
**Why:** Adds infrastructure complexity, I/O overhead, doesn't provide real-time accuracy. Use calculated expiration instead.

**Anti-pattern 2: Puppeteer for simple documents**
**Why:** Massive overhead (300MB+ container, slow startup). PDFKit is 10x faster for structured documents.

**Anti-pattern 3: Mutable quotes after sending**
**Why:** Creates audit issues. Once sent, quote should be immutable (create new version instead).

**Anti-pattern 4: Tight coupling between quotes and invoices**
**Why:** Quotes and invoices have different lifecycles. Quote accepted → creates project, not invoice. Invoice is for payment after work is done/delivered.

**Anti-pattern 5: Storing rendered PDF in database**
**Why:** PDFs can be regenerated on-demand from quote data. If caching needed, use file storage (S3) not PostgreSQL BYTEA.

### Deferred to Phase 11 (Frontend)

These items are **not** in Phase 10 scope (backend only):

- Quote creation UI
- Quote detail page
- Client portal quote acceptance flow
- PDF preview in browser
- Email templates for sending quotes
- Service template management UI

### Integration Points

**Existing Systems:**
- **Clients:** Quotes reference `clients.id` (same as invoices)
- **Projects:** Conversion creates `projects` record
- **Sessions:** Future - quote items could suggest session bookings
- **Invoices:** Separate from quotes (invoicing happens after project delivery)

**New Dependencies:**
- `pdfkit` (PDF generation)
- `@types/pdfkit` (TypeScript types)

**Environment Variables:**
- `QUOTE_VALIDITY_DAYS_DEFAULT`: Default quote validity (e.g., 30)
- `QUOTE_NUMBER_PREFIX`: Prefix for quote numbers (e.g., "Q")

---

## References

### State Machine & Workflow
- [Modelling Workflows With Finite State Machines in .NET - Lloyd Atkinson](https://www.lloydatkinson.net/posts/2022/modelling-workflows-with-finite-state-machines-in-dotnet/)
- [Workflows and State Machines (Symfony Docs)](https://symfony.com/doc/current/workflow/workflow-and-state-machine.html)
- [Quote statuses: Draft, Pending, Accepted, Rejected & Invoiced | Tool Time](https://support.tooltime.app/en/articles/6579342-quote-statuses-draft-pending-accepted-rejected-invoiced)
- [Designing a Workflow Engine Database Part 4: States and Transitions](https://exceptionnotfound.net/designing-a-workflow-engine-database-part-4-states-and-transitions/)
- [Using Workflow Patterns to Manage the State of Any Entity | Vertabelo](https://vertabelo.com/blog/the-workflow-pattern-part-1-using-workflow-patterns-to-manage-the-state-of-any-entity/)

### PDF Generation
- [A full comparison of 6 JS libraries for generating PDFs - DEV Community](https://dev.to/handdot/generate-a-pdf-in-js-summary-and-comparison-of-libraries-3k0p)
- [Popular Libraries 2025 for PDF Generation Using Node JS](https://pdfnoodle.com/blog/popular-libraries-2025-for-pdf-generation-using-node-js/)
- [Top JavaScript PDF generator libraries for 2025](https://www.nutrient.io/blog/top-js-pdf-libraries/)
- [Best HTML to PDF libraries for Node.js - LogRocket Blog](https://blog.logrocket.com/best-html-pdf-libraries-node-js/)
- [How to generate PDF invoices in Node.js using PDFKit](https://pspdfkit.com/blog/2019/generate-pdf-invoices-pdfkit-nodejs/)
- [@zed378/invoice-pdfkit - npm](https://www.npmjs.com/package/@zed378/invoice-pdfkit)
- [GitHub - baptistejamin/node-microinvoice](https://github.com/baptistejamin/node-microinvoice)
- [Generating Dynamic PDFs in Node.js using pdfkit | Medium](https://medium.com/@keyurbhimani2000/generating-dynamic-pdfs-in-node-js-using-pdfkit-cc82e649b1f5)

### Database Patterns
- [Automatically expire rows in Postgres - Schinckel.net](https://schinckel.net/2021/09/09/automatically-expire-rows-in-postgres/)
- [PostgreSQL Interval, Date, Timestamp and Time Data Types](https://www.enterprisedb.com/blog/postgresql-interval-date-timestamp-and-time-data-types)
- [PostgreSQL: Documentation: Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Working with Time in Postgres | Crunchy Data Blog](https://www.crunchydata.com/blog/working-with-time-in-postgres)

### Quote-to-Cash / Conversion Workflows
- [Quote-to-Invoice: A Complete Guide for Contractors](https://www.depositfix.com/blog/quote-to-invoice)
- [The Quote To Cash Process: Everything You Need To Know](https://staxpayments.com/blog/quote-to-cash/)
- [Mastering the Quote-to-Cash Process: Benefits & Challenges](https://conga.com/resources/blog/quote-to-cash-process-10-steps)
- [The Basics of the Quote-to-Cash Process | Salesforce US](https://www.salesforce.com/sales/cpq/quote-to-cash/)
- [SaaS Billing Best Practices for Smarter Revenue Management](https://billingplatform.com/blog/saas-billing-best-practices)
- [Quote-to-invoice automation in project workflows](https://workflowmax.com/blog/quote-to-invoice-automation-in-project-workflows)
- [The Complete Guide to SaaS Invoicing Software (2026)](https://www.zuora.com/guides/saas-invoicing-software/)

---

## Next Steps

1. **Review this discovery document** with stakeholders
2. **Create PLAN.md** for Phase 10 execution (based on findings above)
3. **Estimate effort** for each task (database, router, PDF service, testing)
4. **Prioritize features** (MVP vs. nice-to-have)
   - MVP: Basic CRUD, state machine, PDF generation, conversion
   - Future: Service templates, state history audit, multi-project conversion
5. **Begin implementation** following tRPC/Drizzle patterns established in invoice system

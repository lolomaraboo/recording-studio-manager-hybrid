/**
 * SYNC API — Phase M0 (macOS native app, offline-first sync)
 *
 * REST endpoints consumed by the native macOS client (tRPC has no Swift
 * client, so sync speaks plain JSON over HTTP). The web frontend keeps
 * using tRPC; both converge on the same tenant databases.
 *
 * Protocol (see .planning/macos-native/00-ARCHITECTURE-PLAN.md §4):
 *   POST /api/sync/pull  { cursor?, tables?, limit? }
 *     → { changes: [{ table, op: "upsert"|"delete", uuid, row? }], cursor, hasMore }
 *   POST /api/sync/push  { mutations: [{ table, op, uuid, payload?, baseVersion? }] }
 *     → { results: [{ uuid, status: "applied"|"conflict"|"not_found"|"error", serverRow?, serverVersion? }] }
 *
 * Conventions:
 *   - Payload/row keys are DB-native snake_case.
 *   - Conflict detection: UPDATE requires baseVersion === current sync_version
 *     (sync_version is bumped by DB trigger on every update).
 *   - DELETE is last-write-wins.
 *   - Change feed comes from sync_log (populated by DB triggers), so writes
 *     made through tRPC (web) are visible to Macs with zero router changes.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Application } from 'express';
import { sql } from 'drizzle-orm';
import { getTenantDb, getTenantSql, getMasterDb } from '@rsm/database/connection';
import type { TenantDb } from '../_core/context.js';

const router = Router();

// ----------------------------------------------------------------------------
// Realtime bridge: pg_notify('rsm_sync') → SSE (Mac app) + Socket.IO (web)
// One LISTEN connection per tenant, created lazily on first sync request.
// ----------------------------------------------------------------------------
const sseClients = new Map<number, Set<Response>>();
const listenedOrgs = new Set<number>();
let appRef: Application | null = null;

async function ensureRealtimeListener(orgId: number): Promise<void> {
  if (listenedOrgs.has(orgId)) return;
  listenedOrgs.add(orgId);
  try {
    const tenantSql = await getTenantSql(orgId);
    await tenantSql.listen('rsm_sync', (payload: string) => {
      // Native apps (SSE)
      const clients = sseClients.get(orgId);
      if (clients) {
        for (const res of clients) {
          try { res.write(`data: ${payload}\n\n`); } catch { /* client gone */ }
        }
      }
      // Web frontend (Socket.IO)
      const io = appRef?.get('io');
      if (io) {
        try { io.to(`org:${orgId}`).emit('sync:dirty', JSON.parse(payload)); } catch { /* ignore */ }
      }
    });
    console.log(`[Sync] Realtime listener active for org ${orgId}`);
  } catch (error) {
    listenedOrgs.delete(orgId);
    console.error(`[Sync] Failed to start realtime listener for org ${orgId}:`, error);
  }
}

/** Tables exposed to sync clients (must match sync-upgrade.sql) */
const SYNCED_TABLES = new Set([
  'clients', 'client_notes', 'client_contacts', 'company_members',
  'rooms', 'sessions', 'equipment', 'musicians',
  'projects', 'tracks', 'track_comments', 'track_credits',
  'quotes', 'quote_items', 'invoices', 'invoice_items', 'vat_rates', 'payments',
  'service_catalog', 'contracts', 'expenses', 'task_types', 'time_entries',
  'user_preferences',
  'session_staff', 'session_equipment', 'track_revisions', 'shares', 'session_talents',
  'leads', 'tasks', 'documents', 'availability', 'client_packages',
  'credit_notes', 'coupons', 'consumables', 'deliverables',
]);

/** Columns clients may never write directly */
const PROTECTED_COLUMNS = new Set(['id', 'sync_version', 'created_at']);

const MAX_PULL_LIMIT = 1000;
const MAX_PUSH_MUTATIONS = 500;

// ----------------------------------------------------------------------------
// Auth middleware (same dual mode as the rest of the server: dev test
// headers in development, express-session otherwise)
// ----------------------------------------------------------------------------
interface SyncRequest extends Request {
  syncUserId?: number;
  syncOrgId?: number;
}

function syncAuth(req: SyncRequest, res: Response, next: NextFunction) {
  const testUserId = req.headers['x-test-user-id'] as string | undefined;
  const testOrgId = req.headers['x-test-org-id'] as string | undefined;

  if (process.env.NODE_ENV === 'development' && testUserId && testOrgId) {
    req.syncUserId = parseInt(testUserId);
    req.syncOrgId = parseInt(testOrgId);
    return next();
  }

  const session = req.session as { userId?: number; organizationId?: number } | undefined;
  if (session?.userId && session?.organizationId) {
    req.syncUserId = session.userId;
    req.syncOrgId = session.organizationId;
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

router.use((req: SyncRequest, _res, next) => {
  if (!appRef) appRef = req.app;
  next();
});
router.use(syncAuth);
router.use((req: SyncRequest, _res, next) => {
  // Lazy realtime bridge per tenant (non-blocking)
  if (req.syncOrgId) void ensureRealtimeListener(req.syncOrgId);
  next();
});

// ----------------------------------------------------------------------------
// GET /api/sync/events — SSE stream notifying native clients of tenant writes
// ----------------------------------------------------------------------------
router.get('/events', (req: SyncRequest, res: Response) => {
  const orgId = req.syncOrgId!;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (!sseClients.has(orgId)) sseClients.set(orgId, new Set());
  sseClients.get(orgId)!.add(res);
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const keepAlive = setInterval(() => {
    try { res.write(`:keep-alive\n\n`); } catch { clearInterval(keepAlive); }
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.get(orgId)?.delete(res);
  });
});

// ----------------------------------------------------------------------------
// Column whitelist cache (per table, per tenant org) from information_schema
// ----------------------------------------------------------------------------
const columnCache = new Map<string, Map<string, string>>();

/** Returns a map of column name → Postgres data_type (e.g. "jsonb", "text"). */
async function getTableColumns(db: TenantDb, orgId: number, table: string): Promise<Map<string, string>> {
  const cacheKey = `${orgId}:${table}`;
  const cached = columnCache.get(cacheKey);
  if (cached) return cached;

  const result = await db.execute(sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table}
  `);
  const columns = new Map(
    (result as unknown as Array<{ column_name: string; data_type: string }>).map(r => [r.column_name, r.data_type])
  );
  columnCache.set(cacheKey, columns);
  return columns;
}

/**
 * Encode a payload value for SQL interpolation. Arrays/objects bound for JSON or
 * JSONB columns are stringified and cast (so the Mac app can write `genres`,
 * `instruments`, `websites`, etc.); text columns that store stringified JSON
 * (legacy `musicians.instruments/genres`) get the JSON string as-is. Scalars
 * pass through unchanged.
 */
function encodeVal(dataType: string | undefined, value: unknown) {
  if (value !== null && value !== undefined && typeof value === 'object') {
    const json = JSON.stringify(value);
    return (dataType === 'jsonb' || dataType === 'json') ? sql`${json}::${sql.raw(dataType)}` : sql`${json}`;
  }
  return sql`${value ?? null}`;
}

function validTables(tables: unknown): string[] {
  if (!Array.isArray(tables) || tables.length === 0) return [...SYNCED_TABLES];
  return tables.filter((t): t is string => typeof t === 'string' && SYNCED_TABLES.has(t));
}

// ----------------------------------------------------------------------------
// POST /api/sync/pull
// ----------------------------------------------------------------------------
router.post('/pull', async (req: SyncRequest, res: Response) => {
  try {
    const db = await getTenantDb(req.syncOrgId!);
    const cursor = Number(req.body?.cursor) || 0;
    const limit = Math.min(Number(req.body?.limit) || MAX_PULL_LIMIT, MAX_PULL_LIMIT);
    const tables = validTables(req.body?.tables);

    // Bootstrap: cursor 0 = full snapshot (rows created BEFORE the sync
    // upgrade have no sync_log entries and would otherwise never be pulled).
    if (cursor === 0) {
      const changes: Array<{ table: string; op: 'upsert'; uuid: string; row: Record<string, unknown> }> = [];
      for (const table of tables) {
        const rows = (await db.execute(
          sql`SELECT * FROM ${sql.identifier(table)}`
        )) as unknown as Array<Record<string, unknown>>;
        for (const row of rows) {
          const uuid = row.sync_uuid as string | undefined;
          if (uuid) changes.push({ table, op: 'upsert', uuid, row });
        }
      }
      const maxId = (await db.execute(
        sql`SELECT COALESCE(MAX(id), 0) AS max_id FROM sync_log`
      )) as unknown as Array<{ max_id: number | string }>;
      return res.json({ changes, cursor: Number(maxId[0]?.max_id ?? 0), hasMore: false });
    }

    const tableList = sql.join(tables.map((t) => sql`${t}`), sql.raw(', '));
    const logEntries = (await db.execute(sql`
      SELECT id, table_name, row_uuid, op
      FROM sync_log
      WHERE id > ${cursor} AND table_name IN (${tableList})
      ORDER BY id ASC
      LIMIT ${limit + 1}
    `)) as unknown as Array<{ id: number; table_name: string; row_uuid: string; op: string }>;

    const hasMore = logEntries.length > limit;
    const page = hasMore ? logEntries.slice(0, limit) : logEntries;
    const newCursor = page.length > 0 ? Number(page[page.length - 1]!.id) : cursor;

    // Collapse to one change per (table, uuid): a later DELETE wins,
    // insert/update both become "upsert" of the row's CURRENT state.
    const latest = new Map<string, { table: string; uuid: string; op: string }>();
    for (const entry of page) {
      latest.set(`${entry.table_name}:${entry.row_uuid}`, {
        table: entry.table_name,
        uuid: entry.row_uuid,
        op: entry.op,
      });
    }

    // Fetch current rows grouped by table
    const uuidsByTable = new Map<string, string[]>();
    for (const change of latest.values()) {
      if (change.op !== 'delete') {
        const list = uuidsByTable.get(change.table) ?? [];
        list.push(change.uuid);
        uuidsByTable.set(change.table, list);
      }
    }

    const rowsByKey = new Map<string, Record<string, unknown>>();
    for (const [table, uuids] of uuidsByTable) {
      const uuidList = sql.join(uuids.map((u) => sql`${u}::uuid`), sql.raw(', '));
      const rows = (await db.execute(sql`
        SELECT * FROM ${sql.identifier(table)} WHERE sync_uuid IN (${uuidList})
      `)) as unknown as Array<Record<string, unknown>>;
      for (const row of rows) {
        rowsByKey.set(`${table}:${row.sync_uuid}`, row);
      }
    }

    const changes = [...latest.values()].map((change) => {
      if (change.op === 'delete') {
        return { table: change.table, op: 'delete' as const, uuid: change.uuid };
      }
      const row = rowsByKey.get(`${change.table}:${change.uuid}`);
      // Row inserted then deleted within the same window: emit a delete
      if (!row) {
        return { table: change.table, op: 'delete' as const, uuid: change.uuid };
      }
      return { table: change.table, op: 'upsert' as const, uuid: change.uuid, row };
    });

    res.json({ changes, cursor: newCursor, hasMore });
  } catch (error) {
    console.error('[Sync] pull failed:', error);
    res.status(500).json({ error: 'Sync pull failed' });
  }
});

// ----------------------------------------------------------------------------
// POST /api/sync/push
// ----------------------------------------------------------------------------
interface PushMutation {
  table: string;
  op: 'insert' | 'update' | 'delete';
  uuid: string;
  payload?: Record<string, unknown>;
  baseVersion?: number;
}

type PushResult =
  | { uuid: string; status: 'applied'; serverVersion?: number }
  | { uuid: string; status: 'conflict'; serverVersion: number; serverRow: Record<string, unknown> }
  | { uuid: string; status: 'not_found' }
  | { uuid: string; status: 'error'; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post('/push', async (req: SyncRequest, res: Response) => {
  try {
    const db = await getTenantDb(req.syncOrgId!);
    const mutations: PushMutation[] = Array.isArray(req.body?.mutations) ? req.body.mutations : [];

    if (mutations.length === 0) {
      return res.status(400).json({ error: 'No mutations provided' });
    }
    if (mutations.length > MAX_PUSH_MUTATIONS) {
      return res.status(400).json({ error: `Too many mutations (max ${MAX_PUSH_MUTATIONS})` });
    }

    const results: PushResult[] = [];
    const touchedTables = new Set<string>();

    for (const mutation of mutations) {
      const { table, op, uuid } = mutation;

      if (!SYNCED_TABLES.has(table) || !UUID_RE.test(uuid ?? '')) {
        results.push({ uuid: uuid ?? 'invalid', status: 'error', message: 'Invalid table or uuid' });
        continue;
      }

      try {
        const columns = await getTableColumns(db, req.syncOrgId!, table);
        const payload = Object.fromEntries(
          Object.entries(mutation.payload ?? {}).filter(
            ([key]) => columns.has(key) && !PROTECTED_COLUMNS.has(key) && key !== 'sync_uuid'
          )
        );

        if (op === 'insert') {
          const keys = Object.keys(payload);
          const insertCols = sql.join(
            [sql.identifier('sync_uuid'), ...keys.map((k) => sql.identifier(k))],
            sql.raw(', ')
          );
          const insertVals = sql.join(
            [sql`${uuid}`, ...keys.map((k) => encodeVal(columns.get(k), payload[k]))],
            sql.raw(', ')
          );
          // ON CONFLICT DO NOTHING → idempotent retries after network failures
          const inserted = (await db.execute(sql`
            INSERT INTO ${sql.identifier(table)} (${insertCols})
            VALUES (${insertVals})
            ON CONFLICT (sync_uuid) DO NOTHING
            RETURNING sync_version
          `)) as unknown as Array<{ sync_version: number }>;
          results.push({ uuid, status: 'applied', serverVersion: inserted[0]?.sync_version ?? 1 });
          touchedTables.add(table);
        } else if (op === 'update') {
          const keys = Object.keys(payload);
          if (keys.length === 0) {
            results.push({ uuid, status: 'error', message: 'Empty payload' });
            continue;
          }
          const baseVersion = Number(mutation.baseVersion);
          if (!Number.isInteger(baseVersion)) {
            results.push({ uuid, status: 'error', message: 'baseVersion required for update' });
            continue;
          }
          const assignments = sql.join(
            keys.map((k) => sql`${sql.identifier(k)} = ${encodeVal(columns.get(k), payload[k])}`),
            sql.raw(', ')
          );
          const updated = (await db.execute(sql`
            UPDATE ${sql.identifier(table)}
            SET ${assignments}
            WHERE sync_uuid = ${uuid} AND sync_version = ${baseVersion}
            RETURNING sync_version
          `)) as unknown as Array<{ sync_version: number }>;

          if (updated.length > 0) {
            results.push({ uuid, status: 'applied', serverVersion: updated[0]!.sync_version });
            touchedTables.add(table);
          } else {
            // Stale baseVersion (conflict) or row deleted on server (not_found)
            const current = (await db.execute(sql`
              SELECT * FROM ${sql.identifier(table)} WHERE sync_uuid = ${uuid}
            `)) as unknown as Array<Record<string, unknown>>;
            if (current.length === 0) {
              results.push({ uuid, status: 'not_found' });
            } else {
              results.push({
                uuid,
                status: 'conflict',
                serverVersion: Number(current[0]!.sync_version),
                serverRow: current[0]!,
              });
            }
          }
        } else if (op === 'delete') {
          // Last-write-wins: deletion always applies (idempotent)
          await db.execute(sql`
            DELETE FROM ${sql.identifier(table)} WHERE sync_uuid = ${uuid}
          `);
          results.push({ uuid, status: 'applied' });
          touchedTables.add(table);
        } else {
          results.push({ uuid, status: 'error', message: `Unknown op: ${op}` });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Sync] push mutation failed (${table}/${uuid}):`, message);
        results.push({ uuid, status: 'error', message });
      }
    }

    // Room-overlap validation (architecture plan §4.4): a pushed session that
    // collides with another active session in the same room flips to 'conflict'
    // — the trigger logs the change, every device pulls the new status.
    const sessionUuids = mutations
      .filter((m) => m.table === 'sessions' && m.op !== 'delete' && UUID_RE.test(m.uuid ?? ''))
      .map((m) => m.uuid);
    const roomConflicts: string[] = [];
    for (const uuid of sessionUuids) {
      try {
        const flipped = (await db.execute(sql`
          UPDATE sessions SET status = 'conflict'
          WHERE sync_uuid = ${uuid}
            AND status = 'scheduled'
            AND room_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM sessions other
              WHERE other.room_id = sessions.room_id
                AND other.id <> sessions.id
                AND other.status IN ('scheduled', 'in_progress')
                AND other.start_time < sessions.end_time
                AND sessions.start_time < other.end_time
            )
          RETURNING id
        `)) as unknown as Array<{ id: number }>;
        if (flipped.length > 0) roomConflicts.push(uuid);
      } catch (error) {
        console.error(`[Sync] room conflict check failed for ${uuid}:`, error);
      }
    }

    // Staff/talent availability conflicts: a scheduled session collides with a
    // booked person's declared unavailability window → flip to 'conflict'.
    for (const uuid of sessionUuids) {
      try {
        await db.execute(sql`
          UPDATE sessions SET status = 'conflict'
          WHERE sync_uuid = ${uuid}
            AND status = 'scheduled'
            AND EXISTS (
              SELECT 1 FROM session_staff ss
              JOIN availability av ON av.subject_type = 'staff' AND av.subject_id = ss.user_id
              WHERE ss.session_id = sessions.id
                AND av.start_time < sessions.end_time AND sessions.start_time < av.end_time
              UNION ALL
              SELECT 1 FROM session_talents st
              JOIN availability av ON av.subject_type = 'talent' AND av.subject_id = st.musician_id
              WHERE st.session_id = sessions.id
                AND av.start_time < sessions.end_time AND sessions.start_time < av.end_time
            )
        `);
      } catch (error) {
        console.error(`[Sync] availability conflict check failed for ${uuid}:`, error);
      }
    }

    // Notify the other devices of this organization (web + Macs)
    if (touchedTables.size > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(`org:${req.syncOrgId}`).emit('sync:dirty', { tables: [...touchedTables] });
      }
    }

    res.json({ results, roomConflicts });
  } catch (error) {
    console.error('[Sync] push failed:', error);
    res.status(500).json({ error: 'Sync push failed' });
  }
});

// ----------------------------------------------------------------------------
// GET /api/sync/members — organization members (master DB) for staff assignment
// ----------------------------------------------------------------------------
router.get('/members', async (req: SyncRequest, res: Response) => {
  try {
    const masterDb = await getMasterDb();
    const members = (await masterDb.execute(sql`
      SELECT u.id, u.name, u.email, 'owner' AS role
      FROM organizations o JOIN users u ON u.id = o.owner_id
      WHERE o.id = ${req.syncOrgId}
      UNION
      SELECT u.id, u.name, u.email, om.role
      FROM organization_members om JOIN users u ON u.id = om.user_id
      WHERE om.organization_id = ${req.syncOrgId}
    `)) as unknown as Array<{ id: number; name: string; email: string; role: string }>;
    res.json({ members });
  } catch (error) {
    console.error('[Sync] members failed:', error);
    res.status(500).json({ error: 'Members fetch failed' });
  }
});

// ----------------------------------------------------------------------------
// POST /api/sync/create-invoice — online-only invoice creation with
// SERVER-side numbering (offline numbering is unsafe, plan §4.4).
// Devices receive the new rows through the normal pull (triggers log them).
// ----------------------------------------------------------------------------
router.post('/create-invoice', async (req: SyncRequest, res: Response) => {
  try {
    const db = await getTenantDb(req.syncOrgId!);
    const clientId = Number(req.body?.clientId);
    const taxRate = Number(req.body?.taxRate ?? 20);
    const projectIdRaw = Number(req.body?.projectId);
    const projectId = Number.isInteger(projectIdRaw) && projectIdRaw > 0 ? projectIdRaw : null;
    const items: Array<{ description?: string; quantity?: number; unitPrice?: number }> =
      Array.isArray(req.body?.items) ? req.body.items : [];

    if (!Number.isInteger(clientId) || items.length === 0) {
      return res.status(400).json({ error: 'clientId and items are required' });
    }

    const cleanItems = items
      .map((item) => ({
        description: String(item.description ?? '').slice(0, 500),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      }))
      .filter((item) => item.description.length > 0);
    if (cleanItems.length === 0) {
      return res.status(400).json({ error: 'No valid items' });
    }

    // --- Forfait (prepaid package) auto-deduction ---------------------------
    // Opt-in: when the caller passes `packageHours`, draw those hours from the
    // client's active prepaid package and add a negative line so the prepaid
    // portion is not billed twice. Package usage & status are updated below.
    const packageHoursRequested = Number(req.body?.packageHours) || 0;
    let packageDeduction: { packageId: number; hoursUsed: number; newUsed: number; total: number } | null = null;
    if (packageHoursRequested > 0) {
      const pkgRows = (await db.execute(sql`
        SELECT id, total_hours, used_hours, price
        FROM client_packages
        WHERE client_id = ${clientId} AND status = 'active'
        ORDER BY created_at ASC LIMIT 1
      `)) as unknown as Array<{ id: number; total_hours: string | null; used_hours: string; price: string | null }>;
      const pkg = pkgRows[0];
      if (pkg && pkg.total_hours != null) {
        const totalHours = Number(pkg.total_hours);
        const usedHours = Number(pkg.used_hours) || 0;
        const remaining = Math.max(0, totalHours - usedHours);
        const hoursUsed = Math.min(packageHoursRequested, remaining);
        if (hoursUsed > 0) {
          const rate = pkg.price != null && totalHours > 0 ? Number(pkg.price) / totalHours : 0;
          const discount = Math.round(hoursUsed * rate * 100) / 100;
          if (discount > 0) {
            cleanItems.push({
              description: `Forfait prépayé (${hoursUsed} h)`,
              quantity: 1,
              unitPrice: -discount,
            });
          }
          packageDeduction = { packageId: pkg.id, hoursUsed, newUsed: usedHours + hoursUsed, total: totalHours };
        }
      }
    }

    const subtotal = cleanItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Server-side sequential numbering: FAC-YYYY-NNNN
    const year = new Date().getFullYear();
    const prefix = `FAC-${year}-`;
    const last = (await db.execute(sql`
      SELECT invoice_number FROM invoices
      WHERE invoice_number LIKE ${prefix + '%'}
      ORDER BY invoice_number DESC LIMIT 1
    `)) as unknown as Array<{ invoice_number: string }>;
    const lastSeq = last[0] ? parseInt(last[0].invoice_number.slice(prefix.length), 10) || 0 : 0;
    const invoiceNumber = `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;

    const inserted = (await db.execute(sql`
      INSERT INTO invoices (invoice_number, client_id, project_id, due_date, status, subtotal, tax_rate, tax_amount, total)
      VALUES (${invoiceNumber}, ${clientId}, ${projectId}, NOW() + INTERVAL '30 days', 'draft',
              ${subtotal.toFixed(2)}, ${taxRate.toFixed(2)}, ${taxAmount.toFixed(2)}, ${total.toFixed(2)})
      RETURNING id, invoice_number
    `)) as unknown as Array<{ id: number; invoice_number: string }>;
    const invoiceId = inserted[0]!.id;

    for (const item of cleanItems) {
      await db.execute(sql`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
        VALUES (${invoiceId}, ${item.description}, ${item.quantity},
                ${item.unitPrice.toFixed(2)}, ${(item.quantity * item.unitPrice).toFixed(2)})
      `);
    }

    // Apply the prepaid-package draw-down now that the invoice exists.
    if (packageDeduction) {
      const consumed = packageDeduction.newUsed >= packageDeduction.total;
      await db.execute(sql`
        UPDATE client_packages
        SET used_hours = ${packageDeduction.newUsed.toFixed(2)},
            status = ${consumed ? 'consumed' : 'active'},
            updated_at = NOW()
        WHERE id = ${packageDeduction.packageId}
      `);
    }

    res.json({
      invoiceId,
      invoiceNumber,
      packageDeduction: packageDeduction
        ? { hoursUsed: packageDeduction.hoursUsed, remaining: packageDeduction.total - packageDeduction.newUsed }
        : null,
    });
  } catch (error) {
    console.error('[Sync] create-invoice failed:', error);
    res.status(500).json({ error: 'Invoice creation failed' });
  }
});

// ----------------------------------------------------------------------------
// POST /api/sync/create-credit-note — online-only credit note (avoir) with
// server-side numbering AV-YYYY-NNNN.
// ----------------------------------------------------------------------------
router.post('/create-credit-note', async (req: SyncRequest, res: Response) => {
  try {
    const db = await getTenantDb(req.syncOrgId!);
    const clientId = Number(req.body?.clientId);
    const amount = Number(req.body?.amount);
    const invoiceIdRaw = Number(req.body?.invoiceId);
    const invoiceId = Number.isInteger(invoiceIdRaw) && invoiceIdRaw > 0 ? invoiceIdRaw : null;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 500) : null;
    if (!Number.isInteger(clientId) || !(amount > 0)) {
      return res.status(400).json({ error: 'clientId and positive amount are required' });
    }
    const year = new Date().getFullYear();
    const prefix = `AV-${year}-`;
    const last = (await db.execute(sql`
      SELECT credit_note_number FROM credit_notes
      WHERE credit_note_number LIKE ${prefix + '%'}
      ORDER BY credit_note_number DESC LIMIT 1
    `)) as unknown as Array<{ credit_note_number: string }>;
    const lastSeq = last[0] ? parseInt(last[0].credit_note_number.slice(prefix.length), 10) || 0 : 0;
    const number = `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
    await db.execute(sql`
      INSERT INTO credit_notes (credit_note_number, client_id, invoice_id, amount, reason, status)
      VALUES (${number}, ${clientId}, ${invoiceId}, ${amount.toFixed(2)}, ${reason}, 'issued')
    `);
    res.json({ creditNoteNumber: number });
  } catch (error) {
    console.error('[Sync] create-credit-note failed:', error);
    res.status(500).json({ error: 'Credit note creation failed' });
  }
});

// ----------------------------------------------------------------------------
// POST /api/sync/create-quote — online-only quote creation, server numbering
// DEV-YYYY-NNNN (mirror of create-invoice).
// ----------------------------------------------------------------------------
router.post('/create-quote', async (req: SyncRequest, res: Response) => {
  try {
    const db = await getTenantDb(req.syncOrgId!);
    const clientId = Number(req.body?.clientId);
    const taxRate = Number(req.body?.taxRate ?? 20);
    const validityDays = Number(req.body?.validityDays ?? 30);
    const items: Array<{ description?: string; quantity?: number; unitPrice?: number }> =
      Array.isArray(req.body?.items) ? req.body.items : [];

    if (!Number.isInteger(clientId) || items.length === 0) {
      return res.status(400).json({ error: 'clientId and items are required' });
    }

    const cleanItems = items
      .map((item) => ({
        description: String(item.description ?? '').slice(0, 500),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      }))
      .filter((item) => item.description.length > 0);
    if (cleanItems.length === 0) {
      return res.status(400).json({ error: 'No valid items' });
    }

    const subtotal = cleanItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const year = new Date().getFullYear();
    const prefix = `DEV-${year}-`;
    const last = (await db.execute(sql`
      SELECT quote_number FROM quotes
      WHERE quote_number LIKE ${prefix + '%'}
      ORDER BY quote_number DESC LIMIT 1
    `)) as unknown as Array<{ quote_number: string }>;
    const lastSeq = last[0] ? parseInt(last[0].quote_number.slice(prefix.length), 10) || 0 : 0;
    const quoteNumber = `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;

    const inserted = (await db.execute(sql`
      INSERT INTO quotes (quote_number, client_id, status, subtotal, tax_rate, tax_amount, total, validity_days)
      VALUES (${quoteNumber}, ${clientId}, 'draft', ${subtotal.toFixed(2)}, ${taxRate.toFixed(2)},
              ${taxAmount.toFixed(2)}, ${total.toFixed(2)}, ${validityDays})
      RETURNING id, quote_number
    `)) as unknown as Array<{ id: number; quote_number: string }>;
    const quoteId = inserted[0]!.id;

    let order = 0;
    for (const item of cleanItems) {
      await db.execute(sql`
        INSERT INTO quote_items (quote_id, description, quantity, unit_price, amount, display_order)
        VALUES (${quoteId}, ${item.description}, ${item.quantity},
                ${item.unitPrice.toFixed(2)}, ${(item.quantity * item.unitPrice).toFixed(2)}, ${order++})
      `);
    }

    res.json({ quoteId, quoteNumber });
  } catch (error) {
    console.error('[Sync] create-quote failed:', error);
    res.status(500).json({ error: 'Quote creation failed' });
  }
});

// ----------------------------------------------------------------------------
// POST /api/sync/invoice-from-time — online-only invoice generation from time
// entries (Clockify-style billing). Body: { timeEntryUuids: string[],
// clientId: number, taxRate?, notes? }. Entries are grouped by task type,
// non-billable types are excluded, already-invoiced entries are rejected, and
// the entries are marked with invoice_id atomically (no double billing).
// Devices receive the updated rows through the normal pull.
// ----------------------------------------------------------------------------
router.post('/invoice-from-time', async (req: SyncRequest, res: Response) => {
  try {
    const db = await getTenantDb(req.syncOrgId!);
    const clientId = Number(req.body?.clientId);
    const taxRate = req.body?.taxRate != null ? Number(req.body.taxRate) : undefined;
    const notes = typeof req.body?.notes === 'string' ? req.body.notes : undefined;
    const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const uuids: string[] = Array.isArray(req.body?.timeEntryUuids)
      ? req.body.timeEntryUuids.filter((u: unknown): u is string => typeof u === 'string' && uuidRe.test(u))
      : [];

    if (!Number.isInteger(clientId) || uuids.length === 0) {
      return res.status(400).json({ error: 'clientId and timeEntryUuids are required' });
    }

    // Resolve sync uuids (device identity) to server ids
    const uuidList = sql.join(uuids.map((u) => sql`${u}::uuid`), sql`, `);
    const rows = (await db.execute(sql`
      SELECT id FROM time_entries WHERE sync_uuid IN (${uuidList})
    `)) as unknown as Array<{ id: number }>;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No time entries found for provided uuids' });
    }

    const { generateInvoiceFromTimeEntries } = await import('../utils/invoice-generator');
    const result = await generateInvoiceFromTimeEntries(db, {
      timeEntryIds: rows.map((r) => r.id),
      clientId,
      mode: 'project',
      taxRate,
      notes,
    });

    res.json({
      invoiceId: result.invoice.id,
      invoiceNumber: result.invoice.invoiceNumber,
      total: result.invoice.total,
      itemCount: result.items.length,
    });
  } catch (error: any) {
    console.error('[Sync] invoice-from-time failed:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Invoice generation failed';
    // TRPCError BAD_REQUEST/NOT_FOUND from the generator → 400 with the reason
    const status = error?.code === 'BAD_REQUEST' || error?.code === 'NOT_FOUND' ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

export default router;

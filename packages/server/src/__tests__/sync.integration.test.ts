/**
 * SYNC API integration tests (Phase M0)
 *
 * Runs against a LIVE dev server + tenant database:
 *   1. Apply the upgrade:  pnpm --filter database tsx src/scripts/apply-sync-upgrade.ts tenant_16
 *   2. Start the server:   ./start.sh
 *   3. Run:                SYNC_TEST_ORG_ID=16 pnpm --filter server test sync.integration
 *
 * Skipped automatically when SYNC_TEST_ORG_ID is not set (CI without DB).
 */
import { describe, it, expect } from 'vitest';

const ORG_ID = process.env.SYNC_TEST_ORG_ID;
const USER_ID = process.env.SYNC_TEST_USER_ID || '1';
const BASE_URL = process.env.SYNC_TEST_BASE_URL || 'http://localhost:3001';

const HEADERS = {
  'Content-Type': 'application/json',
  'x-test-user-id': USER_ID,
  'x-test-org-id': ORG_ID ?? '',
};

async function call(path: string, body: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE_URL}/api/sync/${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

describe.skipIf(!ORG_ID)('Sync API (live server)', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await fetch(`${BASE_URL}/api/sync/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursor: 0 }),
    });
    expect(res.status).toBe(401);
  });

  it('pull from cursor 0 returns changes and a cursor', async () => {
    const { status, json } = await call('pull', { cursor: 0, tables: ['clients'] });
    expect(status).toBe(200);
    expect(Array.isArray(json.changes)).toBe(true);
    expect(typeof json.cursor).toBe('number');
    expect(typeof json.hasMore).toBe('boolean');
  });

  it('push insert → pull sees the row → push update with stale version conflicts', async () => {
    const uuid = crypto.randomUUID();

    // 1. Insert a client from a "Mac device"
    const ins = await call('push', {
      mutations: [{ table: 'clients', op: 'insert', uuid, payload: { name: 'Sync Test Client' } }],
    });
    expect(ins.status).toBe(200);
    expect(ins.json.results[0].status).toBe('applied');

    // 2. Pull must surface it as an upsert
    const pull = await call('pull', { cursor: 0, tables: ['clients'] });
    const change = pull.json.changes.find((c: any) => c.uuid === uuid);
    expect(change?.op).toBe('upsert');
    expect(change?.row?.name).toBe('Sync Test Client');
    const serverVersion = change?.row?.sync_version;

    // 3. Update with correct baseVersion applies (trigger bumps version)
    const upd = await call('push', {
      mutations: [{ table: 'clients', op: 'update', uuid, baseVersion: serverVersion, payload: { name: 'Sync Test Client v2' } }],
    });
    expect(upd.json.results[0].status).toBe('applied');
    expect(upd.json.results[0].serverVersion).toBe(serverVersion + 1);

    // 4. Update with STALE baseVersion conflicts and returns the server row
    const stale = await call('push', {
      mutations: [{ table: 'clients', op: 'update', uuid, baseVersion: serverVersion, payload: { name: 'Lost Writer' } }],
    });
    expect(stale.json.results[0].status).toBe('conflict');
    expect(stale.json.results[0].serverRow.name).toBe('Sync Test Client v2');

    // 5. Idempotent insert retry is a no-op, not an error
    const retry = await call('push', {
      mutations: [{ table: 'clients', op: 'insert', uuid, payload: { name: 'Dup' } }],
    });
    expect(retry.json.results[0].status).toBe('applied');

    // 6. Cleanup: delete (LWW) + tombstone visible in pull
    const del = await call('push', {
      mutations: [{ table: 'clients', op: 'delete', uuid }],
    });
    expect(del.json.results[0].status).toBe('applied');

    const pull2 = await call('pull', { cursor: pull.json.cursor, tables: ['clients'] });
    const tomb = pull2.json.changes.find((c: any) => c.uuid === uuid);
    expect(tomb?.op).toBe('delete');
  });

  it('rejects non-synced tables and protected columns are stripped', async () => {
    const bad = await call('push', {
      mutations: [{ table: 'stripe_webhook_events', op: 'insert', uuid: crypto.randomUUID(), payload: {} }],
    });
    expect(bad.json.results[0].status).toBe('error');

    // id / sync_version in payload must be ignored, not applied
    const uuid = crypto.randomUUID();
    const ins = await call('push', {
      mutations: [{ table: 'clients', op: 'insert', uuid, payload: { name: 'Protected', id: 999999, sync_version: 42 } }],
    });
    expect(ins.json.results[0].status).toBe('applied');
    expect(ins.json.results[0].serverVersion).toBe(1); // not 42

    await call('push', { mutations: [{ table: 'clients', op: 'delete', uuid }] });
  });
});

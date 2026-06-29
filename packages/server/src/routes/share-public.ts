/**
 * Public share pages — NO AUTH.
 *
 * A share link encodes the tenant org id and a random token:
 *   GET /api/share/:orgId/:token
 *
 * Database-per-tenant means there is no global token index, so the org id is
 * part of the URL. The endpoint resolves the tenant DB, validates the share
 * (status / expiry / access cap), increments the access counter, and renders a
 * minimal HTML page with an <audio> player for each available version.
 */
import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { getTenantDb } from '@rsm/database/connection';

const router = Router();

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

function page(title: string, inner: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${esc(title)}</title><style>` +
    `body{font-family:-apple-system,system-ui,Segoe UI,sans-serif;max-width:680px;margin:40px auto;padding:0 16px;color:#111}` +
    `h1{font-size:1.4rem;margin-bottom:4px}.row{margin:16px 0;padding:12px;border:1px solid #eee;border-radius:10px}` +
    `.lbl{font-weight:600;margin-bottom:6px}audio{width:100%}footer{margin-top:32px;color:#888;font-size:.8rem}` +
    `</style></head><body>${inner}<footer>Partagé via RSM Studio</footer></body></html>`;
}

router.get('/:orgId/:token', async (req, res) => {
  try {
    const orgId = Number(req.params.orgId);
    const token = String(req.params.token);
    if (!Number.isInteger(orgId) || !/^[A-Za-z0-9_-]{8,64}$/.test(token)) {
      return res.status(400).type('html').send(page('Lien invalide', '<h1>Lien invalide</h1>'));
    }

    const db = await getTenantDb(orgId);
    const rows = (await db.execute(sql`
      SELECT * FROM shares WHERE share_token = ${token} LIMIT 1
    `)) as unknown as Array<Record<string, any>>;
    const share = rows[0];

    if (!share || share.status !== 'active') {
      return res.status(404).type('html').send(page('Lien introuvable', '<h1>Lien introuvable ou révoqué</h1>'));
    }
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).type('html').send(page('Lien expiré', '<h1>Ce lien a expiré</h1>'));
    }
    if (share.max_access != null && Number(share.access_count) >= Number(share.max_access)) {
      return res.status(410).type('html').send(page('Limite atteinte', "<h1>Limite d'accès atteinte</h1>"));
    }

    await db.execute(sql`UPDATE shares SET access_count = access_count + 1 WHERE id = ${share.id}`);

    let title = 'Partage RSM Studio';
    const players: Array<{ label: string; url: string }> = [];

    if (share.track_id) {
      const t = (await db.execute(sql`SELECT * FROM tracks WHERE id = ${share.track_id} LIMIT 1`)) as unknown as Array<Record<string, any>>;
      const track = t[0];
      if (track) {
        title = track.title ?? title;
        for (const [label, col] of [['Démo', 'demo_url'], ['Rough mix', 'rough_mix_url'], ['Mix final', 'final_mix_url'], ['Master', 'master_url']] as const) {
          if (track[col]) players.push({ label, url: track[col] });
        }
      }
    } else if (share.project_id) {
      const p = (await db.execute(sql`SELECT * FROM projects WHERE id = ${share.project_id} LIMIT 1`)) as unknown as Array<Record<string, any>>;
      const project = p[0];
      if (project) {
        title = project.name ?? title;
        const tracks = (await db.execute(sql`SELECT * FROM tracks WHERE project_id = ${share.project_id} ORDER BY track_number`)) as unknown as Array<Record<string, any>>;
        for (const track of tracks) {
          const url = track.master_url || track.final_mix_url || track.rough_mix_url || track.demo_url;
          if (url) players.push({ label: track.title ?? 'Track', url });
        }
      }
    }

    const inner = `<h1>${esc(title)}</h1>` + (players.length
      ? players.map((pl) => `<div class="row"><div class="lbl">${esc(pl.label)}</div><audio controls preload="none" src="${esc(pl.url)}"></audio></div>`).join('')
      : '<p>Aucun fichier audio disponible pour ce partage.</p>');

    res.status(200).type('html').send(page(title, inner));
  } catch (error) {
    console.error('[Share] public access failed:', error);
    res.status(500).type('html').send(page('Erreur', '<h1>Erreur serveur</h1>'));
  }
});

export default router;

/**
 * Apply the M0 sync upgrade (sync-upgrade.sql) to a tenant database.
 *
 * Usage:
 *   pnpm --filter database tsx src/scripts/apply-sync-upgrade.ts tenant_16
 *   pnpm --filter database tsx src/scripts/apply-sync-upgrade.ts --all
 *
 * Idempotent: safe to re-run on any tenant.
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_PATH = join(__dirname, "../tenant/sync-upgrade.sql");

const MASTER_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/rsm_master";

function tenantUrl(dbName: string): string {
  const parsed = new URL(MASTER_URL);
  return `postgresql://${parsed.username}:${parsed.password}@${parsed.hostname}:${parsed.port || 5432}/${dbName}`;
}

async function applyTo(dbName: string): Promise<void> {
  const sql = postgres(tenantUrl(dbName), { max: 1 });
  try {
    console.log(`🔧 Applying sync upgrade to ${dbName}...`);
    const upgrade = readFileSync(SQL_PATH, "utf-8");
    await sql.unsafe(upgrade);
    console.log(`✅ Sync upgrade applied to ${dbName}`);
  } finally {
    await sql.end();
  }
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: apply-sync-upgrade.ts <tenant_db_name> | --all");
    process.exit(1);
  }

  if (arg === "--all") {
    const master = postgres(MASTER_URL, { max: 1 });
    try {
      const rows = await master`SELECT database_name FROM tenant_databases`;
      for (const row of rows) {
        await applyTo(row.database_name as string);
      }
    } finally {
      await master.end();
    }
  } else {
    await applyTo(arg);
  }
}

main().catch((err) => {
  console.error("❌ Sync upgrade failed:", err);
  process.exit(1);
});

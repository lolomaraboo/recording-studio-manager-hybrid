import { sql } from "drizzle-orm";
import { getMasterDb, getTenantDb } from "../connection.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyTrackIdMigration() {
  console.log("📦 Applying track_id migration to all tenant databases...\n");

  const masterDb = await getMasterDb();

  // Get all tenant databases
  const tenantDatabases = await masterDb.query.tenantDatabases.findMany();

  if (tenantDatabases.length === 0) {
    console.log("⚠️  No tenant databases found");
    return;
  }

  console.log(`Found ${tenantDatabases.length} tenant database(s)\n`);

  // Read migration SQL
  const migrationPath = path.join(
    __dirname,
    "../../drizzle/migrations/tenant/0007_add_track_id_to_time_entries.sql"
  );
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  // Apply to each tenant database
  for (const tenantDb of tenantDatabases) {
    try {
      console.log(`📊 Applying to: ${tenantDb.databaseName} (org ${tenantDb.organizationId})`);

      const db = await getTenantDb(tenantDb.organizationId);

      // Execute migration
      await db.execute(sql.raw(migrationSQL));

      console.log(`✅ Success: ${tenantDb.databaseName}\n`);
    } catch (error: any) {
      // Check if column already exists
      if (error.message?.includes("already exists")) {
        console.log(`ℹ️  Migration already applied to ${tenantDb.databaseName}\n`);
      } else {
        console.error(`❌ Error applying to ${tenantDb.databaseName}:`, error.message);
        throw error;
      }
    }
  }

  console.log("✅ Migration complete!");
  process.exit(0);
}

applyTrackIdMigration().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});

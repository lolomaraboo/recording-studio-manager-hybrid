/**
 * DATABASE CONNECTION MANAGER
 *
 * Manages Master DB and Tenant DB connections with PostgreSQL
 * Architecture: Database-per-Tenant (ACTIVE from day 1)
 *
 * ⚠️ IMPORTANT: Unlike Manus, this is NOT commented out!
 * Database-per-Tenant is active and enforced from the start.
 */

import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as masterSchema from "./master/schema";
import * as tenantSchema from "./tenant/schema";
import { eq } from "drizzle-orm";

/**
 * Types for Master DB and Tenant DB
 */
export type MasterDb = PostgresJsDatabase<typeof masterSchema>;
export type TenantDb = PostgresJsDatabase<typeof tenantSchema>;

/**
 * Master DB connection (singleton)
 */
let _masterDb: MasterDb | null = null;
let _masterSql: ReturnType<typeof postgres> | null = null;

/**
 * Get Master DB connection (base de données principale)
 * Contains: users, organizations, tenant_databases, organization_members, invitations
 */
export async function getMasterDb(): Promise<MasterDb> {
  if (!_masterDb) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    try {
      _masterSql = postgres(databaseUrl);
      _masterDb = drizzle(_masterSql, { schema: masterSchema });

      console.log("[Database] Master DB connection established");
    } catch (error) {
      console.error("[Database] Failed to connect to Master DB:", error);
      throw new Error("Master DB connection failed");
    }
  }

  return _masterDb;
}

/**
 * Tenant DB cache (Map<organizationId, TenantDb>)
 */
const _tenantDbCache = new Map<number, TenantDb>();
const _tenantSqlCache = new Map<number, ReturnType<typeof postgres>>();

/**
 * Get Tenant DB connection (base de données spécifique à une organisation)
 * Contains: clients, sessions, invoices, equipment, rooms, projects
 *
 * @param organizationId - ID de l'organisation
 * @returns Instance Tenant DB
 *
 * ⚠️ CRITICAL: This is ACTIVE from day 1 (not commented like Manus)
 */
export async function getTenantDb(organizationId: number): Promise<TenantDb> {
  // 1. Check cache
  if (_tenantDbCache.has(organizationId)) {
    return _tenantDbCache.get(organizationId)!;
  }

  try {
    // 2. Get Master DB to read tenant_databases mapping
    const masterDb = await getMasterDb();

    const result = await masterDb
      .select()
      .from(masterSchema.tenantDatabases)
      .where(eq(masterSchema.tenantDatabases.organizationId, organizationId))
      .limit(1);

    const tenantInfo = result[0];
    if (!tenantInfo) {
      throw new Error(
        `No tenant database found for organization ${organizationId}. ` +
        `Please run createTenantDatabase() first.`
      );
    }

    const databaseName = tenantInfo.databaseName;

    // 3. Build tenant DB URL
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Parse base URL and replace database name
    const parsedUrl = new URL(baseUrl);
    const tenantUrl = `postgresql://${parsedUrl.username}:${parsedUrl.password}@${parsedUrl.hostname}:${parsedUrl.port || 5432}/${databaseName}`;

    console.log(`[Database] Connecting to Tenant DB: ${databaseName} for org ${organizationId}`);

    // 4. Create postgres connection
    const tenantSql = postgres(tenantUrl);

    // 5. Create Drizzle instance with Tenant schema
    const tenantDb = drizzle(tenantSql, { schema: tenantSchema });

    // 6. Cache connection
    _tenantDbCache.set(organizationId, tenantDb);
    _tenantSqlCache.set(organizationId, tenantSql);

    console.log(`[Database] Tenant DB connection established for org ${organizationId}`);

    return tenantDb;
  } catch (error) {
    console.error(`[Database] Failed to connect to Tenant DB for org ${organizationId}:`, error);
    throw new Error(`Tenant DB connection failed for organization ${organizationId}`);
  }
}

/**
 * Create a new Tenant Database for an organization
 *
 * @param organizationId - Organization ID
 * @param databaseName - Optional custom database name (defaults to tenant_{organizationId})
 */
export async function createTenantDatabase(
  organizationId: number,
  databaseName?: string
): Promise<void> {
  const dbName = databaseName || `tenant_${organizationId}`;

  try {
    const masterDb = await getMasterDb();

    // 1. Create database (PostgreSQL)
    // NOTE: This requires superuser privileges or CREATEDB role
    if (_masterSql) {
      await _masterSql.unsafe(`CREATE DATABASE "${dbName}"`);
      console.log(`[Database] Created database: ${dbName}`);
    }

    // 2. Insert mapping in tenant_databases table
    await masterDb.insert(masterSchema.tenantDatabases).values({
      organizationId,
      databaseName: dbName,
    });

    console.log(`[Database] Registered tenant database for org ${organizationId}`);

    // 3. Connect to new tenant DB and apply schema
    const tenantDb = await getTenantDb(organizationId);

    console.log(`[Database] Tenant database ready for org ${organizationId}`);
  } catch (error) {
    console.error(`[Database] Failed to create tenant database for org ${organizationId}:`, error);
    throw error;
  }
}

/**
 * Close all database connections (cleanup on shutdown)
 */
export async function closeAllConnections(): Promise<void> {
  console.log("[Database] Closing all connections...");

  // Close all tenant connections
  for (const [orgId, sql] of _tenantSqlCache.entries()) {
    await sql.end();
    console.log(`[Database] Tenant DB connection closed for org ${orgId}`);
  }
  _tenantDbCache.clear();
  _tenantSqlCache.clear();

  // Close master connection
  if (_masterSql) {
    await _masterSql.end();
    _masterSql = null;
    _masterDb = null;
    console.log("[Database] Master DB connection closed");
  }

  console.log("[Database] All connections closed");
}

/**
 * Check if Master DB is available
 */
export function isMasterDbAvailable(): boolean {
  return _masterDb !== null;
}

/**
 * Get number of cached tenant connections
 */
export function getTenantConnectionCount(): number {
  return _tenantDbCache.size;
}

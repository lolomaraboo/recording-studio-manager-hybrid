/**
 * Database Initialization & Seed Script
 *
 * Creates:
 * 1. Master DB schema (users, organizations, tenant_databases)
 * 2. 3 Demo organizations with Database-per-Tenant
 * 3. Realistic seed data in each tenant DB
 *
 * Usage:
 *   pnpm --filter @rsm/database run db:init
 *
 * Requirements:
 *   - PostgreSQL server running
 *   - DATABASE_URL env var set
 *   - PostgreSQL user with CREATEDB permission
 */

import postgres from "postgres";
import * as masterSchema from "../master/schema";
import * as tenantSchema from "../tenant/schema";
import { getMasterDb, createTenantDatabase, getTenantDb, closeAllConnections } from "../connection";

/**
 * Demo organizations to create
 */
const DEMO_ORGS = [
  {
    name: "Studio Pro",
    slug: "studio-pro",
    subdomain: "studiopro",
    ownerEmail: "alice@studiopro.com",
    ownerName: "Alice Martin",
    phone: "+33 1 23 45 67 89",
    address: "123 Rue de la Musique",
    city: "Paris",
    country: "France",
    subscriptionTier: "enterprise" as const,
  },
  {
    name: "Beat Lab",
    slug: "beat-lab",
    subdomain: "beatlab",
    ownerEmail: "bob@beatlab.com",
    ownerName: "Bob Johnson",
    phone: "+1 555 123 4567",
    address: "456 Sound Avenue",
    city: "Los Angeles",
    country: "USA",
    subscriptionTier: "pro" as const,
  },
  {
    name: "Home Studio",
    slug: "home-studio",
    subdomain: "homestudio",
    ownerEmail: "charlie@homestudio.com",
    ownerName: "Charlie Brown",
    phone: "+44 20 1234 5678",
    address: "789 Beat Street",
    city: "London",
    country: "UK",
    subscriptionTier: "starter" as const,
  },
];

/**
 * Check PostgreSQL connection
 */
async function checkConnection(): Promise<void> {
  console.log("\n🔍 Checking PostgreSQL connection...");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("❌ DATABASE_URL environment variable not set");
  }

  try {
    const sql = postgres(databaseUrl);
    await sql`SELECT 1`;
    await sql.end();
    console.log("✅ PostgreSQL connection successful");
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    throw error;
  }
}

/**
 * Create Master DB schema
 */
async function createMasterSchema(): Promise<void> {
  console.log("\n📊 Creating Master DB schema...");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set");
  }

  const sql = postgres(databaseUrl);

  try {
    // Create tables (using Drizzle migrations would be better for production)
    // For now, we'll use SQL directly for simplicity

    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        password_hash VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Organizations table
    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        subdomain VARCHAR(100) NOT NULL UNIQUE,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        timezone VARCHAR(100) NOT NULL DEFAULT 'Europe/Paris',
        currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
        language VARCHAR(10) NOT NULL DEFAULT 'fr',
        subscription_tier VARCHAR(50) NOT NULL DEFAULT 'trial',
        trial_ends_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Tenant Databases table
    await sql`
      CREATE TABLE IF NOT EXISTS tenant_databases (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL UNIQUE REFERENCES organizations(id),
        database_name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Organization Members table
    await sql`
      CREATE TABLE IF NOT EXISTS organization_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, organization_id)
      )
    `;

    // Invitations table
    await sql`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        invited_by INTEGER NOT NULL REFERENCES users(id),
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    console.log("✅ Master DB schema created");
  } catch (error) {
    console.error("❌ Failed to create Master DB schema:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

/**
 * Create demo users and organizations
 */
async function seedMasterData(): Promise<void> {
  console.log("\n🌱 Seeding Master DB data...");

  const masterDb = await getMasterDb();

  for (const orgData of DEMO_ORGS) {
    try {
      // 1. Create user (owner)
      const [user] = await masterDb
        .insert(masterSchema.users)
        .values({
          email: orgData.ownerEmail,
          name: orgData.ownerName,
          role: "admin",
          // In production: hash password with bcrypt
          passwordHash: "demo_password_hash",
        })
        .returning();

      if (!user) {
        throw new Error(`Failed to create user ${orgData.ownerEmail}`);
      }

      console.log(`  ✅ Created user: ${user.email} (ID: ${user.id})`);

      // 2. Create organization
      const [organization] = await masterDb
        .insert(masterSchema.organizations)
        .values({
          name: orgData.name,
          slug: orgData.slug,
          subdomain: orgData.subdomain,
          ownerId: user.id,
          phone: orgData.phone,
          address: orgData.address,
          city: orgData.city,
          country: orgData.country,
          subscriptionTier: orgData.subscriptionTier,
        })
        .returning();

      if (!organization) {
        throw new Error(`Failed to create organization ${orgData.name}`);
      }

      console.log(`  ✅ Created organization: ${organization.name} (ID: ${organization.id})`);

      // 3. Create organization member (owner)
      await masterDb
        .insert(masterSchema.organizationMembers)
        .values({
          userId: user.id,
          organizationId: organization.id,
          role: "owner",
        });

      console.log(`  ✅ Added ${user.name} as owner of ${organization.name}`);

      // 4. Create tenant database
      const dbName = `tenant_${organization.id}`;
      await createTenantDatabase(organization.id, dbName);

      console.log(`  ✅ Created tenant database: ${dbName}`);

      // 5. Seed tenant data
      await seedTenantData(organization.id, organization.name);

    } catch (error) {
      console.error(`  ❌ Failed to create ${orgData.name}:`, error);
      throw error;
    }
  }

  console.log("\n✅ Master DB seeding completed");
}

/**
 * Create Tenant DB schema
 */
async function createTenantSchema(organizationId: number): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  // Parse base URL and replace database name
  const parsedUrl = new URL(databaseUrl);
  const dbName = `tenant_${organizationId}`;
  const tenantUrl = `postgresql://${parsedUrl.username}:${parsedUrl.password}@${parsedUrl.hostname}:${parsedUrl.port || 5432}/${dbName}`;

  const sql = postgres(tenantUrl);

  try {
    // Clients table
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name VARCHAR(255) NOT NULL,
        artist_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        type VARCHAR(50) NOT NULL DEFAULT 'individual',
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        notes TEXT,
        is_vip BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        portal_access BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Rooms table
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        hourly_rate DECIMAL(10, 2) NOT NULL,
        capacity INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        room_id INTEGER NOT NULL REFERENCES rooms(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        total_amount DECIMAL(10, 2),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Invoices table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
        due_date TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        subtotal DECIMAL(10, 2) NOT NULL,
        tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
        tax_amount DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        paid_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Invoice Items table
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id),
        description VARCHAR(500) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
        unit_price DECIMAL(10, 2) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Equipment table
    await sql`
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        purchase_date TIMESTAMP,
        purchase_price DECIMAL(10, 2),
        condition VARCHAR(50) NOT NULL DEFAULT 'good',
        location VARCHAR(255),
        notes TEXT,
        is_available BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        budget DECIMAL(10, 2),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

  } finally {
    await sql.end();
  }
}

/**
 * Seed realistic data in Tenant DB
 */
async function seedTenantData(organizationId: number, orgName: string): Promise<void> {
  console.log(`\n  🌱 Seeding tenant data for ${orgName}...`);

  // Create tenant schema first
  await createTenantSchema(organizationId);

  const tenantDb = await getTenantDb(organizationId);

  // Seed Clients
  const [client1] = await tenantDb
    .insert(tenantSchema.clients)
    .values({
      name: "John Doe",
      artistName: "JD Music",
      email: "john@example.com",
      phone: "+1 555 111 2222",
      type: "individual",
      city: "New York",
      country: "USA",
      isVip: true,
    })
    .returning();

  if (!client1) {
    throw new Error("Failed to create client1");
  }

  const [client2] = await tenantDb
    .insert(tenantSchema.clients)
    .values({
      name: "Jane Smith",
      artistName: "Jane Electronic",
      email: "jane@example.com",
      phone: "+1 555 333 4444",
      type: "company",
      city: "Berlin",
      country: "Germany",
      portalAccess: true,
    })
    .returning();

  if (!client2) {
    throw new Error("Failed to create client2");
  }

  console.log(`    ✅ Created 2 clients`);

  // Seed Rooms
  const [room1] = await tenantDb
    .insert(tenantSchema.rooms)
    .values({
      name: "Studio A",
      description: "Professional recording studio with SSL console",
      hourlyRate: "150.00",
      capacity: 10,
    })
    .returning();

  if (!room1) {
    throw new Error("Failed to create room1");
  }

  const [room2] = await tenantDb
    .insert(tenantSchema.rooms)
    .values({
      name: "Studio B",
      description: "Mixing and mastering suite",
      hourlyRate: "100.00",
      capacity: 5,
    })
    .returning();

  if (!room2) {
    throw new Error("Failed to create room2");
  }

  console.log(`    ✅ Created 2 rooms`);

  // Seed Sessions
  await tenantDb
    .insert(tenantSchema.sessions)
    .values({
      title: "Recording Session - Album Track 1",
      clientId: client1.id,
      roomId: room1.id,
      startTime: new Date("2025-12-15T10:00:00"),
      endTime: new Date("2025-12-15T18:00:00"),
      status: "scheduled",
      notes: "Bring guitar and vocals",
    });

  await tenantDb
    .insert(tenantSchema.sessions)
    .values({
      title: "Mixing Session - EP",
      clientId: client2.id,
      roomId: room2.id,
      startTime: new Date("2025-12-16T14:00:00"),
      endTime: new Date("2025-12-16T20:00:00"),
      status: "scheduled",
      notes: "Need to finalize mix for 5 tracks",
    });

  console.log(`    ✅ Created 2 sessions`);

  // Seed Invoices
  const subtotal = 1200.00;
  const taxRate = 20.00;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  await tenantDb
    .insert(tenantSchema.invoices)
    .values({
      invoiceNumber: `INV-${organizationId}-001`,
      clientId: client1.id,
      subtotal: subtotal.toFixed(2),
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      status: "sent",
      dueDate: new Date("2025-12-30"),
    });

  console.log(`    ✅ Created 1 invoice`);

  // Seed Equipment
  await tenantDb
    .insert(tenantSchema.equipment)
    .values({
      name: "Neumann U87",
      category: "microphone",
      brand: "Neumann",
      model: "U87 Ai",
      condition: "excellent",
      location: `Room: ${room1.name}`,
    });

  await tenantDb
    .insert(tenantSchema.equipment)
    .values({
      name: "SSL Compressor",
      category: "other",
      brand: "SSL",
      model: "G-Series",
      condition: "good",
      location: `Room: ${room2.name}`,
    });

  console.log(`    ✅ Created 2 equipment items`);

  // Seed Projects
  await tenantDb
    .insert(tenantSchema.projects)
    .values({
      name: "Debut Album Production",
      clientId: client1.id,
      description: "Full album production including recording, mixing, and mastering",
      status: "active",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2026-03-01"),
      budget: "15000.00",
    });

  console.log(`    ✅ Created 1 project`);

  console.log(`  ✅ Tenant data seeded for ${orgName}`);
}

/**
 * Main initialization function
 */
async function main() {
  console.log("🚀 Recording Studio Manager - Database Initialization\n");
  console.log("📋 This will create:");
  console.log("   - Master DB schema (users, organizations, tenant_databases)");
  console.log("   - 3 Demo organizations with owners");
  console.log("   - 3 Tenant databases (Database-per-Tenant architecture)");
  console.log("   - Realistic seed data in each tenant DB\n");

  try {
    // Step 1: Check connection
    await checkConnection();

    // Step 2: Create Master DB schema
    await createMasterSchema();

    // Step 3: Seed Master DB data (creates orgs + tenant DBs + seeds)
    await seedMasterData();

    console.log("\n✅ ✅ ✅ DATABASE INITIALIZATION COMPLETED! ✅ ✅ ✅\n");
    console.log("📊 Summary:");
    console.log("   - Master DB: 3 users, 3 organizations created");
    console.log("   - Tenant DBs: 3 databases created (tenant_1, tenant_2, tenant_3)");
    console.log("   - Seed Data: 2 clients, 2 rooms, 2 sessions, 1 invoice, 2 equipment, 1 project per org\n");

    console.log("🔐 Demo Logins:");
    DEMO_ORGS.forEach((org, i) => {
      console.log(`   ${i + 1}. ${org.ownerEmail} (${org.name} - ${org.subscriptionTier})`);
    });

    console.log("\n🎯 Next Steps:");
    console.log("   1. Create tests: pnpm --filter @rsm/database test");
    console.log("   2. Start server: pnpm --filter @rsm/server dev");
    console.log("   3. Open Drizzle Studio: pnpm --filter @rsm/database db:studio\n");

  } catch (error) {
    console.error("\n❌ Initialization failed:", error);
    process.exit(1);
  } finally {
    await closeAllConnections();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as initDatabase };

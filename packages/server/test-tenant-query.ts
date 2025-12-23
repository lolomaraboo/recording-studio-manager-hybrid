/**
 * Test script to verify tenant database connection and query
 */
import { getTenantDb } from "@rsm/database/connection";
import { clientPortalAccounts } from "@rsm/database/tenant/schema";
import { eq } from "drizzle-orm";

async function test() {
  console.log("🔍 Testing tenant database query...\n");

  try {
    // Get tenant database for org 1
    console.log("1. Getting tenant DB for organization 1...");
    const tenantDb = await getTenantDb(1);
    console.log("✅ Tenant DB connection obtained\n");

    // Query for test account
    const email = "test@example.com";
    console.log(`2. Querying for account with email: ${email}`);

    const accounts = await tenantDb
      .select()
      .from(clientPortalAccounts)
      .where(eq(clientPortalAccounts.email, email))
      .limit(1);

    console.log(`✅ Query executed. Results: ${accounts.length}`);

    if (accounts.length > 0) {
      console.log("\n📋 Account found:");
      console.log(JSON.stringify(accounts[0], null, 2));
    } else {
      console.log("\n⚠️  No account found!");
    }

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();

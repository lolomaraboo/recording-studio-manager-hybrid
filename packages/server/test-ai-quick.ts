/**
 * Quick Test for AI Actions
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { AIActionExecutor } from "./src/lib/aiActions.js";

async function quickTest() {
  console.log("\n🧪 Quick AI Actions Test\n");

  // Connect directly to tenant_1 database
  const connectionString = "postgresql://postgres:postgres@localhost:5432/tenant_1";
  const client = postgres(connectionString);
  const db = drizzle(client);

  const executor = new AIActionExecutor(db);

  // Test 1: create_invoice
  console.log("Testing create_invoice...");
  try {
    const result = await executor.execute("create_invoice", {
      client_id: 1,
      invoice_number: "INV-QUICK-" + Date.now(),
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 1000,
      tax_rate: 20,
    });

    console.log("Result:", JSON.stringify(result, null, 2));
    console.log(result.success ? "✅ PASS" : "❌ FAIL");
  } catch (error: any) {
    console.log("❌ ERROR:", error.message);
    console.log("Stack:", error.stack);
  }

  await client.end();
}

quickTest().catch(console.error);

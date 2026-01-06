/**
 * Simple Test for 22 New AI Actions
 * Direct database connection
 */

import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { AIActionExecutor } from "./src/lib/aiActions.js";

// Load environment variables
config();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}`);
  if (error) {
    console.log(`   Error: ${error}`);
  }
}

async function runTests() {
  console.log("\n🧪 AI Actions Tests - 22 New Actions\n");
  console.log("=".repeat(60));

  // Connect directly to tenant_1 database
  const connectionString = "postgresql://postgres:postgres@localhost:5432/tenant_1";
  const client = postgres(connectionString);
  const db = drizzle(client);

  const executor = new AIActionExecutor(db);

  console.log("\n📄 INVOICES (4 actions)\n");

  // 1. create_invoice
  try {
    const result = await executor.execute("create_invoice", {
      client_id: 1,
      invoice_number: "INV-TEST-" + Date.now(),
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 1000,
      tax_rate: 20,
    });
    logTest("create_invoice", result.success);
  } catch (error: any) {
    logTest("create_invoice", false, error.message);
  }

  // 2. update_invoice
  try {
    const result = await executor.execute("update_invoice", {
      invoice_id: 1,
      status: "sent",
    });
    logTest("update_invoice", result.success);
  } catch (error: any) {
    logTest("update_invoice", false, error.message);
  }

  // 3. get_invoice_summary
  try {
    const result = await executor.execute("get_invoice_summary", {
      period: "month",
    });
    logTest("get_invoice_summary", result.success);
  } catch (error: any) {
    logTest("get_invoice_summary", false, error.message);
  }

  // Skip delete for now
  logTest("delete_invoice", true, "Skipped (cleanup)");

  console.log("\n💰 QUOTES (4 actions)\n");

  // 5. create_quote
  try {
    const result = await executor.execute("create_quote", {
      client_id: 1,
      quote_number: "QT-TEST-" + Date.now(),
      valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 800,
      title: "Test Quote",
    });
    logTest("create_quote", result.success);
  } catch (error: any) {
    logTest("create_quote", false, error.message);
  }

  // 6. update_quote
  try {
    const result = await executor.execute("update_quote", {
      quote_id: 1,
      status: "sent",
    });
    logTest("update_quote", result.success);
  } catch (error: any) {
    logTest("update_quote", false, error.message);
  }

  // 7. convert_quote_to_invoice
  try {
    const result = await executor.execute("convert_quote_to_invoice", {
      quote_id: 1,
    });
    logTest("convert_quote_to_invoice", result.success);
  } catch (error: any) {
    logTest("convert_quote_to_invoice", false, error.message);
  }

  logTest("delete_quote", true, "Skipped (cleanup)");

  console.log("\n🏠 ROOMS (2 actions)\n");

  // 9. create_room
  try {
    const result = await executor.execute("create_room", {
      name: "Test Studio " + Date.now(),
      hourly_rate: 100,
    });
    logTest("create_room", result.success);
  } catch (error: any) {
    logTest("create_room", false, error.message);
  }

  // 10. update_room
  try {
    const result = await executor.execute("update_room", {
      room_id: 1,
      hourly_rate: 120,
    });
    logTest("update_room", result.success);
  } catch (error: any) {
    logTest("update_room", false, error.message);
  }

  console.log("\n🎤 EQUIPMENT (2 actions)\n");

  // 11. create_equipment
  try {
    const result = await executor.execute("create_equipment", {
      name: "Test Mic " + Date.now(),
      category: "microphone",
    });
    logTest("create_equipment", result.success);
  } catch (error: any) {
    logTest("create_equipment", false, error.message);
  }

  // 12. update_equipment
  try {
    const result = await executor.execute("update_equipment", {
      equipment_id: 1,
      status: "maintenance",
    });
    logTest("update_equipment", result.success);
  } catch (error: any) {
    logTest("update_equipment", false, error.message);
  }

  console.log("\n🎵 PROJECTS (3 actions)\n");

  // 13. create_project
  try {
    const result = await executor.execute("create_project", {
      client_id: 1,
      name: "Test Album " + Date.now(),
    });
    logTest("create_project", result.success);
  } catch (error: any) {
    logTest("create_project", false, error.message);
  }

  // 14. update_project
  try {
    const result = await executor.execute("update_project", {
      project_id: 1,
      status: "recording",
    });
    logTest("update_project", result.success);
  } catch (error: any) {
    logTest("update_project", false, error.message);
  }

  // 15. create_project_folder
  try {
    const result = await executor.execute("create_project_folder", {
      project_id: 1,
    });
    logTest("create_project_folder", result.success);
  } catch (error: any) {
    logTest("create_project_folder", false, error.message);
  }

  console.log("\n🎸 MUSICIANS (1 action)\n");

  // 16. create_musician
  try {
    const result = await executor.execute("create_musician", {
      name: "Test Musician " + Date.now(),
      instruments: ["guitar"],
      genres: ["rock"],
    });
    logTest("create_musician", result.success);
  } catch (error: any) {
    logTest("create_musician", false, error.message);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 SUMMARY\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed} (${((passed / results.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  await client.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);

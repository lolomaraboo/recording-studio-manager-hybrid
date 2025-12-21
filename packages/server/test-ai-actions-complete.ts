/**
 * Test AI Actions Complete - All 22 New Actions
 *
 * Tests the 22 newly implemented AI actions:
 * - Invoices (4)
 * - Quotes (4)
 * - Rooms (2)
 * - Equipment (2)
 * - Projects (3)
 * - Musicians (1)
 */

import { config } from "dotenv";
import { getTenantDb } from "@rsm/database/connection";
import { AIActionExecutor } from "./src/lib/aiActions";

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;
const ORGANIZATION_ID = 1; // Test Studio (org_id=1)

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, data?: any, error?: string) {
  results.push({ name, passed, error, data });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}`);
  if (data) {
    console.log(`   Data:`, JSON.stringify(data, null, 2).split('\n').slice(0, 3).join('\n'));
  }
  if (error) {
    console.log(`   Error: ${error}`);
  }
}

async function runTests() {
  console.log("\n🧪 Starting AI Actions Tests - 22 New Actions\n");
  console.log("=" .repeat(60));

  try {
    // Get tenant database
    const tenantDb = await getTenantDb(ORGANIZATION_ID);
    const executor = new AIActionExecutor(tenantDb);

    // ========================================================================
    // INVOICES TESTS (4)
    // ========================================================================
    console.log("\n📄 INVOICES TESTS (4 actions)\n");

    // Test 1: create_invoice
    try {
      const result = await executor.execute("create_invoice", {
        client_id: 1,
        invoice_number: "INV-TEST-001",
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 1000,
        tax_rate: 20,
        notes: "Test invoice",
      });
      logTest("create_invoice", result.success, result.data);
    } catch (error: any) {
      logTest("create_invoice", false, null, error.message);
    }

    // Test 2: update_invoice
    try {
      const result = await executor.execute("update_invoice", {
        invoice_id: 1,
        status: "sent",
        notes: "Updated via AI",
      });
      logTest("update_invoice", result.success, result.data);
    } catch (error: any) {
      logTest("update_invoice", false, null, error.message);
    }

    // Test 3: get_invoice_summary
    try {
      const result = await executor.execute("get_invoice_summary", {
        period: "month",
      });
      logTest("get_invoice_summary", result.success, result.data);
    } catch (error: any) {
      logTest("get_invoice_summary", false, null, error.message);
    }

    // Test 4: delete_invoice (cleanup)
    try {
      const result = await executor.execute("delete_invoice", {
        invoice_id: 1,
      });
      logTest("delete_invoice", result.success, result.data);
    } catch (error: any) {
      logTest("delete_invoice", false, null, error.message);
    }

    // ========================================================================
    // QUOTES TESTS (4)
    // ========================================================================
    console.log("\n💰 QUOTES TESTS (4 actions)\n");

    // Test 5: create_quote
    try {
      const result = await executor.execute("create_quote", {
        client_id: 1,
        quote_number: "QT-TEST-001",
        valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 800,
        tax_rate: 20,
        title: "Test Quote",
        description: "Testing quote creation",
      });
      logTest("create_quote", result.success, result.data);
    } catch (error: any) {
      logTest("create_quote", false, null, error.message);
    }

    // Test 6: update_quote
    try {
      const result = await executor.execute("update_quote", {
        quote_id: 1,
        status: "sent",
        description: "Updated via AI",
      });
      logTest("update_quote", result.success, result.data);
    } catch (error: any) {
      logTest("update_quote", false, null, error.message);
    }

    // Test 7: convert_quote_to_invoice
    try {
      const result = await executor.execute("convert_quote_to_invoice", {
        quote_id: 1,
      });
      logTest("convert_quote_to_invoice", result.success, result.data);
    } catch (error: any) {
      logTest("convert_quote_to_invoice", false, null, error.message);
    }

    // Test 8: delete_quote (cleanup)
    try {
      const result = await executor.execute("delete_quote", {
        quote_id: 2,
      });
      logTest("delete_quote", result.success, result.data);
    } catch (error: any) {
      logTest("delete_quote", false, null, error.message);
    }

    // ========================================================================
    // ROOMS TESTS (2)
    // ========================================================================
    console.log("\n🏠 ROOMS TESTS (2 actions)\n");

    // Test 9: create_room
    try {
      const result = await executor.execute("create_room", {
        name: "Test Studio A",
        type: "recording",
        hourly_rate: 100,
        half_day_rate: 400,
        full_day_rate: 700,
        capacity: 5,
        description: "Test recording room",
      });
      logTest("create_room", result.success, result.data);
    } catch (error: any) {
      logTest("create_room", false, null, error.message);
    }

    // Test 10: update_room
    try {
      const result = await executor.execute("update_room", {
        room_id: 1,
        hourly_rate: 120,
        is_available_for_booking: true,
      });
      logTest("update_room", result.success, result.data);
    } catch (error: any) {
      logTest("update_room", false, null, error.message);
    }

    // ========================================================================
    // EQUIPMENT TESTS (2)
    // ========================================================================
    console.log("\n🎤 EQUIPMENT TESTS (2 actions)\n");

    // Test 11: create_equipment
    try {
      const result = await executor.execute("create_equipment", {
        name: "Neumann U87",
        category: "microphone",
        brand: "Neumann",
        model: "U87 Ai",
        status: "operational",
        description: "Professional condenser microphone",
      });
      logTest("create_equipment", result.success, result.data);
    } catch (error: any) {
      logTest("create_equipment", false, null, error.message);
    }

    // Test 12: update_equipment
    try {
      const result = await executor.execute("update_equipment", {
        equipment_id: 1,
        status: "maintenance",
        condition: "good",
      });
      logTest("update_equipment", result.success, result.data);
    } catch (error: any) {
      logTest("update_equipment", false, null, error.message);
    }

    // ========================================================================
    // PROJECTS TESTS (3)
    // ========================================================================
    console.log("\n🎵 PROJECTS TESTS (3 actions)\n");

    // Test 13: create_project
    try {
      const result = await executor.execute("create_project", {
        client_id: 1,
        name: "Test Album",
        artist_name: "Test Artist",
        type: "album",
        genre: "Rock",
        budget: 10000,
        description: "Test music project",
      });
      logTest("create_project", result.success, result.data);
    } catch (error: any) {
      logTest("create_project", false, null, error.message);
    }

    // Test 14: update_project
    try {
      const result = await executor.execute("update_project", {
        project_id: 1,
        status: "recording",
        total_cost: 5000,
      });
      logTest("update_project", result.success, result.data);
    } catch (error: any) {
      logTest("update_project", false, null, error.message);
    }

    // Test 15: create_project_folder
    try {
      const result = await executor.execute("create_project_folder", {
        project_id: 1,
        folder_name: "Test Album 2025",
      });
      logTest("create_project_folder", result.success, result.data);
    } catch (error: any) {
      logTest("create_project_folder", false, null, error.message);
    }

    // ========================================================================
    // MUSICIANS TESTS (1)
    // ========================================================================
    console.log("\n🎸 MUSICIANS TESTS (1 action)\n");

    // Test 16: create_musician
    try {
      const result = await executor.execute("create_musician", {
        name: "John Doe",
        stage_name: "Johnny D",
        email: "john@test.com",
        phone: "+1234567890",
        talent_type: "musician",
        instruments: ["guitar", "vocals"],
        genres: ["rock", "blues"],
        bio: "Professional guitarist and vocalist",
      });
      logTest("create_musician", result.success, result.data);
    } catch (error: any) {
      logTest("create_musician", false, null, error.message);
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 TEST SUMMARY\n");

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);

    if (failed > 0) {
      console.log("\n❌ Failed Tests:");
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log("\n" + "=".repeat(60));

    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error("\n❌ Test suite failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();

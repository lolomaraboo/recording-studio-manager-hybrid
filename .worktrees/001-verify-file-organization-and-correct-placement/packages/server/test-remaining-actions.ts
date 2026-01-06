/**
 * Test remaining 6 actions with detailed output
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { AIActionExecutor } from "./src/lib/aiActions.js";

async function test() {
  console.log("\n🧪 Testing Remaining 6 Actions\n");

  const connectionString = "postgresql://postgres:postgres@localhost:5432/tenant_1";
  const client = postgres(connectionString);
  const db = drizzle(client);
  const executor = new AIActionExecutor(db);

  // Test create_room
  console.log("1. Testing create_room...");
  try {
    const result = await executor.execute("create_room", {
      name: "Test Studio " + Date.now(),
      hourly_rate: 100,
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.log("ERROR:", error.message);
    console.log("Stack:", error.stack);
  }

  // Test update_room
  console.log("\n2. Testing update_room...");
  try {
    const result = await executor.execute("update_room", {
      room_id: 1,
      hourly_rate: 120,
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.log("ERROR:", error.message);
  }

  // Test create_project
  console.log("\n3. Testing create_project...");
  try {
    const result = await executor.execute("create_project", {
      client_id: 1,
      name: "Test Album " + Date.now(),
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.log("ERROR:", error.message);
  }

  // Test update_project
  console.log("\n4. Testing update_project...");
  try {
    const result = await executor.execute("update_project", {
      project_id: 1,
      status: "recording",
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.log("ERROR:", error.message);
  }

  // Test create_project_folder
  console.log("\n5. Testing create_project_folder...");
  try {
    const result = await executor.execute("create_project_folder", {
      project_id: 1,
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.log("ERROR:", error.message);
  }

  // Test create_musician
  console.log("\n6. Testing create_musician...");
  try {
    const result = await executor.execute("create_musician", {
      name: "Test Musician " + Date.now(),
      instruments: ["guitar"],
      genres: ["rock"],
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.log("ERROR:", error.message);
  }

  await client.end();
}

test().catch(console.error);

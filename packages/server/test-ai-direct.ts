/**
 * Direct AI chatbot test script
 * Tests the AI functionality without going through HTTP/tRPC layer
 */

import { getLLMProvider } from "./src/lib/llmProvider.js";
import { AIActionExecutor } from "./src/lib/aiActions.js";
import { AI_TOOLS } from "./src/lib/aiTools.js";
import { SYSTEM_PROMPT } from "./src/lib/aiSystemPrompt.js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@rsm/database/tenant";

async function testAIChatbot() {
  console.log("🧪 Testing AI Chatbot directly...\n");

  // Connect to tenant_1 database
  const connectionString = "postgresql://postgres:password@localhost:5432/tenant_1";
  const sql = postgres(connectionString);
  const db = drizzle(sql, { schema });

  // Initialize LLM provider
  const llm = getLLMProvider();

  // Initialize action executor
  const actionExecutor = new AIActionExecutor(db);

  // Test message
  const userMessage = "Combien de sessions ai-je aujourd'hui ?";

  console.log(`📝 User: "${userMessage}"\n`);

  try {
    // Call LLM with tools
    console.log("🤖 Calling LLM...");
    const llmResponse = await llm.chatCompletion({
      messages: [{ role: "user", content: userMessage }],
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 4096,
      tools: AI_TOOLS,
    });

    console.log(`\n📤 LLM Response:`, llmResponse.content);
    console.log(`🔧 Tool calls:`, llmResponse.toolCalls?.length || 0);

    if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
      console.log("\n🛠️ Executing actions...");

      const toolResults: any[] = [];

      for (const toolCall of llmResponse.toolCalls) {
        console.log(`  → ${toolCall.name}(${JSON.stringify(toolCall.input)})`);

        const startTime = Date.now();
        const result = await actionExecutor.execute(toolCall.name, toolCall.input);

        console.log(`    ✓ Executed in ${Date.now() - startTime}ms`);
        console.log(`    Result:`, JSON.stringify(result, null, 2));

        toolResults.push({
          toolUseId: toolCall.id,
          name: toolCall.name,
          result: result.data,
        });
      }

      // Make follow-up LLM call with results
      console.log("\n🤖 Follow-up LLM call with tool results...");

      const followUpResponse = await llm.chatCompletion({
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: llmResponse.content || "" },
          { role: "user", content: `Tool results: ${JSON.stringify(toolResults)}` },
        ],
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 4096,
      });

      console.log("\n✅ Final AI Response:");
      console.log(followUpResponse.content);
      console.log("\n📊 Token usage:");
      console.log(
        `  Input: ${llmResponse.usage.inputTokens + followUpResponse.usage.inputTokens}`
      );
      console.log(
        `  Output: ${llmResponse.usage.outputTokens + followUpResponse.usage.outputTokens}`
      );
      console.log(
        `  Total: ${llmResponse.usage.inputTokens + llmResponse.usage.outputTokens + followUpResponse.usage.inputTokens + followUpResponse.usage.outputTokens}`
      );
    } else {
      console.log("\n✅ Final AI Response:");
      console.log(llmResponse.content);
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await sql.end();
  }
}

testAIChatbot();

/**
 * Test complet du chatbot AI avec exécution d'actions
 * Simule un flow complet: LLM → Actions → Follow-up LLM
 */

import { getLLMProvider } from "./src/lib/llmProvider.js";
import { AIActionExecutor } from "./src/lib/aiActions.js";
import { AI_TOOLS } from "./src/lib/aiTools.js";
import { SYSTEM_PROMPT } from "./src/lib/aiSystemPrompt.js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@rsm/database/tenant";

async function testChatbotComplete() {
  console.log("🎯 TEST CHATBOT AI COMPLET - End-to-End\n");
  console.log("=========================================\n");

  // Connect to tenant_1 database directly
  const sql = postgres("postgresql://postgres:password@localhost:5432/tenant_1");
  const db = drizzle(sql, { schema });

  // Initialize
  const llm = getLLMProvider();
  const actionExecutor = new AIActionExecutor(db);

  // Test questions
  const questions = [
    "Combien de sessions ai-je aujourd'hui ?",
    "Qui sont mes clients VIP ?",
    "Donne-moi un aperçu global du studio",
  ];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    console.log(`\n📝 QUESTION ${i + 1}/${questions.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`User: "${question}"\n`);

    try {
      // Step 1: LLM call with tools
      console.log("🤖 [STEP 1] Appel LLM avec tools...");
      const llmResponse = await llm.chatCompletion({
        messages: [{ role: "user", content: question }],
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 4096,
        tools: AI_TOOLS,
      });

      console.log(`   Réponse initiale: ${llmResponse.content || "(vide - LLM veut utiliser des tools)"}`);
      console.log(`   Tools à appeler: ${llmResponse.toolCalls?.length || 0}\n`);

      if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
        console.log("✅ Réponse finale:");
        console.log(llmResponse.content);
        continue;
      }

      // Step 2: Execute actions
      console.log("🔧 [STEP 2] Exécution des actions...");
      const toolResults: any[] = [];

      for (const toolCall of llmResponse.toolCalls) {
        console.log(`   → ${toolCall.name}(${JSON.stringify(toolCall.input)})`);

        const startTime = Date.now();
        const result = await actionExecutor.execute(toolCall.name, toolCall.input);
        const duration = Date.now() - startTime;

        console.log(`     ✓ Exécuté en ${duration}ms`);

        if (result.success) {
          console.log(`     📊 Résultat:`, JSON.stringify(result.data).substring(0, 100) + "...");
          toolResults.push({
            toolUseId: toolCall.id,
            name: toolCall.name,
            result: result.data,
          });
        } else {
          console.log(`     ❌ Erreur: ${result.error}`);
          toolResults.push({
            toolUseId: toolCall.id,
            name: toolCall.name,
            error: result.error,
          });
        }
      }

      // Step 3: Follow-up LLM call with results
      console.log("\n🤖 [STEP 3] Follow-up LLM avec résultats des actions...");
      const followUpResponse = await llm.chatCompletion({
        messages: [
          { role: "user", content: question },
          { role: "assistant", content: llmResponse.content || "" },
          {
            role: "user",
            content: `Tool results: ${JSON.stringify(toolResults)}`,
          },
        ],
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 4096,
      });

      // Step 4: Display final response
      console.log("\n✅ RÉPONSE FINALE DE L'IA:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(followUpResponse.content);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      console.log(`\n📊 Tokens utilisés:`);
      console.log(
        `   Total: ${llmResponse.usage.inputTokens + llmResponse.usage.outputTokens + followUpResponse.usage.inputTokens + followUpResponse.usage.outputTokens}`
      );
      console.log(`   Input: ${llmResponse.usage.inputTokens + followUpResponse.usage.inputTokens}`);
      console.log(`   Output: ${llmResponse.usage.outputTokens + followUpResponse.usage.outputTokens}`);
    } catch (error: any) {
      console.error(`\n❌ ERREUR: ${error.message}`);
      if (error.stack) console.error(error.stack);
    }
  }

  await sql.end();

  console.log("\n\n🎉 TOUS LES TESTS TERMINÉS!");
  console.log("=========================================");
}

// Set env vars (use .env file or set manually before running)
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY not set. Please set it in .env or environment.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:password@localhost:5432/rsm_master";
}

testChatbotComplete();

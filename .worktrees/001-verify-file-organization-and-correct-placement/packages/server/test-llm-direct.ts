/**
 * Test direct du LLM Provider OpenAI
 */

import { getLLMProvider } from "./src/lib/llmProvider.js";
import { AI_TOOLS } from "./src/lib/aiTools.js";
import { SYSTEM_PROMPT } from "./src/lib/aiSystemPrompt.js";

async function testLLM() {
  console.log("🧪 Test du LLM Provider (OpenAI GPT-4)\n");

  const llm = getLLMProvider();

  // Test 1: Simple question sans tools
  console.log("=== Test 1: Question simple ===");
  const question1 = "Bonjour, peux-tu me confirmer que tu fonctionnes correctement?";
  console.log(`User: ${question1}\n`);

  try {
    const response1 = await llm.chatCompletion({
      messages: [{ role: "user", content: question1 }],
      systemPrompt: "Tu es un assistant IA pour studio d'enregistrement.",
      temperature: 0.7,
      maxTokens: 200,
    });

    console.log("✅ Réponse:", response1.content);
    console.log(`📊 Tokens: ${response1.usage.inputTokens} in + ${response1.usage.outputTokens} out\n`);
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    return;
  }

  // Test 2: Question avec function calling
  console.log("\n=== Test 2: Question avec tools (function calling) ===");
  const question2 = "Combien de sessions ai-je aujourd'hui ?";
  console.log(`User: ${question2}\n`);

  try {
    const response2 = await llm.chatCompletion({
      messages: [{ role: "user", content: question2 }],
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 500,
      tools: AI_TOOLS,
    });

    console.log("📤 Réponse initiale:", response2.content || "(vide - LLM veut utiliser un tool)");

    if (response2.toolCalls && response2.toolCalls.length > 0) {
      console.log(`\n🔧 Tools appelés: ${response2.toolCalls.length}`);
      response2.toolCalls.forEach((tc, i) => {
        console.log(`  ${i + 1}. ${tc.name}(${JSON.stringify(tc.input)})`);
      });
      console.log("\n✅ Function calling fonctionne!");
    } else {
      console.log("\n⚠️  Aucun tool appelé (LLM a répondu directement)");
    }

    console.log(`\n📊 Tokens: ${response2.usage.inputTokens} in + ${response2.usage.outputTokens} out`);
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    if (error.stack) console.error(error.stack);
  }

  console.log("\n✅ Tests terminés!");
}

testLLM();

/**
 * Test Hallucination Detector
 *
 * Tests the hallucination detection system with various scenarios
 */

import { HallucinationDetector } from "./src/lib/hallucinationDetector.js";
import type { ToolCall } from "./src/lib/llmProvider.js";

async function testHallucinationDetector() {
  console.log("🧪 TEST HALLUCINATION DETECTOR\n");
  console.log("=========================================\n");

  const detector = new HallucinationDetector();

  // Test 1: Good response - numbers match data
  console.log("📝 Test 1: Good response (numbers match data)");
  const goodResponse = `D'après get_all_clients, tu as 2 clients VIP:
1. Jean Dupont (email: jean.dupont@email.com)
2. Studio Productions SARL (email: contact@studio-prod.com)

(source: get_all_clients)`;

  const goodToolCalls: ToolCall[] = [
    {
      id: "call_1",
      name: "get_all_clients",
      input: { is_vip: true },
    },
  ];

  const goodToolResults = [
    {
      clients: [
        {
          id: 1,
          name: "Jean Dupont",
          email: "jean.dupont@email.com",
          is_vip: true,
        },
        {
          id: 3,
          name: "Studio Productions SARL",
          email: "contact@studio-prod.com",
          is_vip: true,
        },
      ],
      count: 2,
    },
  ];

  const result1 = await detector.detect(goodResponse, goodToolCalls, goodToolResults);

  console.log("Result:", {
    hasHallucination: result1.hasHallucination,
    confidence: result1.confidence + "%",
    issues: result1.issues,
    warnings: result1.warnings,
  });
  console.log(result1.hasHallucination ? "❌ FAILED" : "✅ PASSED");
  console.log("");

  // Test 2: Bad response - invented numbers
  console.log("📝 Test 2: Bad response (invented numbers)");
  const badResponse = `Tu as 5 clients VIP, avec un chiffre d'affaires de 50000€ ce mois-ci.
Les 3 meilleurs clients sont Jean Dupont, Sophie Martin et Marc Bernard.`;

  const result2 = await detector.detect(badResponse, goodToolCalls, goodToolResults);

  console.log("Result:", {
    hasHallucination: result2.hasHallucination,
    confidence: result2.confidence + "%",
    issues: result2.issues,
    warnings: result2.warnings,
  });
  console.log(result2.hasHallucination ? "✅ DETECTED (correct)" : "❌ MISSED");
  console.log("");

  // Test 3: Bad response - no source citation
  console.log("📝 Test 3: Bad response (no source citation)");
  const noSourceResponse = `Tu as 2 clients VIP: Jean Dupont et Studio Productions SARL.`;

  const result3 = await detector.detect(noSourceResponse, goodToolCalls, goodToolResults);

  console.log("Result:", {
    hasHallucination: result3.hasHallucination,
    confidence: result3.confidence + "%",
    issues: result3.issues,
    warnings: result3.warnings,
  });
  console.log("Status: " + (result3.warnings.length > 0 ? "✅ WARNING (correct)" : "❌ MISSED"));
  console.log("");

  // Test 4: Bad response - approximations
  console.log("📝 Test 4: Bad response (approximations)");
  const approximationResponse = `Tu as environ 2 clients VIP, avec à peu près 1000€ de CA.`;

  const result4 = await detector.detect(approximationResponse, goodToolCalls, goodToolResults);

  console.log("Result:", {
    hasHallucination: result4.hasHallucination,
    confidence: result4.confidence + "%",
    issues: result4.issues,
    warnings: result4.warnings,
  });
  console.log(result4.hasHallucination ? "✅ DETECTED (correct)" : "❌ MISSED");
  console.log("");

  // Test 5: Good response - with sessions data
  console.log("📝 Test 5: Good response (sessions data)");
  const sessionsResponse = `D'après get_upcoming_sessions, tu as 3 sessions aujourd'hui:
1. Session à 10h00 - Enregistrement Voix
2. Session à 14h00 - Mixage
3. Session à 15h00 - Podcast

Total: 3 sessions
(source: get_upcoming_sessions)`;

  const sessionsToolCalls: ToolCall[] = [
    {
      id: "call_2",
      name: "get_upcoming_sessions",
      input: { start_date: "2025-12-20", end_date: "2025-12-20" },
    },
  ];

  const sessionsToolResults = [
    {
      sessions: [
        { id: 1, title: "Enregistrement Voix", start_time: "2025-12-20T10:00:00" },
        { id: 2, title: "Mixage", start_time: "2025-12-20T14:00:00" },
        { id: 3, title: "Podcast", start_time: "2025-12-20T15:00:00" },
      ],
      count: 3,
    },
  ];

  const result5 = await detector.detect(sessionsResponse, sessionsToolCalls, sessionsToolResults);

  console.log("Result:", {
    hasHallucination: result5.hasHallucination,
    confidence: result5.confidence + "%",
    issues: result5.issues,
    warnings: result5.warnings,
  });
  console.log(result5.hasHallucination ? "❌ FAILED" : "✅ PASSED");
  console.log("");

  // Summary
  console.log("=========================================");
  console.log("🎯 SUMMARY:");
  console.log("");
  console.log("Test 1 (good response):        " + (result1.hasHallucination ? "❌" : "✅"));
  console.log("Test 2 (invented numbers):     " + (result2.hasHallucination ? "✅" : "❌"));
  console.log("Test 3 (no source):            " + (result3.warnings.length > 0 ? "✅" : "❌"));
  console.log("Test 4 (approximations):       " + (result4.hasHallucination ? "✅" : "❌"));
  console.log("Test 5 (sessions data):        " + (result5.hasHallucination ? "❌" : "✅"));
  console.log("");

  const passed =
    !result1.hasHallucination &&
    result2.hasHallucination &&
    result3.warnings.length > 0 &&
    result4.hasHallucination &&
    !result5.hasHallucination;

  console.log(passed ? "✅ ALL TESTS PASSED!" : "❌ SOME TESTS FAILED");
}

testHallucinationDetector();

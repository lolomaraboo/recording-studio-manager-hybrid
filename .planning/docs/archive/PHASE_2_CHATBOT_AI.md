# PHASE 2 - CHATBOT AI (Portage Python → TypeScript)

**Date de création:** 2025-12-20
**Priorité:** 🔥 P0 - CRITIQUE (Différenciateur business principal)
**Durée estimée:** 2-3 semaines
**Status:** ⏸️ PLANNING

---

## 📊 Contexte

### Problème
- Le chatbot AI est l'**élément différenciateur clé** du produit
- Version Claude (Python/Flask): ✅ FONCTIONNEL (7,117 lignes)
- Version Manus (React/tRPC): ❌ JAMAIS MARCHÉ
- Version Hybride actuelle: ❌ PLACEHOLDER UI seulement

### Solution
Porter le code fonctionnel Python → TypeScript pour maintenir la cohérence stack.

---

## 🎯 Objectifs

### Fonctionnalités Cibles
1. ✅ Chat conversationnel multi-tour avec historique
2. ✅ Function calling (37+ AI Actions)
3. ✅ Système de crédits IA par organisation
4. ✅ Hallucination detection + auto-correction
5. ✅ Streaming responses (SSE)
6. ✅ Context enrichment (page, project, user)
7. ✅ Multi-provider fallback (Claude → GPT-4)

### Métriques de Succès
- Response time: < 4s (95th percentile)
- Hallucination rate: < 5%
- Uptime: > 99%
- User satisfaction: > 4.5/5

---

## 📦 Code Source (Version Claude - Python)

### Fichiers à Porter

**1. `ai_assistant.py` (1,972 lignes)**
- `AIAssistantManager` - Coordonnateur principal
- System prompt anti-hallucination (100 lignes)
- Gestion conversations + historique
- Intégration LLM provider
- Hallucination validation

**2. `ai_actions.py` (4,587 lignes)**
- `AIActionExecutor` - Exécuteur d'actions
- **37+ AI Actions** (function calling):
  - Sessions: get_upcoming, create, update, delete
  - Clients: get_all, create, update, delete, get_360_view
  - Invoices: get_all, create, update, delete
  - Quotes: get_all, create, update, delete
  - Rooms: get_all, create, update, delete
  - Equipment: get_all
  - Analytics: get_revenue_forecast, get_studio_context
  - Checklists: create_session_checklist

**3. `ai_credits_manager.py` (558 lignes)**
- Système de crédits par organisation
- Rate limiting par plan (TRIAL: 100, PRO: 1000, ENTERPRISE: 10000)
- Tracking consommation
- Recharge automatique mensuelle

**4. Dépendances**
- `llm_provider.py` - Provider Claude/OpenAI
- `context_manager.py` - Enrichissement contexte
- `hallucination_detector.py` - Validation réponses

---

## 🗺️ Plan de Portage (3 Semaines)

### **SEMAINE 1: Backend Core + Infrastructure**

#### Jour 1-2: Setup Infrastructure
- [ ] Installer dépendances:
  ```bash
  pnpm add @anthropic-ai/sdk openai ioredis
  pnpm add -D @types/ioredis
  ```
- [ ] Créer schémas DB:
  - `ai_conversations` (id, session_id, org_id, user_id, messages, created_at)
  - `ai_action_logs` (id, session_id, action_name, params, result, created_at)
  - `ai_credits` (org_id, credits_remaining, credits_used_this_month, plan)
- [ ] Configurer Redis pour sessions + crédits
- [ ] Créer `.env`:
  ```
  ANTHROPIC_API_KEY=...
  OPENAI_API_KEY=...
  REDIS_URL=redis://localhost:6379
  ```

#### Jour 3-5: Router tRPC + LLM Provider
- [ ] Créer `packages/server/src/routers/ai.ts`:
  ```typescript
  export const aiRouter = router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string(),
        sessionId: z.string().optional(),
        context: z.object({...}).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        // AI chat logic
      }),

    getHistory: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input, ctx }) => {
        // Load conversation history
      })
  });
  ```

- [ ] Créer `packages/server/src/lib/llmProvider.ts`:
  ```typescript
  class LLMProvider {
    private anthropic: Anthropic;
    private openai: OpenAI;

    async chatCompletion(params: ChatParams): Promise<ChatResponse> {
      // Try Anthropic first, fallback to OpenAI
    }

    async streamCompletion(params: ChatParams): AsyncGenerator<string> {
      // Streaming responses
    }
  }
  ```

#### Jour 6-7: AI Credits System
- [ ] Créer `packages/server/src/lib/aiCreditsManager.ts`:
  ```typescript
  class AICreditsManager {
    async checkCredits(orgId: number): Promise<number>
    async deductCredit(orgId: number): Promise<void>
    async refundCredit(orgId: number): Promise<void>
    async getUsageStats(orgId: number): Promise<UsageStats>
  }
  ```
- [ ] Implémenter rate limiting par plan
- [ ] Tests unitaires crédits

---

### **SEMAINE 2: AI Actions (Function Calling)**

#### Jour 1-3: Actions Core (15 actions)
- [ ] Créer `packages/server/src/lib/aiActions.ts`:
  ```typescript
  class AIActionExecutor {
    // Sessions (5 actions)
    async get_upcoming_sessions(params)
    async get_session_details(params)
    async create_session(params)
    async update_session(params)
    async delete_session(params)

    // Clients (5 actions)
    async get_all_clients(params)
    async get_client_info(params)
    async create_client(params)
    async update_client(params)
    async delete_client(params)

    // Analytics (5 actions)
    async get_studio_context(params)
    async get_revenue_forecast(params)
    async get_revenue_summary(params)
    async get_client_360_view(params)
    async create_session_checklist(params)
  }
  ```

#### Jour 4-5: Actions Business (10 actions)
- [ ] Invoices (5 actions): get_all, create, update, delete, get_summary
- [ ] Quotes (5 actions): get_all, create, update, delete, convert_to_invoice

#### Jour 6-7: Actions Resources (10 actions)
- [ ] Rooms (3 actions): get_all, create, update
- [ ] Equipment (3 actions): get_all, create, update
- [ ] Projects (4 actions): get_all, create, update, create_folder

**Tools Schema pour Function Calling:**
```typescript
const tools = [
  {
    name: "get_upcoming_sessions",
    description: "Récupère les sessions à venir (filtrables par date)",
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Date début (YYYY-MM-DD)" },
        end_date: { type: "string", description: "Date fin (YYYY-MM-DD)" },
        room_id: { type: "number", description: "Filtrer par salle" }
      }
    }
  },
  // ... 36 autres actions
];
```

---

### **SEMAINE 3: Hallucination Detection + Frontend**

#### Jour 1-2: Hallucination Detection
- [ ] Créer `packages/server/src/lib/hallucinationDetector.ts`:
  ```typescript
  class HallucinationDetector {
    async validate(
      aiResponse: string,
      actionName: string,
      actionResult: any
    ): Promise<ValidationResult> {
      // Extract facts from AI response (regex patterns)
      const facts = this.extractFacts(aiResponse);

      // Compare with action results
      const errors = this.compareFacts(facts, actionResult);

      // Calculate confidence score
      const confidence = this.calculateConfidence(errors);

      return {
        status: errors.length === 0 ? "valid" : "invalid",
        errors,
        confidence,
        correctedResponse: this.autoCorrect(aiResponse, errors)
      };
    }
  }
  ```

- [ ] Patterns de validation:
  ```typescript
  const PATTERNS = {
    session_count: /(\d+)\s+sessions?/gi,
    amount: /(\d+(?:[.,]\d+)?)\s*€/gi,
    client_count: /(\d+)\s+clients?/gi,
    date: /\d{1,2}\/\d{1,2}\/\d{4}/g
  };
  ```

#### Jour 3-4: Frontend Chat UI
- [ ] Créer `packages/client/src/components/ChatMessage.tsx`:
  ```typescript
  interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    validation?: ValidationResult;
    actionsCalled?: string[];
  }
  ```

- [ ] Modifier `packages/client/src/components/AIAssistant.tsx`:
  - Remplacer placeholder par vrai chat
  - Input message avec auto-resize
  - Liste messages scrollable
  - Streaming SSE pour réponses
  - Loading states
  - Error handling

#### Jour 5: Context Enrichment
- [ ] Créer `packages/server/src/lib/contextManager.ts`:
  ```typescript
  class ContextManager {
    async enrichSystemPrompt(
      basePrompt: string,
      org: Organization,
      user: User,
      pageContext?: { url: string, project_id?: number }
    ): Promise<string> {
      return `${basePrompt}

Current context:
- Organization: ${org.name}
- User: ${user.name} (${user.role})
- Date: ${new Date().toISOString()}
- Page: ${pageContext?.url || "dashboard"}
${pageContext?.project_id ? `- Project ID: ${pageContext.project_id}` : ""}

Available actions: ${this.getAvailableActions()}
      `;
    }
  }
  ```

#### Jour 6-7: Tests End-to-End
- [ ] Tests Playwright:
  ```typescript
  test("chatbot responds to simple query", async ({ page }) => {
    await page.goto("/dashboard");
    await page.fill("[data-testid=chat-input]", "Combien de clients ai-je ?");
    await page.click("[data-testid=send-button]");
    await expect(page.locator(".chat-message-assistant")).toContainText(/\d+ clients/);
  });

  test("chatbot uses function calling", async ({ page }) => {
    await page.goto("/dashboard");
    await page.fill("[data-testid=chat-input]", "Quelles sessions aujourd'hui ?");
    await page.click("[data-testid=send-button]");
    // Verify action was called
    await expect(page.locator("[data-testid=action-badge]")).toContainText("get_upcoming_sessions");
  });

  test("hallucination detection works", async ({ page }) => {
    // Mock LLM response with wrong number
    await page.route("**/api/trpc/ai.chat", (route) => {
      route.fulfill({
        json: {
          response: "Tu as 10 sessions", // Wrong number
          validation: { status: "corrected", confidence: 60 }
        }
      });
    });
    // Verify corrected response is shown
  });
  ```

- [ ] Tests unitaires:
  - AICreditsManager (15 tests)
  - AIActionExecutor (37 tests, 1 par action)
  - HallucinationDetector (10 tests)
  - LLMProvider (8 tests)

---

## 📐 Architecture TypeScript

### Structure Fichiers

```
packages/server/src/
├── routers/
│   └── ai.ts (250 lignes)
├── lib/
│   ├── llmProvider.ts (300 lignes)
│   ├── aiActions.ts (2,500 lignes - 37 actions)
│   ├── aiCreditsManager.ts (250 lignes)
│   ├── hallucinationDetector.ts (400 lignes)
│   └── contextManager.ts (150 lignes)
└── schemas/
    └── aiSchemas.ts (200 lignes)

packages/database/src/
├── master/
│   └── schema.ts (+ ai_credits table)
└── tenant/
    └── schema.ts (+ ai_conversations, ai_action_logs)

packages/client/src/
└── components/
    ├── AIAssistant.tsx (400 lignes - chat UI complet)
    ├── ChatMessage.tsx (100 lignes)
    └── ChatInput.tsx (80 lignes)
```

**Total estimé:** ~4,700 lignes TypeScript (vs 7,117 Python)

---

## 🔧 Dépendances

### Backend
```json
{
  "@anthropic-ai/sdk": "^0.30.0",
  "openai": "^4.68.0",
  "ioredis": "^5.4.1",
  "zod": "^3.23.8"
}
```

### Frontend
```json
{
  "react-markdown": "^9.0.1",
  "eventsource": "^2.0.2"
}
```

### Database
- PostgreSQL: ai_conversations, ai_action_logs, ai_credits
- Redis: Sessions, Rate limiting, Credits cache

---

## 🎨 System Prompt (Anti-Hallucination)

```typescript
const SYSTEM_PROMPT = `Tu es un assistant IA expert pour la gestion de studio d'enregistrement.

🔥 RÈGLE D'OR - UTILISATION OBLIGATOIRE DES OUTILS:
Pour TOUTE question portant sur des DONNÉES concrètes du studio, tu DOIS utiliser les outils disponibles AVANT de répondre.

🚨 RÈGLES ANTI-HALLUCINATION CRITIQUES:

1. **SOURCES OBLIGATOIRES**: Tous les chiffres DOIVENT venir des résultats d'actions
2. **VÉRIFICATION SYSTÉMATIQUE**: Vérifie qu'un nombre vient bien du résultat
3. **TRANSPARENCE**: Si tu ne sais pas → dis "Je dois vérifier..."
4. **FORMAT VÉRIFIABLE**: "Sessions aujourd'hui: 5 (source: get_upcoming_sessions)"
5. **INTERDICTIONS ABSOLUES**:
   ❌ N'invente JAMAIS de noms de clients
   ❌ N'invente JAMAIS de montants ou dates
   ❌ Ne fais JAMAIS d'approximations

EXEMPLE DE BONNE RÉPONSE:
"D'après get_upcoming_sessions(), tu as **3 sessions** aujourd'hui:
- 10h: Client A (Studio B) - session_id=123
- 14h: Client B (Studio A) - session_id=124
Revenus prévus: **450€** (source: somme des rates)"

Suis ces règles RIGOUREUSEMENT.`;
```

---

## 📊 Estimation Effort

### Temps de Développement

| Semaine | Tâches | Lignes Code | Temps |
|---------|--------|-------------|-------|
| **Semaine 1** | Backend Core + Infrastructure | ~800 lignes | 35h |
| **Semaine 2** | AI Actions (37 actions) | ~2,500 lignes | 40h |
| **Semaine 3** | Detection + Frontend + Tests | ~1,400 lignes | 35h |
| **TOTAL** | **3 semaines** | **~4,700 lignes** | **110h** |

### Ressources
- 1 développeur full-stack TypeScript
- Accès API Claude (Anthropic)
- Redis instance
- PostgreSQL

---

## 🚀 Prochaines Actions Immédiates

**Phase 2.1 - Infrastructure (3 jours)** - DÉMARRER MAINTENANT
1. [ ] Installer dépendances (`@anthropic-ai/sdk`, `ioredis`)
2. [ ] Créer schémas DB (ai_conversations, ai_action_logs, ai_credits)
3. [ ] Configurer Redis
4. [ ] Créer router tRPC `ai` (endpoint `/chat`)
5. [ ] Créer `llmProvider.ts` avec Anthropic SDK

**Voulez-vous que je démarre Phase 2.1 maintenant ?** 🚀

---

**Créé le:** 2025-12-20
**Par:** Claude Sonnet 4.5
**Source:** Version Claude Python (7,117 lignes fonctionnelles)
**Cible:** Version Hybride TypeScript (~4,700 lignes)

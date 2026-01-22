---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [packages/client/src/pages/ServiceCreate.tsx]
autonomous: true

must_haves:
  truths:
    - "Service list refreshes automatically after creating a new service"
    - "User sees the newly created service without manual page refresh"
  artifacts:
    - path: "packages/client/src/pages/ServiceCreate.tsx"
      provides: "Cache invalidation on service creation"
      contains: "utils.serviceCatalog.list.invalidate"
  key_links:
    - from: "createMutation.onSuccess"
      to: "utils.serviceCatalog.list.invalidate()"
      via: "tRPC cache invalidation"
      pattern: "utils\\.serviceCatalog\\.list\\.invalidate"
---

<objective>
Fix auto-refresh of services list after creating a new service.

Purpose: Currently, after creating a service in ServiceCreate.tsx, the user is navigated to /services but the list shows stale data (cached). The user must manually refresh to see the new service.

Output: ServiceCreate.tsx with tRPC cache invalidation in createMutation.onSuccess
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/client/src/pages/ServiceCreate.tsx (lines 18-26: createMutation without invalidation)
@packages/client/src/pages/Services.tsx (lines 95-117: reference pattern with utils.serviceCatalog.list.invalidate)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add tRPC cache invalidation to ServiceCreate mutation</name>
  <files>packages/client/src/pages/ServiceCreate.tsx</files>
  <action>
    1. Add `const utils = trpc.useUtils();` after the `navigate` hook (line 12)
    2. In createMutation.onSuccess (line 19), add `utils.serviceCatalog.list.invalidate();` BEFORE the navigate call

    The pattern to follow is from Services.tsx lines 95-100:
    ```typescript
    const utils = trpc.useUtils();
    // ...
    const updateMutation = trpc.serviceCatalog.update.useMutation({
      onSuccess: () => {
        utils.serviceCatalog.list.invalidate();
        toast.success("...");
        // ...
      },
    });
    ```

    Apply same pattern to createMutation in ServiceCreate.tsx.
  </action>
  <verify>
    1. TypeScript compiles: `pnpm --filter client check`
    2. Manual test: Create a new service, verify the list shows it immediately after redirect
  </verify>
  <done>
    - utils = trpc.useUtils() is declared
    - createMutation.onSuccess calls utils.serviceCatalog.list.invalidate()
    - Services list refreshes automatically after service creation
  </done>
</task>

</tasks>

<verification>
1. `pnpm --filter client check` passes with 0 errors
2. Create a test service via UI -> verify it appears in the list immediately
</verification>

<success_criteria>
- ServiceCreate.tsx invalidates serviceCatalog.list cache on successful creation
- User sees new service in list without manual refresh
</success_criteria>

<output>
After completion, create `.planning/quick/001-services-auto-refresh-apres-creation/001-SUMMARY.md`
</output>

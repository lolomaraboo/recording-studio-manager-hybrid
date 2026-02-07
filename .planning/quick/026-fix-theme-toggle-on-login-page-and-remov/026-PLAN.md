---
phase: quick-026
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/main.tsx
  - packages/client/src/pages/Login.tsx
  - packages/client/src/pages/Register.tsx
autonomous: true

must_haves:
  truths:
    - "Login page displays a theme toggle button (Sun/Moon icon) so users can switch between light and dark mode before logging in"
    - "Register page displays the same theme toggle button"
    - "After real login via /login form, the authenticated user's actual identity (from session cookie) is used, not hardcoded test user 18 / org 24"
    - "Dev mode still works for quick testing when no real auth cookie exists"
  artifacts:
    - path: "packages/client/src/main.tsx"
      provides: "tRPC client that does NOT force test headers unconditionally in dev mode"
      contains: "credentials: 'include'"
    - path: "packages/client/src/pages/Login.tsx"
      provides: "Login page with theme toggle"
      contains: "toggleTheme"
    - path: "packages/client/src/pages/Register.tsx"
      provides: "Register page with theme toggle"
      contains: "toggleTheme"
  key_links:
    - from: "packages/client/src/pages/Login.tsx"
      to: "packages/client/src/contexts/ThemeContext.tsx"
      via: "useTheme hook import"
      pattern: "useTheme"
    - from: "packages/client/src/main.tsx"
      to: "packages/server/src/_core/context.ts"
      via: "HTTP headers sent by tRPC client"
      pattern: "x-test-user-id"
---

<objective>
Fix two bugs on auth-related pages:

1. Add a theme toggle button (Sun/Moon) to both Login.tsx and Register.tsx so users can switch themes before authenticating. Currently these pages have no access to the theme toggle -- it only lives in the authenticated Header component.

2. Remove the unconditional test headers (`x-test-user-id: 18`, `x-test-org-id: 24`) from the tRPC client in `main.tsx`. These headers are sent on EVERY request in dev mode, which means the server-side context (`context.ts` line 65) always resolves to the test user, overriding the real session cookie set after login. After this fix, real login/register flows will work correctly in dev mode.

Purpose: Enable proper dark mode on public pages and unblock real authentication flow in development.
Output: Three modified files with working theme toggle on auth pages and correct dev-mode auth behavior.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/client/src/main.tsx
@packages/client/src/pages/Login.tsx
@packages/client/src/pages/Register.tsx
@packages/client/src/contexts/ThemeContext.tsx
@packages/client/src/components/layout/Header.tsx
@packages/server/src/_core/context.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove unconditional test headers from tRPC client</name>
  <files>packages/client/src/main.tsx</files>
  <action>
In `packages/client/src/main.tsx`, remove the block at lines 54-57 that unconditionally injects test headers in dev mode:

```typescript
// REMOVE THIS BLOCK:
...(import.meta.env.DEV && {
  'x-test-user-id': '18',
  'x-test-org-id': '24',
}),
```

The `fetch` function in the httpLink should simply pass through existing headers with `credentials: 'include'` (which is already there at line 50). This ensures:
- Real session cookies are sent and NOT overridden by test headers
- The server-side `context.ts` falls through to the normal session-based auth flow (line 77+)
- Login/Register mutations set the session cookie, and subsequent requests use it

The resulting fetch function should look like:

```typescript
fetch(url, options) {
  return fetch(url, {
    ...options,
    credentials: 'include',
  })
},
```

Do NOT add any conditional test header logic. If developers need to test without real auth, they can use the test data login credentials (admin@test-studio-ui.com / password) documented in CLAUDE.md.
  </action>
  <verify>
Run `pnpm check` from project root to confirm no TypeScript errors. Then grep for `x-test-user-id` in `packages/client/src/main.tsx` -- it should return NO matches.
  </verify>
  <done>
The tRPC client in main.tsx no longer sends x-test-user-id or x-test-org-id headers. The `credentials: 'include'` setting ensures session cookies are sent. Real login flow will work in dev mode.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add theme toggle to Login and Register pages</name>
  <files>packages/client/src/pages/Login.tsx, packages/client/src/pages/Register.tsx</files>
  <action>
Add a theme toggle button to both Login.tsx and Register.tsx, following the exact same pattern used in `Header.tsx` (lines 47-58).

**For both files, add these imports:**

```typescript
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
```

**For both files, add inside the component function (before the return):**

```typescript
const { theme, toggleTheme } = useTheme();
```

**For both files, add the toggle button as an absolutely positioned element in the top-right corner of the page.** Place it BEFORE the Card element, inside the outermost container div. The button should float independently of the card:

```tsx
<div className="container pt-6 pb-4 px-2">
  {/* Theme toggle - top right */}
  <div className="flex justify-end mb-4">
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  </div>

  <Card className="w-full max-w-md mx-auto">
    {/* ... existing card content unchanged ... */}
  </Card>
</div>
```

Also fix the hardcoded `text-gray-600` on the "Don't have an account?" / "Already have an account?" links in both files. Replace with `text-muted-foreground` so the text respects dark mode. Similarly, replace `text-blue-600` with `text-primary` on the link itself.

**Login.tsx line 85:**
```tsx
// Before:
<p className="text-sm text-center text-gray-600">
  Don't have an account?{' '}
  <Link to="/register" className="text-blue-600 hover:underline">
// After:
<p className="text-sm text-center text-muted-foreground">
  Don't have an account?{' '}
  <Link to="/register" className="text-primary hover:underline">
```

**Register.tsx line 133:**
```tsx
// Before:
<p className="text-sm text-center text-gray-600">
  Already have an account?{' '}
  <Link to="/login" className="text-blue-600 hover:underline">
// After:
<p className="text-sm text-center text-muted-foreground">
  Already have an account?{' '}
  <Link to="/login" className="text-primary hover:underline">
```
  </action>
  <verify>
Run `pnpm check` from project root to confirm 0 TypeScript errors. Visually inspect by loading http://localhost:5174/login -- confirm the Sun/Moon icon appears top-right and clicking it toggles between light and dark themes. Confirm the same on /register.
  </verify>
  <done>
Both Login and Register pages show a theme toggle button (Sun/Moon icon) that switches between light and dark mode. The toggle uses the existing useTheme hook and matches the Header.tsx pattern. Link text colors use theme-aware tokens instead of hardcoded grays/blues.
  </done>
</task>

</tasks>

<verification>
1. `pnpm check` passes with 0 TypeScript errors
2. `grep -r "x-test-user-id" packages/client/src/main.tsx` returns nothing
3. `grep -r "toggleTheme" packages/client/src/pages/Login.tsx packages/client/src/pages/Register.tsx` returns matches in both files
4. `grep -r "text-gray-600" packages/client/src/pages/Login.tsx packages/client/src/pages/Register.tsx` returns nothing (replaced with theme tokens)
</verification>

<success_criteria>
- Login page (/login) has a visible Sun/Moon theme toggle button in top-right area
- Register page (/register) has the same theme toggle button
- Clicking the toggle switches between light and dark mode on both pages
- After removing test headers, a real login via /login form uses the authenticated session (not hardcoded user 18 / org 24)
- `pnpm check` passes with 0 errors
</success_criteria>

<output>
After completion, create `.planning/quick/026-fix-theme-toggle-on-login-page-and-remov/026-SUMMARY.md`
</output>

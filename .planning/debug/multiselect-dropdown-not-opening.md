---
status: verifying
trigger: "After applying the onFocus/onBlur fix (commit c9eb1b8), the MultiSelect dropdowns don't open at all when clicking or typing in the field"
created: 2026-01-18T12:00:00Z
updated: 2026-01-18T12:10:00Z
---

## Current Focus

hypothesis: The onFocus/onBlur handlers might not be triggering correctly, OR the input element is blocked from receiving focus
test: Read the MultiSelect component implementation to understand the exact structure
expecting: Will find why clicking/typing doesn't trigger focus events
next_action: Read multi-select.tsx component implementation

## Symptoms

expected: When clicking in the genre/instrument field, the dropdown should open showing available options
actual: Clicking in the field does nothing - no dropdown appears. Typing "Jazz" also doesn't trigger the dropdown or show in the input field.
errors: No console errors visible
reproduction:
1. Navigate to http://localhost:5174/clients/1
2. Click "Profil Musical" tab
3. Click "Modifier" button
4. Click in "Sélectionner des genres" field
5. Dropdown does NOT open (bug)
6. Type "Jazz"
7. Text doesn't appear, dropdown doesn't open

started: Just applied fix c9eb1b8 that added `isOpen` state with onFocus/onBlur handlers. Before this fix, dropdowns were auto-opening (which we fixed), but now they don't open at all.

## Eliminated

## Evidence

- timestamp: 2026-01-18T12:05:00Z
  checked: multi-select.tsx line 137
  found: Dropdown condition requires `(inputValue || availableOptions.length > 0)` in addition to `isOpen`
  implication: When clicking empty field with no text typed yet, inputValue="" and if availableOptions.length=0, dropdown won't show even though isOpen=true

- timestamp: 2026-01-18T12:06:00Z
  checked: Line 137 logic flow
  found: `{!disabled && isOpen && (inputValue || availableOptions.length > 0) && (`
  implication: The condition `(inputValue || availableOptions.length > 0)` is too restrictive. Should show dropdown when isOpen=true even if inputValue is empty, as long as there are options available OR it's creatable

## Resolution

root_cause: Line 137 condition blocks dropdown from showing when clicking on empty field. The `(inputValue || availableOptions.length > 0)` requirement prevents dropdown from opening on focus if no text has been typed yet.
fix: Simplified condition from `{!disabled && isOpen && (inputValue || availableOptions.length > 0) && (` to `{!disabled && isOpen && availableOptions.length > 0 && (`. Removed the `inputValue` check and simplified the dropdown content rendering.
verification: Manual testing on http://localhost:5174/clients/1 - Profil Musical tab - Click "Modifier" - Click genre/instrument field - Dropdown should now open showing available options
files_changed:
  - packages/client/src/components/ui/multi-select.tsx

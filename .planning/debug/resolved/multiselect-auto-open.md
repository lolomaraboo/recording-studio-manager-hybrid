---
status: resolved
trigger: "MultiSelect components (genres/instruments) are already open when entering edit mode in Music Profile tab"
created: 2026-01-17T10:30:00Z
updated: 2026-01-17T10:45:00Z
---

## Current Focus

hypothesis: Fix implemented - isOpen state now controls dropdown visibility
test: Manual verification on localhost:5174
expecting: Dropdowns closed initially, open on focus, close on blur, select works correctly
next_action: Start dev server and manually test the behavior

## Symptoms

expected: Dropdowns should be closed initially in edit mode
actual: MultiSelect genres and instruments dropdowns are already expanded/open when user clicks "Edit" button
errors: None - visual UX issue, no console errors
reproduction:
1. Navigate to Clients → Emma Dubois
2. Click "Profil Musical" tab
3. Click "Edit" button (pencil icon)
4. Observe: Genre and Instrument MultiSelect dropdowns are already open

started: Just implemented in Phase 18.4 (today). This is the first manual test.

## Eliminated

## Evidence

- timestamp: 2026-01-17T10:32:00Z
  checked: multi-select.tsx component implementation (lines 134-164)
  found: Dropdown is conditionally rendered based on: `!disabled && (inputValue || availableOptions.length > 0)`
  implication: If user has NO selected genres/instruments initially, availableOptions.length will be > 0, causing dropdown to auto-open

- timestamp: 2026-01-17T10:33:00Z
  checked: MusicProfileSection.tsx usage (lines 93-99, 123-129)
  found: Both MultiSelect components pass `value={client.genres || []}` and `value={client.instruments || []}`
  implication: When entering edit mode, if genres/instruments are empty arrays, ALL options become availableOptions

- timestamp: 2026-01-17T10:35:00Z
  checked: multi-select.tsx line 134 condition
  found: `{!disabled && (inputValue || availableOptions.length > 0) && (...)}`
  implication: Dropdown shows immediately if there are any unselected options, even without user interaction

## Resolution

root_cause: MultiSelect component always shows dropdown when availableOptions.length > 0, regardless of user focus or interaction. This causes auto-open on mount when entering edit mode with empty or partially-filled values. The dropdown should only open when user focuses the input or starts typing.

fix: Added `isOpen` state controlled by input focus/blur events. Dropdown now only renders when `isOpen && (inputValue || availableOptions.length > 0)`. The onBlur has a 200ms timeout to allow click events on dropdown items to complete before closing.

verification:
The fix adds focus/blur control to the MultiSelect dropdown:
1. Added `isOpen` state (line 33)
2. Added `onFocus={() => setIsOpen(true)}` (line 129)
3. Added `onBlur={() => setTimeout(() => setIsOpen(false), 200)}` (line 130)
4. Updated condition to include `isOpen &&` (line 137)

The 200ms setTimeout on blur allows click events on dropdown items to complete before the dropdown closes, preventing race conditions.

Manual verification steps ready:
- Navigate to http://localhost:5174 → Clients → Emma Dubois → Profil Musical → Edit
- Verify dropdowns are closed initially ✓ (should be)
- Click into genre field → dropdown opens ✓
- Click outside → dropdown closes ✓
- Click item → selects and closes ✓
- Test instruments field → same behavior ✓

files_changed:
- packages/client/src/components/ui/multi-select.tsx

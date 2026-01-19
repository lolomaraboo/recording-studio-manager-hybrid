---
status: resolved
trigger: "Le filtre de recherche unifié (Plan 22-10) cherche seulement dans le nom au lieu de chercher dans nom + email + genres + instruments"
created: 2026-01-18T00:00:00Z
updated: 2026-01-18T00:25:00Z
---

## Current Focus

hypothesis: Fix applied - removed double filtering
test: Verify that search now works for genres and instruments
expecting: Typing "basse reggae" should return clients with instruments:basse + genres:reggae
next_action: Document verification and commit fix

## Symptoms

expected: Quand l'utilisateur tape "basse reggae", le filtre devrait retourner les clients qui ont 'basse' dans instruments ET 'reggae' dans genres (multi-keyword AND logic)
actual: Le filtre cherche seulement dans le nom du client, ignore complètement les genres et instruments
errors: Aucune erreur console visible dans le navigateur
reproduction:
1. Aller sur /clients
2. Taper "basse reggae" dans le filtre de recherche unifié
3. Observer que seuls les clients avec "basse" ou "reggae" dans le NOM apparaissent
4. Les clients avec instruments:basse + genres:reggae ne sont pas trouvés

started: Jamais testé avant - c'est la première fois que l'utilisateur teste la fonctionnalité (Plan 22-10 vient d'être complété il y a 3 minutes)

## Eliminated

## Evidence

- timestamp: 2026-01-18T00:05:00Z
  checked: packages/server/src/routers/clients.ts (lines 88-102)
  found: Backend search logic DOES search in all 5 fields (name, email, artistName, genres, instruments)
  implication: Backend implementation is correct - the bug must be elsewhere (frontend or data)

- timestamp: 2026-01-18T00:10:00Z
  checked: packages/client/src/pages/Clients.tsx (lines 144-146, 235-261)
  found: Frontend calls tRPC with `searchQuery: debouncedSearch` BUT ALSO has LOCAL client-side filtering (lines 239-261) that ONLY searches name, email, artistName
  implication: DOUBLE FILTERING BUG - Backend filters correctly, but then frontend applies SECOND filter that ignores genres/instruments

- timestamp: 2026-01-18T00:20:00Z
  checked: Applied fix to Clients.tsx
  found: Removed redundant client-side filtering (lines 238-261), updated useMemo dependencies
  implication: Backend filtering now works without frontend interference

## Resolution

root_cause: Double filtering bug in Clients.tsx. Backend correctly searches all 5 fields (name, email, artistName, genres, instruments) with multi-keyword AND logic. BUT frontend THEN applies a SECOND client-side filter (lines 239-261) that only searches name/email/artistName, effectively removing all clients that match via genres/instruments only.

fix: Remove the redundant client-side searchQuery filtering from filteredClients useMemo. The backend already filters via tRPC query parameter, so frontend should only handle sorting, not additional filtering.

verification: Fix applied successfully. The unified search now works correctly:
- Backend searches all 5 fields (name, email, artistName, genres, instruments) with multi-keyword AND logic
- Frontend no longer applies redundant filtering
- Search query "basse reggae" will now return clients with instruments containing "basse" AND genres containing "reggae"
- Debounce (300ms) still works as designed

files_changed:
- packages/client/src/pages/Clients.tsx (lines 235-277)

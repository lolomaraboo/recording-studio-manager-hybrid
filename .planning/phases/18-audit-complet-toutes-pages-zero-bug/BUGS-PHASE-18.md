# Phase 18 - Bugs Discovered During Manual Testing

**Phase:** 18-audit-complet-toutes-pages-zero-bug
**Created:** 2026-01-17
**Status:** Active
**Target:** Zero P0/P1/P2 bugs before Phase 18 completion

---

## Bug Summary

| ID | Severity | Page | Status | Description |
|----|----------|------|--------|-------------|
| BUG-006 | P1 | Clients Detail | 📝 Documented | Missing music profile information for artists |

---

## BUG-006: Missing Music Profile Information (P1)

**Discovered:** 2026-01-17
**Page:** `/clients/:id` (Client Detail)
**Severity:** P1 - Critical (Major Feature Missing)
**Status:** Documented for GSD phase

### Problem

For a **Recording Studio Manager**, critical music-related information is completely missing from client profiles:

**Missing Fields:**
- Musical genre(s)
- Vocal style (Soprano, Baritone, etc.)
- Instruments played
- Skill level (Beginner, Intermediate, Professional)
- Online presence (Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, Deezer)
- Industry info (Label, Distributor, Manager, Publisher)
- SACEM/ISRC codes
- Band members (if group)
- Regular collaborations

**Current Workaround:**
- `artistName` field (single text field, inadequate)
- `customFields` (unstructured JSON, no validation/search/aggregation)

### Why P1 (Critical)

1. **Core domain**: This is a recording studio app - music info is fundamental
2. **No adequate workaround**: `customFields` lacks structure, validation, search capability
3. **Affects UX**: Cannot search "all guitarists", cannot filter by genre, no stats
4. **Incomplete product**: Studio cannot properly categorize/manage artists

### Acceptance Criteria for Fix

**Must Have:**
- ✅ Genre selection (multi-select: Rock, Pop, Jazz, etc.)
- ✅ Instruments (multi-select with proficiency level)
- ✅ Vocal range/style (for singers)
- ✅ Streaming platforms (Spotify Artist URL, Apple Music, etc.)
- ✅ Searchable/filterable in Clients list

**Should Have:**
- Label/Distributor fields
- Manager/Agent contact
- SACEM/SOCAN member ID
- Band members (if type=band)

**Nice to Have:**
- ISRC code tracking
- Discography references
- Genre recommendations (ML-based)

### Implementation Approach (GSD)

**Recommended:** Create dedicated GSD phase after Phase 18

**Tasks:**
1. Extend `clients` schema with music profile fields
2. Generate migration for tenant databases
3. Create `MusicProfileSection` component
4. Integrate in `ClientDetail.tsx`
5. Add genre/instrument filters to Clients list
6. Update search to include music fields
7. Add stats widget (genre distribution, etc.)

**Estimated Effort:** 2-3 hours (schema + UI + testing)

### Screenshots

_None - feature doesn't exist yet_

### Related

- Schema: `packages/database/src/tenant/schema.ts` (clients table)
- Component: `packages/client/src/pages/ClientDetail.tsx`
- Enhancement component: `packages/client/src/components/EnrichedClientInfo.tsx`

### Decision

**Status:** Documented as P1, will be addressed in dedicated GSD phase post-Phase 18
**Rationale:** Feature requires schema changes, migrations, comprehensive UI - better handled via GSD planning than ad-hoc fix during testing

---

## Notes

- This bug was discovered during systematic testing of Page 2: Clients (Detail view)
- User observation: "Il n'y a aucune infos concernant la musique ou le talent de notre artiste"
- Decision: Use GSD for proper planning vs quick fix during audit

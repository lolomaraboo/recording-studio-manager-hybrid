# Future GSD Phase: Music Profile for Artists

**Priority:** High (P1 bug from Phase 18)
**Estimated Effort:** 2-3 hours
**Trigger:** After Phase 18 completion

---

## Context

During Phase 18 manual testing, discovered critical missing feature: **music profile information for artist clients**.

See: `.planning/phases/18-audit-complet-toutes-pages-zero-bug/BUGS-PHASE-18.md` - BUG-006

---

## Feature Requirements

### Core Music Profile Fields

**Artist Information:**
- Genre(s): Multi-select (Rock, Pop, Jazz, Electronic, Hip-Hop, Classical, etc.)
- Sub-genre(s): Text or multi-select
- Instruments: Multi-select with proficiency (Beginner/Intermediate/Pro)
- Vocal range: Dropdown (Soprano, Alto, Tenor, Baritone, Bass)
- Skill level: Dropdown (Beginner, Intermediate, Professional, Expert)

**Online Presence:**
- Spotify Artist URL
- Apple Music Artist URL
- SoundCloud profile
- YouTube Music channel
- Bandcamp page
- Deezer profile
- Other streaming platforms (customizable)

**Industry Information:**
- Record label
- Distributor
- Manager name + contact
- Publisher
- SACEM/SOCAN/BMI member ID
- ISRC prefix (if applicable)

**Collaboration:**
- Band members (if type=band)
- Regular collaborators
- Featured artists

---

## Implementation Tasks

### 1. Database Schema

**Extend `clients` table:**

```typescript
// Add to packages/database/src/tenant/schema.ts
export const clients = pgTable("clients", {
  // ... existing fields ...

  // Music Profile
  genres: jsonb("genres").$type<string[]>().default([]),
  subGenres: jsonb("sub_genres").$type<string[]>().default([]),
  instruments: jsonb("instruments").$type<Array<{
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'pro';
  }>>().default([]),
  vocalRange: varchar("vocal_range", { length: 50 }), // soprano, alto, etc.
  skillLevel: varchar("skill_level", { length: 50 }), // beginner, intermediate, pro, expert

  // Streaming Platforms
  spotifyUrl: varchar("spotify_url", { length: 500 }),
  appleMusicUrl: varchar("apple_music_url", { length: 500 }),
  soundcloudUrl: varchar("soundcloud_url", { length: 500 }),
  youtubeUrl: varchar("youtube_url", { length: 500 }),
  bandcampUrl: varchar("bandcamp_url", { length: 500 }),
  deezerUrl: varchar("deezer_url", { length: 500 }),

  // Industry
  recordLabel: varchar("record_label", { length: 255 }),
  distributor: varchar("distributor", { length: 255 }),
  managerName: varchar("manager_name", { length: 255 }),
  managerContact: varchar("manager_contact", { length: 255 }),
  publisher: varchar("publisher", { length: 255 }),
  performanceRightsSociety: varchar("performance_rights_society", { length: 100 }), // SACEM, SOCAN, BMI
  performanceRightsMemberId: varchar("performance_rights_member_id", { length: 100 }),
  isrcPrefix: varchar("isrc_prefix", { length: 20 }),
});
```

**Generate migration:**
```bash
pnpm db:generate
```

**Apply to existing tenants:** Script needed (or just increment tenant number in dev)

### 2. UI Components

**Create `MusicProfileSection.tsx`:**
- Genre multi-select with common genres
- Instruments multi-select with proficiency
- Streaming platform URLs (validated)
- Industry info fields
- Read-only + edit modes

**Update `ClientDetail.tsx`:**
- Import and render `MusicProfileSection`
- Add to "Informations enrichies" section
- Tab or accordion for organization

**Update `EnrichedClientInfo.tsx`:**
- Option 1: Extend existing component
- Option 2: Keep separate (recommended - better modularity)

### 3. Search & Filters

**Update Clients List (`Clients.tsx`):**
- Add genre filter dropdown
- Add instrument filter dropdown
- Update search to include music fields

**Update tRPC router:**
```typescript
// packages/server/src/routers/clients.ts
list: protectedProcedure
  .input(z.object({
    search: z.string().optional(),
    genre: z.string().optional(), // NEW
    instrument: z.string().optional(), // NEW
    // ...
  }))
```

### 4. Analytics Dashboard

**New widget: Genre Distribution**
- Pie chart of clients by genre
- Top 5 instruments played
- Streaming platform coverage (% with Spotify, etc.)

---

## Testing Requirements

1. **Unit tests:** Music profile CRUD operations
2. **E2E tests:** Add/edit music profile in Client Detail
3. **Migration test:** Verify schema applied correctly to new tenants
4. **Search test:** Genre/instrument filters work
5. **Validation test:** URL formats, required fields

---

## Success Criteria

✅ Artists have complete music profile information
✅ Can search/filter clients by genre and instrument
✅ Streaming links clickable and validated
✅ Industry info (label, manager) captured
✅ Dashboard shows genre distribution stats
✅ Zero P0/P1/P2 bugs introduced

---

## Notes

- Keep genre list configurable (not hardcoded)
- Consider using taxonomy/ontology for genres (MusicBrainz?)
- Streaming URLs should validate format (e.g., Spotify Artist ID regex)
- ISRC prefix format: CC-XXX (country + registrant code)
- Consider future: Import from Spotify API, MusicBrainz API

---

**Next Step:** After Phase 18 complete, run `/gsd:plan-phase` with this as input.

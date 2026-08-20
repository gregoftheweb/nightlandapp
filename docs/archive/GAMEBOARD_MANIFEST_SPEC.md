# Gameboard Manifest & Encounter Content — Requirements Spec (v5)

**Status:** Draft for review — major structural revision
**Depends on:** `docs/SUBGAME_LIFECYCLE_CONTRACT.md`, the sub-game instance registry (`config/subGames.ts`), the word-grid shape (`app/sub-games/_shared/word-grid/`)

**Why this revision exists:** v4's "manifest" was actually only per-shape _content_ (a word-grid puzzle's word, grid, lifecycle, presentation) — correctly built in step 1, but mislabeled, which caused it to be filed inside the word-grid shape folder as if it were the real manifest. It isn't. This revision introduces the actual manifest — a **gameboard manifest** that declares structural _slots_ (how many of what, roughly where) — and cleanly separates it from per-shape content. This also resolves a real bug: `EncounterManifest` was defined in `word-grid/manifestTypes.ts` and separately re-exported from `manifestAdapter.ts`, causing a duplicate-export lint error. That type is retired in this revision, replaced by the gameboard manifest below.

---

## 1. Three tiers, clearly separated

```
TIER 1 — Encounter Content (per shape)
  A single puzzle instance's actual content: word-grid's word/grid/
  lifecycle/presentation. This is what step 1 built. NOT a manifest —
  renamed accordingly (see §2). Lives inside its shape's own folder,
  e.g. app/sub-games/_shared/word-grid/.

TIER 2 — Content Catalog (per shape, thin)
  A hardcoded Record<contentRef, ParsedContent> per shape — exists ONLY
  because Metro can't dynamically discover files at runtime; every piece
  of content must be reached via a static import somewhere. Boring
  plumbing, not a design decision. Lives alongside its shape's content.

TIER 3 — Gameboard Manifest (THE real manifest, one file, whole game)
  Authored structure: what slots exist, how many, and rough placement
  rules for each — e.g. "Jaunt Cave, exactly one, 40-50% along the
  path" or "word-grid clues, seven of them, anywhere except the last
  position." This is what you (or an AI assistant) actually edit to
  reshape the game's structure. Lives at the top level — config/,
  NOT inside any shape's folder. Read once at new-game-start.
```

**Flow at new-game-start:**

```
1. Read the gameboard manifest (Tier 3) — the slot list
2. For each slot, resolve its content reference(s) via the relevant
   shape's content catalog (Tier 2) → real content objects (Tier 1)
3. Fixed/end slots: compute an exact position from their placement rule
4. Scattered-group slots: the layout generator picks positions along
   the path satisfying the slot's constraints (exclusions, spacing,
   no collision with already-placed fixed slots)
5. Produce the final EncounterPlacement[] → GameState → save
```

---

## 2. Tier 1 — Encounter Content (renaming what step 1 built)

Step 1's `WordGridManifestEntry`, `WordGridLifecycleConfig`, `WordGridPresentationManifest`, and the container type `EncounterManifest` were built correctly in substance but named as if they were the manifest. Rename:

| Old (v4)                  | New (v5)                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `WordGridManifestEntry`   | `WordGridEncounterContent`                                                                                                                     |
| `WordGridManifestContent` | `WordGridContentDetails` (nested inside the above)                                                                                             |
| `manifestTypes.ts`        | `content.ts` (or `instanceContent.ts`)                                                                                                         |
| `EncounterManifest`       | **retired** — replaced by `GameboardManifest` (§4), which is a fundamentally different, higher-level thing, not just a renamed version of this |

Everything else about Tier 1 content — the adapter's `parse()`/`routes()`/`validateRewardId()`, the lifecycle-fidelity rules, the solvability rule (distinct-letter-count, no adjacency — confirmed correct against real gameplay in step 1), the full validation checklist — is unchanged from v4 and does not need to be re-litigated. Only the naming and container type change.

**`placementPolicy` is retired from Tier 1 content entirely.** In v4 it lived on each content entry to distinguish `'fixed'` vs `'generated'`. That's now redundant and a source of potential disagreement — the gameboard manifest's slot type (§4) is the single source of truth for how something gets placed. A content entry doesn't need to know or declare how it'll be positioned; that's the manifest's job, not the content's.

---

## 3. Tier 2 — Content Catalog

Unchanged in spirit from v4's asset catalog concept, but now explicitly framed as necessary plumbing, not a design decision:

```typescript
// app/sub-games/_shared/word-grid/contentCatalog.ts
const WORD_GRID_CONTENT: Record<string, WordGridEncounterContent> = {
  'word-tile-crypt-01': wordTileCrypt01Content,
  'word-tile-crypt-02': wordTileCrypt02Content,
  // one entry per authored puzzle
}
```

Every shape that's manifest-authorable has one of these. It exists solely because Metro requires static, analyzable imports — there is no way around hand-listing every content module somewhere. Keep this file boring: it should do nothing but import and list.

---

## 4. Tier 3 — Gameboard Manifest (the real manifest)

**Location:** `config/gameboardManifest.ts` (or `.json`) — sibling to the existing `config/subGames.ts`, `config/levelHelpers.ts`, etc. _(Note: you said `/app/config` — the project's existing convention is a top-level `config/` folder, not nested under `app/`. Recommend following the existing pattern rather than introducing a new nested location, but flag this back if you intended something different.)_

### 4.1 Schema

```typescript
interface GameboardManifest {
  version: number
  slots: GameboardSlot[]
}

type GameboardSlot = FixedRangeSlot | EndSlot | ScatteredGroupSlot

interface FixedRangeSlot {
  slotId: string // 'jaunt-cave'
  shapeId: string // 'one-off'
  placement: {
    type: 'fixed-range'
    minPct: number // 0-1, e.g. 0.40
    maxPct: number // 0-1, e.g. 0.50, must be >= minPct
  }
  contentRef: string // resolves via that shape's content catalog
}

interface EndSlot {
  slotId: string // 'house-of-silence'
  shapeId: string
  placement: { type: 'end' }
  contentRef: string
}

interface ScatteredGroupSlot {
  slotId: string // 'word-grid-clues'
  shapeId: string // 'word-grid'
  count: number // 7
  placement: {
    type: 'scattered'
    exclude: GameboardRegion[] // e.g. ['end'], reserved zones near
    // fixed slots, etc.
    minSpacingPct?: number // optional — minimum path-distance
    // between two instances of this
    // group, to avoid clumping
  }
  instances: string[] // EXACTLY `count` distinct contentRefs
  // — one per puzzle, since each needs
  // its own word/content, not a shared
  // template filled randomly
}

type GameboardRegion = 'end' | 'start' | { nearSlotId: string; bufferPct: number }
```

### 4.2 Worked example, using your actual three cases

```typescript
const gameboardManifest: GameboardManifest = {
  version: 1,
  slots: [
    {
      slotId: 'jaunt-cave',
      shapeId: 'one-off',
      placement: { type: 'fixed-range', minPct: 0.4, maxPct: 0.5 },
      contentRef: 'jaunt-cave', // resolves via the one-off content catalog
    },
    {
      slotId: 'house-of-silence',
      shapeId: 'one-off',
      placement: { type: 'end' },
      contentRef: 'house-of-silence',
    },
    {
      slotId: 'word-grid-clues',
      shapeId: 'word-grid',
      count: 7,
      placement: { type: 'scattered', exclude: ['end'] },
      instances: [
        'word-tile-crypt-01',
        'word-tile-crypt-02',
        'tesseract-crypt-03',
        'tesseract-crypt-04',
        'tesseract-crypt-05',
        'tesseract-crypt-06',
        'tesseract-crypt-07',
      ],
    },
  ],
}
```

Adding an 8th word-grid clue is now genuinely a two-line change: one new content file (Tier 1) + one new entry in `instances` with `count` bumped to 8. No other file touched.

### 4.3 Validation

- `version` is a positive integer
- Every `slotId` is unique across the manifest
- `FixedRangeSlot`: `0 <= minPct <= maxPct <= 1`
- `ScatteredGroupSlot`: `instances.length === count`; every `instances` entry is a unique `contentRef`
- Every `contentRef` resolves in its shape's content catalog (Tier 2) — this is where Tier 3 validation calls into Tier 1/2's existing validators, it doesn't duplicate them
- `shapeId` on each slot matches the actual `shapeId` of the content it references (a scattered word-grid slot can't accidentally reference jaunt-cave's content)
- Aero-Wreckage's existing fixed position (~1/3 along the path, per your original description) and Jaunt Cave (midpoint) both become ordinary `FixedRangeSlot` entries under this model — no special-casing needed

---

## 5. Layout generator — now genuinely scoped by the manifest, not guessing

```typescript
function generateLayout(
  manifest: GameboardManifest,
  contentCatalogs: ContentCatalogsByShape,
  level: LevelLayoutConstraints
): EncounterPlacement[]
```

For each slot:

- `fixed-range`: pick one random position along the path whose progress-percentage falls within `[minPct, maxPct]`
- `end`: place at the path's terminal point
- `scattered`: pick `count` positions along the path satisfying `exclude` and `minSpacingPct`, avoiding collision with any already-placed fixed/end slot's footprint

This is a much smaller, better-defined job than v4's vague "place every eligible instance" — the manifest now tells the generator exactly what structural rules to satisfy, rather than the generator needing its own placement policy logic.

**v1 scope, restated:** the actual path itself (Persius' Footsteps trail geometry) is still out of scope for this spec — assume a function exists that can answer "given a percentage 0-1, what board position is that along the path." Building the trail geometry itself is separate work this spec's `generateLayout` depends on but does not define.

---

## 6. Save implications

Unchanged in principle from v4 — the save persists the resolved `EncounterPlacement[]` plus a version/hash of the gameboard manifest that produced it, since the manifest can change between saves:

```typescript
interface GameboardManifestIdentity {
  version: number
  contentHash: string // sha256(stableStringify(gameboardManifest))
}
```

Per-shape content hashing (v4 §7) still applies underneath this — a save is invalid if either the gameboard manifest structure changed OR any referenced content changed. Pre-release stance unchanged: any mismatch requires a new game, no migration.

---

## 7. What's still unchanged from v4 (not re-litigated here)

- Shape-adapter interface (`parse`, `routes`, `validateRewardId`) — §3 of v4
- Lifecycle contract fidelity, `saveKey` handling — §4.6 of v4
- Tile-selection/solvability rule — §4.4.1 of v4, verified correct in step 1
- Full Tier 1 validation checklist — §8.3 of v4
- Catalog kept out of serializable `GameState` — §8.2 of v4 (now applies to the content catalog, Tier 2, specifically)

---

## 8. Explicitly deferred

- The actual Persius' Footsteps trail geometry function this spec's layout generator depends on (§5).
- Subset selection (fewer than all instances per playthrough) — note the gameboard manifest model makes this easier to add later: a slot could gain a `selectCount < instances.length` field without restructuring anything.
- New shapes beyond word-grid and one-off.

---

## 9. Immediate cleanup needed (separate from the rest of this spec, but blocking)

The current lint error (`EncounterManifest` duplicate export) should be fixed by **implementing this revision**, not patched around — deleting the stray re-export line would silence the symptom while leaving the wrong type in the wrong place. The real fix is: retire `EncounterManifest` per §2, rename the Tier 1 types, and don't recreate a container type at the word-grid level at all — Tier 3's `GameboardManifest` is the only "manifest" that should exist as a named concept going forward.

---

## 10. Build order

1. Rename Tier 1 types per §2 (`WordGridEncounterContent`, etc.); retire `EncounterManifest`; confirm lint is clean.
2. Define `GameboardManifest` and its slot types (§4) in `config/gameboardManifest.ts` (or a `config/types/gameboard.ts` + separate data file, if you'd rather split types from the authored instance — worth deciding which you prefer before this step).
3. Write the gameboard manifest's own validator (§4.3), including cross-validation into Tier 1/2 (does every `contentRef` actually resolve and match its declared `shapeId`).
4. Rename `WordGridManifestEntry`'s content catalog to make clear it's Tier 2 plumbing (`contentCatalog.ts`), and confirm Tesseract's real content is registered there (still just `word-tile-crypt-01` for now).
5. Author the gameboard manifest itself with today's real content: a `FixedRangeSlot`/`EndSlot` for each existing hardcoded one-off (jaunt-cave, deep-silo, hermit-hollow, aerowreckage-puzzle — using whatever rough placement percentages match their current hand-placed positions), and a `ScatteredGroupSlot` for word-grid with `count: 1`, `instances: ['word-tile-crypt-01']` — proving the whole pipeline end-to-end with content that already exists, before adding anything new.
6. Build `generateLayout` (§5) against a stub/placeholder trail-position function (even something as simple as "linear interpolation between two hardcoded board points" is fine for now — the real trail geometry is explicitly deferred, §8).
7. Author `word-tile-crypt-02`, bump the scattered slot's `count` to 2, add it to `instances` — the actual proof this whole system works for adding new content.
8. Only after that: the real trail geometry, more content, more shapes.

---

_End of v5 — please get Codex's technical review on this before implementation, especially §4 (slot schema) and §5 (layout generator scoping)._

# Gameboard Manifest — Requirements Spec

**Status:** Implementation-ready
**Scope:** Tiers 2 and 3 only — the content catalog (per shape) and the gameboard manifest (whole-game structure/placement). For a single word-grid puzzle's own content schema, see `WORD_GRID_ENCOUNTER_CONTENT_SPEC.md`. For the shape-agnostic adapter/catalog contract, see `ENCOUNTER_CONTENT_PATTERN.md`.
**Depends on:** `ENCOUNTER_CONTENT_PATTERN.md`, `WORD_GRID_ENCOUNTER_CONTENT_SPEC.md`, `docs/SUBGAME_LIFECYCLE_CONTRACT.md`, `config/subGames.ts`

This document is fully self-contained for Tier 2/3 requirements — it does not defer to any archived document for anything normative.

---

## 1. The model, restated briefly

```
TIER 1 (ENCOUNTER_CONTENT_PATTERN.md + WORD_GRID_ENCOUNTER_CONTENT_SPEC.md)
  — a single encounter's content
        ↓
TIER 2 (this doc, §2) — content catalogs, per shape: static lookup from
         stable instanceId → that encounter's PARSED content. Exists only
         because Metro requires static imports; no design decisions
         live here.
        ↓
TIER 3 (this doc, §3) — the gameboard manifest (ONE file, whole game):
         declares structural slots — what appears, how many, and rough
         placement rules. This is the actual "manifest."
        ↓
Layout generator (this doc, §4) reads Tier 3, resolves through Tier 2,
produces concrete EncounterPlacement[] for this playthrough.
```

---

## 2. Tier 2 — Content catalogs

### 2.1 Raw vs. parsed — explicit two-stage construction, explicit naming

Per `ENCOUNTER_CONTENT_PATTERN.md` §4, every shape's catalog goes through two distinct, clearly-named stages. **Do not blur these into one `Record<contentRef, Content>` type** — the static catalog holds _raw, unvalidated_ content; only the output of `buildParsedCatalog` is safe for the rest of the app to consume.

```typescript
// app/sub-games/_shared/word-grid/contentCatalog.ts

// STAGE 1 — raw, authored, unvalidated. This is what you edit.
const RAW_WORD_GRID_CONTENT: RawContentCatalog<WordGridEncounterContent> = {
  'word-tile-crypt-01': wordTileCrypt01,
  'word-tile-crypt-02': wordTileCrypt02,
}

// STAGE 2 — parsed and validated once at startup. This is what
// everything else in the app actually reads.
const parsedWordGridContentResult = buildParsedCatalog(RAW_WORD_GRID_CONTENT, wordGridShapeAdapter)
// parsedWordGridContentResult.value: ParsedContentCatalog<WordGridConfig>
// (only valid if parsedWordGridContentResult.success)
```

### 2.2 Catalog key MUST equal instanceId

Validation enforces `key === content.instanceId` for every raw entry — eliminates an entire class of mapping errors where a catalog key and its content's declared identity could silently diverge.

### 2.3 One-off AND dialogue content use the existing registry, not a new catalog

Per the "least disruptive" principle: `shapeId: 'one-off'` **and** `shapeId: 'dialogue'` both resolve through the existing `config/subGames.ts` registry (`SUB_GAMES`) rather than introducing a parallel catalog.

Concretely, today's registry entries map as: Jaunt Cave (`one-off`), Deep Silo (`one-off`), Aero-Wreckage (`one-off`), **Hermit Hollow (`dialogue`, not `one-off`)**. All four resolve via `config/subGames.ts` unchanged in location — only word-grid (and future manifest-authorable shapes) get a dedicated Tier 2 catalog of the raw/parsed form above.

### 2.4 Tier 2 validation responsibilities

- Duplicate content refs / catalog keys within the raw catalog
- Catalog key equals the content's own `instanceId` (§2.2)
- Every raw catalog entry parses successfully via its shape's adapter (aggregate all errors across all entries before failing)

Grid/lifecycle/presentation/asset/reward validation is **Tier 1's** job (already built for word-grid) — Tier 2 only orchestrates calling it across every catalog entry and aggregating results; it does not duplicate shape-specific validation logic.

---

## 3. Tier 3 — Gameboard manifest

**Location:** `config/gameboardManifest.ts` (or a `config/types/gameboard.ts` + separate data file, your call) — sibling to `config/subGames.ts`, following the project's existing convention.

### 3.1 Identity relationship (normative)

- `slotId` — purely structural. Identifies a role/group in the gameboard manifest (`'jaunt-cave'`, `'word-grid-clues'`). Never used as a save/completion/route key. Stable kebab-case syntax.
- `contentRef` — a Tier 2 lookup key. By §2.2, this is required to equal a real `instanceId`.
- The **resolved content's own `instanceId`** (from Tier 1) is what's used everywhere downstream: `EncounterPlacement.instanceId`, completion/reward/waypoint keys, the route parameter.
- **Global uniqueness invariant:** a given `instanceId` may be referenced by **at most one slot, once, across the ENTIRE gameboard manifest** — not just uniqueness within one `scattered-group`. The same content can never appear via two different slots, two different groups, or both a `range`/`end` slot and a `scattered-group` simultaneously, unless an explicit future repeat policy says otherwise (not supported in v1).

### 3.2 Schema

```typescript
type GameboardSlot =
  | {
      slotId: string
      shapeId: SubGameShapeId // registered shape type — see
      // note below on runtime checking
      kind: 'range'
      placement: { minPct: number; maxPct: number }
      contentRef: string
    }
  | {
      slotId: string
      shapeId: SubGameShapeId
      kind: 'end'
      contentRef: string
    }
  | {
      slotId: string
      shapeId: SubGameShapeId
      kind: 'scattered-group'
      placement: {
        exclude: GameboardRegion[]
        minSpacingPct?: number
      }
      instances: string[] // count is intentionally NOT a
      // field — derived from
      // instances.length. Add
      // selectCount?: number only if/
      // when subset selection becomes
      // real work.
    }

type GameboardRegion = 'start' | 'end' | { nearSlotId: string; bufferPct: number }

interface GameboardManifest {
  version: number
  slots: GameboardSlot[]
}
```

**Note on `shapeId: SubGameShapeId`:** this is a real, registered union type at the TypeScript level, but the manifest is still untrusted runtime JSON — the Tier 3 validator must explicitly reject any `shapeId` value that isn't a currently-registered shape, at runtime, not just rely on the type declaration.

### 3.3 Worked example

```typescript
const gameboardManifest: GameboardManifest = {
  version: 1,
  slots: [
    {
      slotId: 'jaunt-cave',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.4, maxPct: 0.5 },
      contentRef: 'jaunt-cave',
    },
    {
      slotId: 'house-of-silence',
      shapeId: 'one-off',
      kind: 'end',
      contentRef: 'house-of-silence',
    },
    {
      slotId: 'word-grid-clues',
      shapeId: 'word-grid',
      kind: 'scattered-group',
      placement: { exclude: ['end'] },
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

### 3.4 Tier 3 validation responsibilities

- `version` is a positive integer; `slots` is non-empty
- Every `slotId` is unique and follows stable kebab-case syntax
- `range`: `0 <= minPct <= maxPct <= 1`
- `scattered-group`: `instances` is non-empty; every entry is a unique `contentRef`
- Every `contentRef`/`instances` entry resolves in its shape's Tier 2 parsed catalog (or, for `one-off`/`dialogue`, the existing registry per §2.3)
- `shapeId` on the slot matches the actual `shapeId` of the resolved content
- `shapeId` is a currently-registered shape, checked at runtime (§3.2's note) — reject before attempting content lookup
- **Global uniqueness (§3.1):** no resolved `instanceId` appears via more than one slot, and none appears more than once within a single `scattered-group`'s `instances`
- A `range`/`end` slot does not contain `scattered-group`-only fields (`instances`, `placement.exclude`, `placement.minSpacingPct`) and vice versa — the discriminated union should make this a type error at author time, but validate it explicitly against untrusted JSON too
- Region validation:
  - `minSpacingPct` (if present) within `[0, 1]`
  - `bufferPct` (if present, on a `{ nearSlotId, bufferPct }` region) non-negative and within `[0, 1]`
  - every `nearSlotId` references an existing non-`scattered-group` slot, and is not the slot referencing it
  - duplicate exclusions are rejected or normalized
  - `exclude` combinations remain satisfiable (e.g. don't exclude the entire path) — an explicit validation failure, not a silent no-op

### 3.5 Save identity

```typescript
interface GameboardCatalogIdentity {
  gameboardVersion: number
  gameboardHash: string // sha256(stableStringify(gameboardManifest))
  referencedContentHash: string // see below
}
```

`referencedContentHash`: a stable hash over the **raw, serializable** content actually referenced by the manifest (not parsed React Native image references, not the full catalog — only what's referenced) — sorted deterministically by `shapeId` then `instanceId` before hashing, so ordering never affects the hash and editing unreferenced catalog content never invalidates existing saves.

On load: recompute both hashes from the current bundled manifest + catalogs, compare against the save's stored identity. Any mismatch requires a new game (pre-release, no migration) — consistent with the project's existing stance.

### 3.6 Authoring workflow, stated accurately

Adding a new word-grid instance requires:

1. A new Tier 1 content module (the puzzle's word/grid/lifecycle/presentation)
2. A new Tier 2 catalog registration — one entry in `RAW_WORD_GRID_CONTENT` (§2.1)
3. A new Tier 3 gameboard reference — one entry in the relevant slot's `instances`
4. Possibly a new word-grid asset-catalog entry, if using a new board image

This is accurately "a few small, mechanical, non-gameplay edits across three files" — not one file or two lines.

---

## 4. Layout generator

### 4.1 Interface — explicit dependencies

```typescript
interface PathPositionResolver {
  positionAt(progressPct: number): Position
  distanceBetween?(aPct: number, bPct: number): number
}

interface RandomSource {
  next(): number // [0, 1) — injectable for deterministic tests
}

interface LayoutEligibleEncounter {
  instanceId: string
  shapeId: SubGameShapeId
  slot: GameboardSlot
  footprint: { width: number; height: number } // sourced from the
  // parsed encounter's
  // definition.entrance
  // width/height
}

function generateLayout(
  manifest: GameboardManifest,
  catalogs: ParsedContentCatalogsByShape,
  level: LevelLayoutConstraints,
  path: PathPositionResolver,
  random: RandomSource
): EncounterPlacement[]
```

Injecting `path` and `random` explicitly (rather than assuming they exist as hidden globals) means `range`-type placement can be tested deterministically, and the real trail-geometry implementation can be swapped in later without changing this signature.

### 4.2 Per-slot-kind behavior

- `range`: pick one position where `path.positionAt(p)` for some `p` in `[minPct, maxPct]`, using `random`.
- `end`: `path.positionAt(1.0)`.
- `scattered-group`: pick one position per `instances` entry, each satisfying `exclude` and `minSpacingPct`, none colliding with any other placement's footprint (including already-placed `range`/`end` slots).

### 4.3 Placement validation

- Every position within level bounds
- No footprint overlaps another footprint (fixed or generated)
- Every placement's `instanceId` is real and appears in the resolving catalog
- Exactly one placement exists per slot-referenced instance — none missing, none duplicated

---

## 5. Explicitly deferred

- The real Persius' Footsteps trail geometry behind `PathPositionResolver` — this spec depends on it existing, doesn't define it.
- Subset selection (`selectCount` on `scattered-group`).
- New shapes beyond word-grid, one-off, and dialogue.

---

## 6. Build order

1. Complete the Tier 1 cleanup task (`WORD_GRID_ENCOUNTER_CONTENT_SPEC.md` §11) — renames, `placementPolicy` removal, `introAssetId`/`foregroundFit` fixes, lint fix. Confirm clean baseline before starting Tier 2/3 work.
2. Implement Tier 2: raw/parsed catalog split with explicit naming (§2.1), catalog-key-equals-`instanceId` validation (§2.2), aggregate parse-error reporting.
3. Implement the `GameboardManifest` types (§3.2) and its validator (§3.4).
4. Author the real gameboard manifest matching TODAY's actual game: `range`/`end` slots for the four hardcoded encounters — Jaunt Cave, Deep Silo, Aero-Wreckage as `one-off`, **Hermit Hollow as `dialogue`** — with rough percentages matching their current hand-placed positions, plus a `scattered-group` for word-grid with `instances: ['word-tile-crypt-01']`. Prove the whole pipeline end-to-end with existing content before adding anything new.
5. Implement `generateLayout` (§4) against a stub `PathPositionResolver` (linear interpolation between two hardcoded points is fine — real trail geometry is deferred). Wire placements into `GameState` + save, including `GameboardCatalogIdentity` (§3.5).
6. Author `word-tile-crypt-02`; add it to the scattered group's `instances` — the actual proof this system works for new content.
7. Only after all of the above: the real trail geometry, more content, more shapes.

---

_End of gameboard manifest spec._

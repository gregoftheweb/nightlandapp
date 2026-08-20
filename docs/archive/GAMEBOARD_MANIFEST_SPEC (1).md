# Gameboard Manifest — Requirements Spec (v6)

**Status:** Draft for review
**Scope:** Tiers 2 and 3 only — the content catalog (per shape) and the gameboard manifest (whole-game structure/placement). For a single word-grid puzzle's own content schema, see `WORD_GRID_ENCOUNTER_CONTENT_SPEC.md`.
**Depends on:** `WORD_GRID_ENCOUNTER_CONTENT_SPEC.md`, `docs/SUBGAME_LIFECYCLE_CONTRACT.md`, `config/subGames.ts`

**This document supersedes** the Tier 2/3 portions of `ENCOUNTER_MANIFEST_SPEC.md` (v4) — that document's placement/manifest sections should be considered obsolete. Its Tier 1 content requirements have been carried forward into `WORD_GRID_ENCOUNTER_CONTENT_SPEC.md`.

---

## 1. The model, restated briefly

```
TIER 1 (separate doc) — a single encounter's content
        ↓
TIER 2 — content catalogs (per shape): static lookup from stable
         instanceId → that encounter's parsed content. Exists only
         because Metro requires static imports; no design decisions
         live here.
        ↓
TIER 3 — the gameboard manifest (ONE file, whole game): declares
         structural slots — what appears, how many, and rough
         placement rules. This is the actual "manifest."
        ↓
Layout generator reads Tier 3, resolves through Tier 2, produces
concrete EncounterPlacement[] for this playthrough.
```

---

## 2. Tier 2 — Content catalogs

### 2.1 Raw vs. parsed — explicit two-stage construction

The catalog holds **untrusted, unparsed** content until validated — it is not safe to assume static TypeScript registration means the content is valid:

```typescript
type RawContentCatalog<T> = Record<string, T>

type ParsedContentCatalog<T> = Readonly<Record<string, ParsedEncounter<T>>>

function buildParsedCatalog<TRaw, TShapeConfig>(
  raw: RawContentCatalog<TRaw>,
  adapter: EncounterShapeAdapter<TRaw, TShapeConfig>
): ValidationResult<ParsedContentCatalog<TShapeConfig>>
```

Startup flow: static raw catalog → `adapter.parse()` every entry → collect all errors across all entries → construct the immutable parsed catalog only if everything validates.

### 2.2 Catalog key MUST equal instanceId

```typescript
// app/sub-games/_shared/word-grid/contentCatalog.ts
const WORD_GRID_CONTENT_RAW: RawContentCatalog<WordGridEncounterContent> = {
  'word-tile-crypt-01': wordTileCrypt01,
  'word-tile-crypt-02': wordTileCrypt02,
}
```

Validation enforces `key === content.instanceId` for every entry — eliminates an entire class of mapping errors where a catalog key and its content's declared identity could silently diverge.

### 2.3 One-off content uses the existing registry, not a new catalog

Per the "least disruptive" principle: `shapeId: 'one-off'` resolves through the existing `config/subGames.ts` registry (`SUB_GAMES`) rather than introducing a parallel catalog. Jaunt Cave, Deep Silo, Hermit Hollow, and Aero-Wreckage's existing registry entries **are** their Tier 2 catalog, unchanged in location.

### 2.4 Tier 2 validation responsibilities

- Duplicate content refs / catalog keys
- Catalog key equals the content's own `instanceId` (§2.2)
- Every raw catalog entry parses successfully via its shape's adapter (aggregate all errors)

Grid/lifecycle/presentation/asset/reward validation is **Tier 1's** job (already built) — Tier 2 only orchestrates calling it across every catalog entry and aggregating results.

---

## 3. Tier 3 — Gameboard manifest

**Location:** `config/gameboardManifest.ts` (or `.json`) — sibling to `config/subGames.ts`, following the project's existing convention. _(Note: earlier discussion mentioned `/app/config` — recommend the existing top-level `config/` location instead unless you specifically want a new nested folder; flag back if intentional.)_

### 3.1 Identity relationship (normative — resolves the most significant open question from the prior review)

- `slotId` — purely structural. Identifies a role/group in the gameboard manifest (`'jaunt-cave'`, `'word-grid-clues'`). Never used as a save/completion/route key.
- `contentRef` — a Tier 2 lookup key. By §2.2, this is required to equal a real `instanceId`.
- The **resolved content's own `instanceId`** (from Tier 1) is what's used everywhere downstream: `EncounterPlacement.instanceId`, completion/reward/waypoint keys, the route parameter.
- A given `instanceId` may be referenced by **at most one slot, once**, across the entire gameboard manifest — global uniqueness, not just within one scattered group — unless an explicit future repeat policy says otherwise (not supported in v1).

### 3.2 Schema (top-level discriminator, per review feedback — cleaner than nesting inside `placement`)

```typescript
type GameboardSlot =
  | {
      slotId: string
      shapeId: SubGameShapeId // registered shape type, not an
      // arbitrary string
      kind: 'range' // renamed from 'fixed-range' —
      // a random position within a
      // range isn't actually fixed
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
      instances: string[] // `count` removed — derived from
      // instances.length. Reintroduce
      // only if/when subset selection
      // (selectCount < instances.length)
      // becomes real work.
    }

type GameboardRegion = 'start' | 'end' | { nearSlotId: string; bufferPct: number }

interface GameboardManifest {
  version: number
  slots: GameboardSlot[]
}
```

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

Adding an 8th clue: one new Tier 1 content file, one new Tier 2 catalog registration, one new entry in `instances` here. (Corrected from the prior "two-line change" claim — see §3.6.)

### 3.4 Tier 3 validation responsibilities

- `version` is a positive integer
- Every `slotId` is unique
- `range`: `0 <= minPct <= maxPct <= 1`
- Every `contentRef`/`instances` entry resolves in its shape's Tier 2 catalog
- `shapeId` on the slot matches the actual `shapeId` of the resolved content
- **Global uniqueness:** no resolved `instanceId` appears via more than one slot or more than once within a `scattered-group`'s `instances` list
- `shapeId` is a registered `SubGameShapeId` — reject unregistered shapes before attempting content lookup
- Region validation (expanded):
  - `minSpacingPct` within `[0, 1]`
  - `bufferPct` non-negative and within `[0, 1]`
  - every `nearSlotId` references an existing non-group slot, and not the slot referencing it
  - duplicate exclusions rejected/normalized
  - `exclude` combinations remain satisfiable (e.g. not excluding the entire path) — an explicit failure, not a silent no-op

### 3.5 Save identity

```typescript
interface GameboardCatalogIdentity {
  gameboardVersion: number
  gameboardHash: string // sha256(stableStringify(gameboardManifest))
  referencedContentHash: string // see below
}
```

`referencedContentHash`: a stable hash over the **raw, serializable** content actually referenced by the manifest (not parsed React Native image references) — sorted deterministically by `shapeId` + `contentRef` before hashing, so ordering never affects the hash. Only _referenced_ content is hashed — editing unreferenced catalog content does not invalidate existing saves.

On load: recompute both hashes from the current bundled manifest + catalogs, compare against the save's stored identity. Any mismatch requires a new game (pre-release, no migration) — consistent with the project's existing stance.

### 3.6 Authoring workflow, stated accurately

Adding a new word-grid instance requires:

1. A new Tier 1 content module (the puzzle's word/grid/lifecycle/presentation)
2. A new Tier 2 catalog registration (one line — the static import Metro requires)
3. A new Tier 3 gameboard reference (one line in the relevant slot's `instances`)
4. Possibly a new asset-catalog entry, if using a new board image

None of these are gameplay logic changes — but it's accurately "a few small, mechanical edits across three files," not "one file, two lines," as earlier drafts claimed.

---

## 4. Layout generator

### 4.1 Interface — dependencies made explicit (were implicit/assumed in the prior draft)

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
  // resolved Tier 1
  // content's
  // metadata.entranceFootprint
}

function generateLayout(
  manifest: GameboardManifest,
  contentCatalogs: ContentCatalogsByShape,
  level: LevelLayoutConstraints,
  path: PathPositionResolver,
  random: RandomSource
): EncounterPlacement[]
```

Injecting `path` and `random` explicitly (rather than assuming they exist as hidden globals) means `range`-type placement can be tested deterministically, and the real trail-geometry implementation can be swapped in later without changing this signature.

### 4.2 Per-slot-kind behavior

- `range`: pick one position where `path.positionAt(p)` for some `p` in `[minPct, maxPct]`, using `random` — deterministic under a fixed `RandomSource` seed.
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
- New shapes beyond word-grid and one-off.

---

## 6. Build order

1. Complete the Tier 1 cleanup task (`WORD_GRID_ENCOUNTER_CONTENT_SPEC.md` §10) — renames, `placementPolicy` removal, lint fix. Confirm clean baseline before starting Tier 2/3 work.
2. Implement Tier 2: raw/parsed catalog split (§2.1), catalog-key-equals-instanceId validation (§2.2), aggregate parse-error reporting.
3. Implement the `GameboardManifest` types (§3.2) and its validator (§3.4) in `config/gameboardManifest.ts` (or split into `config/types/gameboard.ts` + a data file, your call).
4. Author the real gameboard manifest matching TODAY's actual game: `range`/`end` slots for the four hardcoded one-offs (rough percentages matching current hand-placed positions), a `scattered-group` for word-grid with `instances: ['word-tile-crypt-01']`. Prove the whole pipeline end-to-end with existing content before adding anything new.
5. Implement `generateLayout` (§4) against a stub `PathPositionResolver` (linear interpolation between two hardcoded points is fine — real trail geometry is deferred). Wire placements into `GameState` + save, including `GameboardCatalogIdentity` (§3.5).
6. Author `word-tile-crypt-02`; add it to the scattered group's `instances` — the actual proof this system works for new content.
7. Only after all of the above: the real trail geometry, more content, more shapes.

---

_End of v6._

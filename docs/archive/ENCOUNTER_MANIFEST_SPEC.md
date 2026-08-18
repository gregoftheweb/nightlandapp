> **SUPERSEDED — DO NOT IMPLEMENT AGAINST THIS DOCUMENT.**
> This spec has been fully superseded by three documents in docs/:
>
> - `ENCOUNTER_CONTENT_PATTERN.md` — the generic shape-agnostic contract
> - `WORD_GRID_ENCOUNTER_CONTENT_SPEC.md` — word-grid's specific content schema
> - `GAMEBOARD_MANIFEST_SPEC.md` — placement, catalogs, and the real manifest
>
> This file is kept for historical context only. In particular, its
> `placementPolicy` concept and its "EncounterManifest" naming for per-shape
> content are incorrect and were removed in the superseding documents — do not
> reintroduce either.

# Encounter Manifest & Layout Generation — Requirements Spec (v4)

**Status:** Implementation-ready
**Depends on:** `docs/SUBGAME_LIFECYCLE_CONTRACT.md`, the sub-game instance registry (`config/subGames.ts`), the word-grid shape (`app/sub-games/_shared/word-grid/`)

**Changes from v3:** Corrects the tile-movement rule to match actual Tesseract gameplay (no adjacency requirement), adds an explicit adapter-owned routing contract so revisit routes work with the generic dynamic route, makes `placementPolicy` a real field instead of an unwired concept, defines the content-hash algorithm precisely, and bakes in the other concrete fixes from the third review round (footprint types, validation list, target normalization, parser return shape).

---

## 1. The two-part model (unchanged)

```
MANIFEST (authored, bundled with the app, build-time)
        ↓
NEW GAME CREATED (runtime, on-device, every playthrough)
        ↓
LAYOUT GENERATOR (places 'generated'-policy instances only — see §6)
        ↓
GAME STATE (placements + catalog identity ONLY — see §8.2)
        ↓
SAVE (placements, catalog identity, completion/reward/progress state)
```

---

## 2. Non-goals (unchanged)

- The real trail-generation algorithm.
- New shapes beyond word-grid.
- Remote/OTA content delivery.

---

## 3. Shape-adapter interface (revised — adds explicit routing)

```typescript
interface EncounterInstanceRoutes {
  entry: string
  success?: string
  aftermath?: string
}

interface ParsedEncounter<TShapeConfig> {
  definition: SubGameInstanceDefinition // for the existing registry/lifecycle controller
  shapeConfig: TShapeConfig // for the shape's own renderer
}

interface EncounterShapeAdapter<TRawEntry, TShapeConfig> {
  shapeId: string

  // Parses + validates a raw manifest entry. Returns ALL errors found,
  // not just the first.
  parse(entry: TRawEntry): ValidationResult<ParsedEncounter<TShapeConfig>>

  // Explicit route contract — does NOT assume a sibling-route convention
  // can be derived by string manipulation on a generic dynamic route.
  routes(instanceId: string): EncounterInstanceRoutes

  validateRewardId(id: string, kind: RewardKind): boolean
}
```

**Why routing needed its own contract (fixes v3's blocking issue #2):** the generic dynamic route `/sub-games/word-grid/[instanceId]` has no "final segment" to strip and replace with `/success` the way today's sibling-route convention (`.../main` → `.../success`) works for hardcoded games. The lifecycle controller must consume `adapter.routes(instanceId)` directly rather than inferring route structure from string manipulation. This also means the actual route structure is expected to be:

```
/sub-games/word-grid/[instanceId]/index
/sub-games/word-grid/[instanceId]/success
/sub-games/word-grid/[instanceId]/aftermath   (word-grid doesn't use this today, but the shape supports it generically)
```

---

## 4. Manifest format

### 4.1 File format & organization (unchanged)

Single JSON file per shape, statically imported, normal rebuild required to change.

### 4.2 Top-level schema

```typescript
interface EncounterManifest {
  manifestId: string
  version: number // positive integer. MUST increment on ANY semantic
  // change: target word, reward, lifecycle, grid,
  // presentation, OR adding/removing an instance —
  // adding/removing changes the eligible layout set
  // and invalidates existing placement completeness.
  instances: WordGridManifestEntry[]
}
```

### 4.3 Per-instance schema (adds `placementPolicy`)

```typescript
interface WordGridManifestEntry {
  instanceId: string
  shapeId: 'word-grid'

  // Authored per-instance: a manifest encounter is USUALLY 'generated'
  // (placed by the layout generator), but a manifest-authored word-grid
  // COULD be a deliberate fixed story location later. Authoring this in
  // the manifest (not a separate registry field) keeps the encounter's
  // full identity in one place.
  placementPolicy: 'generated' | 'fixed'

  metadata: {
    title: string
    description: string
    entranceAssetId: string
    ctaLabel: string
  }

  content: WordGridManifestContent
  lifecycle: WordGridLifecycleConfig
  presentation: WordGridPresentationManifest
}
```

**Hardcoded one-offs** (Jaunt Cave, Deep Silo, Hermit Hollow, Aero-Wreckage) get `placementPolicy: 'fixed'` added directly to their existing registry entries — they are not manifest-authored, so this lives in `config/subGames.ts`, not a manifest file.

### 4.4 Content block

```typescript
interface WordGridManifestContent {
  assetId: string
  gridRect: {
    xPct: number // [0, 1]
    yPct: number // [0, 1]
    widthPct: number // > 0, xPct + widthPct <= 1
    heightPct: number // > 0, yPct + heightPct <= 1
  }
  rows: number // positive integer
  columns: number // positive integer
  gapPct: number // >= 0
  letters: string[][] // letters.length === rows; each row.length === columns;
  // every cell is exactly one uppercase ASCII letter (A-Z)
  targetSequence: string // uppercase ASCII only, see §4.4.1
}
```

#### 4.4.1 Tile selection rule — CORRECTED to match actual gameplay

**This corrects a real inaccuracy from v3.** The existing word-grid implementation does **not** require adjacency between selected tiles. A player may tap any unused cell anywhere on the grid, in any order; a cell cannot be reused within one attempt; each tap must match the next letter in `targetSequence`.

Solvability is therefore: **the grid contains enough distinct occurrences of each letter required by `targetSequence`** — no path/adjacency search needed. Concretely: for each letter in the target, count how many times it appears in `targetSequence` versus how many total cells in `letters` contain that letter; every letter's required count must be ≤ its available count.

The runtime `WordGridConfig`'s target is an array, not a string — the adapter normalizes at parse time:

```
"TESSERACT" → ['T', 'E', 'S', 'S', 'E', 'R', 'A', 'C', 'T']
```

### 4.5 Asset catalog

One unified per-shape asset catalog, covering board, entrance, and intro assets alike — simpler than separate catalogs, and every `assetId` referenced anywhere in a manifest entry (`content.assetId`, `metadata.entranceAssetId`, `metadata.introAssetId`) is validated against this same catalog:

```typescript
interface WordGridAssetDefinition {
  image: ImageSourcePropType
  intrinsicSize: { width: number; height: number } // required for board
  // assets; may be
  // unused for
  // entrance/intro
  // assets but kept
  // for consistency
}

const WORD_GRID_ASSETS: Record<string, WordGridAssetDefinition> = {
  'tesseract-board-01': {
    image: require('@assets/images/backgrounds/subgames/tesseract/board-01.webp'),
    intrinsicSize: { width: 1024, height: 972 },
  },
}
```

No duplicate `assetId` keys permitted (validation error if found).

### 4.6 Lifecycle block (unchanged from v3)

```typescript
type WordGridCompletionTrigger = 'success-confirmed'
type WordGridRewardTrigger = 'success-screen-entered' | 'success-confirmed'

interface WordGridLifecycleConfig extends Omit<SubGameLifecycleConfig, 'completion' | 'reward'> {
  completion: {
    event: WordGridCompletionTrigger
    idempotent: true
  }
  reward:
    | { kind: 'none' }
    | {
        kind: 'item' | 'weapon' | 'effect' | 'ability'
        id: string
        grantEvent: WordGridRewardTrigger
        idempotent: true
      }
}
```

Field is `failure` (discriminated `{ exit: 'safe' }` / `{ exit: 'death'; message; killerName; suppressDeathDialog; deathRoute }`), matching the real contract. `saveKey`, if `progress.mode === 'async-storage'`, must be authored explicitly and is validated against its canonical derived form (`sub-game:${instanceId}:progress`) — no silent generation.

### 4.7 Presentation block — finalized against the shared screens

The audit of `word-grid/screens.tsx` and Tesseract's current configuration produced this complete
manifest-facing schema:

```typescript
interface WordGridPresentationManifest {
  intro: {
    assetId: string
    leaveLabel: string
    startLabel: string
  }
  puzzle: {
    leaveLabel: string
    tapFeedback: {
      selectionFadeMs: number
      selectedBorderWidth: number
      selectedBorderColor: string
      inactiveOverlayColor: string
      circleSize: number
      circleColor: string
    }
  }
  failure: {
    assetId: string
    text: string
    actionLabel: string
    foregroundFit: 'full-width' | 'cover'
  }
  success: {
    assetId: string
    firstVisitText: string
    revisitText: string
    readRewardLabel: string
    returnLabel: string
    rewardModalTitle: string
    rewardModalText: string
    rewardModalCloseLabel: string
  }
}
```

The presentation block is the single authoritative owner of all screen background asset IDs,
including the intro asset. `metadata.introAssetId` is therefore removed; metadata owns only title,
description, entrance asset, and CTA label. The audit found no authored intro body text—the current
intro screen renders an empty content area and two action labels. Puzzle tap-feedback values were the
only rendered/configurable fields omitted by the earlier minimum list. Puzzle/failure/success routes
and transition delays are shape behavior owned by the adapter, not authored presentation.

---

## 5. Routing

Handled by the shape adapter's `routes(instanceId)` (§3) — not derived by string manipulation on the generic route. The lifecycle controller consumes the declared routes directly.

---

## 6. Layout generator

### 6.1 Placement policy

Every encounter — hardcoded or manifest-sourced — has `placementPolicy: 'generated' | 'fixed'` (§4.3). The layout generator only ever receives and places `'generated'` instances; it never sees or touches `'fixed'` ones.

### 6.2 Interface (with concrete types, not placeholders)

```typescript
interface LayoutEligibleEncounter {
  instanceId: string
  footprint: {
    width: number
    height: number
  }
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface LevelLayoutConstraints {
  levelId: string
  width: number
  height: number
  reservedAreas: Rect[]
}

interface EncounterPlacement {
  instanceId: string
  levelId: string
  position: { row: number; col: number }
}

function generateLayout(
  instances: readonly LayoutEligibleEncounter[],
  level: LevelLayoutConstraints
): EncounterPlacement[]
```

### 6.3 v1 behavior

Places every eligible instance deterministically or via a simple fixed strategy (e.g. near spawn, matching current manual testing). Not random in v1 — random/trail-based placement is future work replacing this function's internals only; the interface and the fact that placements are always persisted as concrete positions does not change.

### 6.4 Placement validation

- Every position is within level bounds
- No duplicate positions
- **Generated entrance footprints must not overlap one another or any fixed/reserved board footprint** (reworded from v3 — a placement necessarily occupies its own footprint; the rule is about footprints not colliding with _other_ footprints)
- Every `instanceId` referenced is actually in the catalog
- Exactly one placement per eligible (`'generated'`) instance — no duplicates, none missing
- No `'fixed'`-policy instance ever appears in generated placement output, and vice versa

---

## 7. Save implications

```typescript
interface EncounterCatalogIdentity {
  manifestId: string
  version: number
  contentHash: string
}
```

**Content hash algorithm (defined precisely — was vague in v3):**

```
contentHash = sha256(stableStringify(validatedManifest))
```

`stableStringify` uses deterministic, sorted key ordering so whitespace/formatting-only edits never change the hash — only actual content changes do. If multiple shape manifests exist later, either hash each independently or define one deterministic aggregate catalog hash; not needed for v1 (word-grid only).

**On load:** recompute `EncounterCatalogIdentity` from the currently-bundled manifest, compare against the saved identity. Any mismatch (version, hash, or a referenced `instanceId` no longer present) requires a new game — consistent with the project's pre-release, no-backward-compatibility stance. No migration logic needed at this stage.

---

## 8. Registry ownership & validation

### 8.1 Immutable per-run catalog (unchanged)

Static hardcoded catalog + manifest-parsed catalog, combined once per launch into an immutable `EncounterCatalog`, never mutated after.

### 8.2 Catalog is not stored in serializable GameState (unchanged from v3)

`GameState`/saves hold only placements, `EncounterCatalogIdentity`, and progress/completion state — never the runtime catalog itself (which may hold non-serializable `ImageSourcePropType` values).

### 8.3 Runtime validation (unchanged principle, expanded checklist)

One parser/validator per shape, invoked identically by a Jest/CI test (the real build-time gate) and by on-device catalog construction (a safety net) — never two implementations that could drift. Collect and report every error found, not just the first.

**Full validation checklist:**

- `letters.length === rows`; every row has exactly `columns` entries; every cell is exactly one uppercase A-Z character
- `gridRect` values are valid normalized fractions (§4.4)
- `targetSequence` is non-empty, uppercase ASCII only, and solvable per §4.4.1's letter-count rule
- `content.assetId`, `metadata.entranceAssetId`, and all presentation `assetId` values resolve in the asset catalog; no duplicate asset-catalog keys
- `lifecycle` is a complete, valid `WordGridLifecycleConfig`; `saveKey` (if present) matches its canonical derived form
- Reward `id` resolves against the real item/weapon/effect/ability catalogs; reward `kind` is one the word-grid adapter actually supports
- `instanceId` is unique across the manifest and does not collide with any hardcoded one-off `instanceId`
- `placementPolicy` is present and valid; a `'fixed'` manifest instance has placement supplied via level configuration (not the layout generator), a `'generated'` one does not
- Manifest is not empty; `version` is a positive integer
- `rows`/`columns` are positive integers; `gapPct` is non-negative
- `metadata.title`/`description` are non-empty

**Release failure behavior:** a validation failure (or save/catalog identity mismatch) must not start or resume a run on invalid data. Concretely: show a concise, dedicated error screen and offer a path back to the title screen — never attempt to proceed with partially-missing content.

---

## 9. Content authoring workflow (unchanged from v3)

- Reusing an existing asset: manifest-only edit.
- Introducing a new asset: manifest edit + one new entry in the asset catalog.

---

## 10. Explicitly deferred to a later spec (unchanged)

- Subset selection.
- The real trail/placement algorithm.
- One-file-per-instance manifest organization.
- New shapes beyond word-grid.

---

## 11. Build order (revised per third review round)

1. **Audit and finalize `WordGridPresentationManifest`** against the real screens in `app/sub-games/_shared/word-grid/screens.tsx` and Tesseract's current presentation content. Update this doc's §4.7 with the real, final field list before writing the parser against it.
2. Implement the word-grid shape adapter (`parse`, `routes`, `validateRewardId`) and the shared validator function (§8.3's full checklist), used by both a Jest test and on-device catalog construction. Test against hand-written fixture manifests — valid and deliberately invalid.
3. Move Tesseract's existing content into the manifest format, with `placementPolicy: 'fixed'` (its placement is not yet generated). This removes `tesseract-crypt-01` from the hardcoded registry — it now exists only via the manifest. Confirm it plays identically to today's hardcoded version.
4. Build `generateLayout` (§6.3) and placement validation (§6.4). Wire manifest-sourced `'generated'` instances through it into `GameState` + save, including `EncounterCatalogIdentity` persistence and the load-time compatibility check (§7).
5. Author `tesseract-crypt-02` as a second manifest entry with `placementPolicy: 'generated'` — **the actual proof word-grid is a reusable shape**, and the first real instance to go through the layout generator.
6. Author several more instances, including at least one new asset, to stress-test the full authoring workflow.
7. Only after all of the above: design the real trail/placement algorithm as its own spec, replacing `generateLayout`'s internals only.

---

_End of v4._

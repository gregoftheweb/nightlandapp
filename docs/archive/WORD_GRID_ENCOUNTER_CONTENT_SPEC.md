# Word-Grid Encounter Content — Requirements Spec

**Status:** Implementation-ready (mostly already built — this doc corrects naming/scope, not substance)
**Scope:** Tier 1 only — what a single word-grid puzzle instance IS. Placement, catalog discovery, and cross-encounter structure are NOT this document's concern — see `GAMEBOARD_MANIFEST_SPEC.md`.
**Depends on:** `docs/SUBGAME_LIFECYCLE_CONTRACT.md`

**Relationship to prior work:** the parser, validator, and fixture tests built in step 1 (originally under the name "manifest") are substantively correct and mostly unchanged here. What changes: names, the removal of `placementPolicy` (now owned exclusively by the gameboard manifest, not content), and a few validation checks that move to Tier 2/3 instead of living here.

---

## 1. What this spec defines

A single word-grid puzzle's full content: its grid, target word, lifecycle behavior, and presentation — everything needed to answer "what does this specific puzzle contain and how does it behave," independent of where or whether it appears on the board.

## 2. Renames from the original ("manifest") implementation

| Old name                               | New name                                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `manifestTypes.ts`                     | `content.ts`                                                                                                                |
| `WordGridManifestEntry`                | `WordGridEncounterContent`                                                                                                  |
| `WordGridManifestContent`              | `WordGridContentDetails`                                                                                                    |
| `WordGridPresentationManifest`         | `WordGridPresentationContent` (optional but recommended, for terminology consistency)                                       |
| `validateWordGridManifest()`           | `validateWordGridContent()`                                                                                                 |
| "Manifest fixtures"                    | "Content fixtures"                                                                                                          |
| `EncounterManifest` (was defined here) | **retired entirely** — not replaced within this file; the real manifest is `GameboardManifest`, defined in the sibling spec |

## 3. Removed from this tier

These existed in the original implementation and are removed — they belong to Tier 3 (the gameboard manifest) instead:

- `placementPolicy` field on the content entry
- Placement-related validation cases: missing-fixed-placement, generated-instance-has-fixed-placement, invalid-placement-policy
- Hardcoded-instance-collision validation (this is now a cross-catalog/gameboard concern, not a single content parser's job)

## 4. Identity rule (normative — resolves prior ambiguity)

**`instanceId` is the single, stable identity that everything downstream uses** — save/completion keys, reward flags, the route parameter, the resolved placement's identity. It is authored once, on the content itself, and never changes.

The Tier 2 content catalog (defined in the gameboard spec) **must** key its entries by exactly this `instanceId` — `WORD_GRID_CONTENT[content.instanceId] = content` — so there is no separate "catalog key" that could drift from the content's own identity. A gameboard slot's `contentRef` is simply "the `instanceId` I want placed here."

## 5. Schema

```typescript
interface WordGridEncounterContent {
  instanceId: string // stable, kebab-case, e.g. 'tesseract-crypt-02'.
  // Never reused after removal.
  shapeId: 'word-grid'

  metadata: {
    title: string
    description: string
    entranceAssetId: string
    introAssetId: string
    ctaLabel: string
    entranceFootprint: {
      // NEW — needed by the layout generator for
      width: number // collision detection; was missing from
      height: number // the original schema
    }
  }

  content: WordGridContentDetails
  lifecycle: WordGridLifecycleConfig
  presentation: WordGridPresentationContent
}
```

```typescript
interface WordGridContentDetails {
  assetId: string
  gridRect: {
    xPct: number
    yPct: number
    widthPct: number
    heightPct: number
  }
  rows: number
  columns: number
  gapPct: number
  letters: string[][]
  targetSequence: string
}
```

### 5.1 Tile selection rule (verified against actual gameplay in step 1 — unchanged)

No adjacency requirement. Any unused cell, any order. Solvability = the grid contains at least as many distinct occurrences of each letter as `targetSequence` requires. `targetSequence` normalizes from string to array at parse time (`"TESSERACT"` → `['T','E',...]`), uppercase ASCII only.

### 5.2 Lifecycle block (unchanged from prior work)

```typescript
type WordGridCompletionTrigger = 'success-confirmed'
type WordGridRewardTrigger = 'success-screen-entered' | 'success-confirmed'

interface WordGridLifecycleConfig extends Omit<SubGameLifecycleConfig, 'completion' | 'reward'> {
  completion: { event: WordGridCompletionTrigger; idempotent: true }
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

Field is `failure` (discriminated `{ exit: 'safe' }` / `{ exit: 'death'; message; killerName; suppressDeathDialog; deathRoute }`) — matches the real contract exactly. `saveKey`, if `progress.mode === 'async-storage'`, is authored explicitly and validated against its canonical derived form.

### 5.3 Presentation block (finalized from step 1's real-code audit)

```typescript
interface WordGridPresentationContent {
  intro: { assetId: string; leaveLabel: string; startLabel: string }
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
  failure: { assetId: string; text: string; actionLabel: string; foregroundFit: string }
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

The presentation block is the sole owner of intro/failure/success assets — `metadata.introAssetId` was removed to avoid dual ownership (confirmed during step 1's audit).

## 6. Asset resolution (distinct from the Tier 2 _content_ catalog — see note)

A fixed, hand-maintained image lookup, separate from and lower-level than the Tier 2 content catalog described in the gameboard spec:

```typescript
interface WordGridAssetDefinition {
  image: ImageSourcePropType
  intrinsicSize: { width: number; height: number }
}

const WORD_GRID_ASSETS: Record<string, WordGridAssetDefinition> = {/* ... */}
```

**Naming note to avoid confusion:** this is an _asset_ catalog (images), unrelated to the _content_ catalog (whole `WordGridEncounterContent` objects, one per puzzle) described in the gameboard spec's Tier 2. Keep these conceptually and, ideally, nominally distinct in code (`assetCatalog.ts` vs. `contentCatalog.ts`).

## 7. Shape-adapter interface

```typescript
interface EncounterInstanceRoutes {
  entry: string
  success?: string
  aftermath?: string
}

interface ParsedEncounter<TShapeConfig> {
  definition: SubGameInstanceDefinition
  shapeConfig: TShapeConfig
}

interface EncounterShapeAdapter<TRawEntry, TShapeConfig> {
  shapeId: string
  parse(entry: TRawEntry): ValidationResult<ParsedEncounter<TShapeConfig>>
  routes(instanceId: string): EncounterInstanceRoutes
  validateRewardId(id: string, kind: RewardKind): boolean
}
```

Routes: `/sub-games/word-grid/[instanceId]/index`, `/success`, `/aftermath` (unused by word-grid today but supported generically by the shape).

## 8. Validation checklist (Tier 1 scope only — collision/placement checks removed)

- `letters.length === rows`; every row has exactly `columns` entries; every cell is exactly one uppercase A-Z character
- `gridRect` values are valid normalized fractions (`0 <= x,y`; `width,height > 0`; `x+width <= 1`; `y+height <= 1`)
- `targetSequence` is non-empty, uppercase ASCII only, solvable per §5.1
- `assetId`/`entranceAssetId`/`introAssetId` resolve in the asset catalog (§6); no duplicate asset-catalog keys
- `lifecycle` is a complete, valid `WordGridLifecycleConfig`; `saveKey` (if present) matches its canonical derived form
- Reward `id` resolves against the real item/weapon/effect/ability catalogs; `kind` is one the word-grid adapter supports
- `instanceId` syntax is valid (kebab-case); uniqueness is a Tier 2/3 concern, not checked here
- `rows`/`columns` are positive integers; `gapPct` is non-negative
- `metadata.title`/`description` are non-empty
- `metadata.entranceFootprint.width`/`height` are positive

Run via one shared validator function, invoked identically by a Jest/CI test and by on-device catalog construction (Tier 2). Collect and report every error found, not just the first.

## 9. What's still correct from the original implementation, unchanged

Everything not explicitly renamed or removed above: the parser's core logic, grid/lifecycle/presentation/asset/reward validation, the solvability check, aggregate error collection, string-to-array target conversion, percentage-to-runtime-rectangle conversion, and the majority of the existing fixture tests.

## 10. Immediate cleanup task (do this before Tier 3 work begins)

1. Apply the renames in §2.
2. Remove `placementPolicy` from `WordGridEncounterContent` and from `SubGameInstanceDefinition`.
3. Remove the four `placementPolicy: 'fixed'` additions from `config/subGames.ts` (added in the original step 1 — now reverted, since placement lives exclusively in the gameboard manifest).
4. Remove the placement-related validation cases and their fixtures (§3).
5. Delete the stray `EncounterManifest` re-export causing the current lint error — it's retired, not relocated.
6. Confirm `tsc --noEmit`, `pnpm lint`, and the full test suite are clean after these changes, with no gameplay-affecting change (Tesseract's hardcoded path is still untouched at this point).

---

_End of Tier 1 spec._

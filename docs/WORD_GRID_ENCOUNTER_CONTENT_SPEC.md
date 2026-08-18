# Word-Grid Encounter Content — Requirements Spec

**Status:** Implementation-ready (mostly already built — this doc corrects naming/scope, not substance)
**Scope:** This document covers ONLY what's specific to the word-grid shape. For the generic adapter interface, identity rule, and validation principles every shape follows, see `ENCOUNTER_CONTENT_PATTERN.md` — this is one implementation of that pattern, not a restatement of it.
**Depends on:** `ENCOUNTER_CONTENT_PATTERN.md`, `docs/SUBGAME_LIFECYCLE_CONTRACT.md`

---

## 1. Renames from the original ("manifest") implementation

| Old name                                                  | New name                                                                                                                                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifestTypes.ts`                                        | `content.ts`                                                                                                                                                                  |
| `WordGridManifestEntry`                                   | `WordGridEncounterContent`                                                                                                                                                    |
| `WordGridManifestContent`                                 | `WordGridContentDetails`                                                                                                                                                      |
| `WordGridPresentationManifest`                            | `WordGridPresentationContent`                                                                                                                                                 |
| `validateWordGridManifest()`                              | `validateWordGridContent()`                                                                                                                                                   |
| "Manifest fixtures"                                       | "Content fixtures"                                                                                                                                                            |
| `EncounterManifest` (was defined in the word-grid folder) | **retired entirely** — the real manifest is `GameboardManifest`, defined in `GAMEBOARD_MANIFEST_SPEC.md`, and lives at the project's top level, not inside any shape's folder |

## 2. Removed from this shape's content (now owned by the gameboard manifest)

- `placementPolicy` field
- Placement-related validation cases and fixtures (missing-fixed-placement, generated-instance-has-fixed-placement, invalid-placement-policy)
- Hardcoded-instance-collision validation (now a gameboard-level cross-catalog concern)

## 3. Content schema

```typescript
interface WordGridEncounterContent {
  instanceId: string // stable, kebab-case, e.g. 'tesseract-crypt-02'
  shapeId: 'word-grid'

  metadata: {
    title: string
    description: string
    entranceAssetId: string
    ctaLabel: string
    entranceFootprint: { width: number; height: number } // needed by
    // the layout
    // generator
    // for
    // collision
    // detection
  }

  content: WordGridContentDetails
  lifecycle: WordGridLifecycleConfig
  presentation: WordGridPresentationContent
}
```

**Note — `introAssetId` correction:** an earlier draft of this schema included `metadata.introAssetId` while also stating the presentation block was the sole owner of intro/failure/success assets. That was a genuine contradiction, now resolved: **`metadata.introAssetId` does not exist.** The intro screen's asset lives at `presentation.intro.assetId` (§6) — metadata only carries `entranceAssetId` (the board-icon asset shown before entry) plus title/description/CTA/footprint.

`wordGridShapeAdapter` implements `EncounterShapeAdapter<RawWordGridEntry, WordGridConfig>` per `ENCOUNTER_CONTENT_PATTERN.md` — see that document for the interface itself.

```typescript
interface WordGridContentDetails {
  assetId: string
  gridRect: { xPct: number; yPct: number; widthPct: number; heightPct: number }
  rows: number
  columns: number
  gapPct: number
  letters: string[][]
  targetSequence: string
}
```

## 4. Tile selection rule (verified against actual gameplay — word-grid-specific)

No adjacency requirement. Any unused cell, any order. Solvability = the grid contains at least as many distinct occurrences of each letter as `targetSequence` requires — a distinct-letter-count check, not a path search. `targetSequence` normalizes string → array at parse time (`"TESSERACT"` → `['T','E',...]`), uppercase ASCII only, no whitespace/punctuation/non-ASCII permitted.

## 5. Lifecycle — word-grid's typed trigger narrowing

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

Field is `failure` (discriminated `{ exit: 'safe' }` / `{ exit: 'death'; message; killerName; suppressDeathDialog; deathRoute }`) — matches the real contract exactly, per the shape-agnostic no-silent-defaults rule (pattern doc §5). `saveKey`, if `progress.mode === 'async-storage'`, is authored explicitly and validated against its canonical derived form (`sub-game:${instanceId}:progress`).

## 6. Presentation (finalized from real-code audit)

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
  failure: {
    assetId: string
    text: string
    actionLabel: string
    foregroundFit: 'full-width' | 'cover' // typed union, not a bare
    // string — an earlier draft
    // accidentally weakened this
    // to `string`, which would
    // let invalid renderer
    // values through validation
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

Presentation is the sole owner of intro/failure/success assets (§3's note).

## 7. Word-grid's asset catalog (images — distinct from the Tier 2 content catalog)

```typescript
interface WordGridAssetDefinition {
  image: ImageSourcePropType
  intrinsicSize: { width: number; height: number }
}

const WORD_GRID_ASSETS: Record<string, WordGridAssetDefinition> = {/* ... */}
```

**Naming note:** this is an _asset_ catalog (images) — unrelated to the Tier 2 _content_ catalog (whole `WordGridEncounterContent` objects) defined generically in the pattern doc and instantiated for word-grid per `GAMEBOARD_MANIFEST_SPEC.md`. Keep `assetCatalog.ts` and `contentCatalog.ts` as separate files to avoid confusing the two.

## 8. Routing — filesystem path vs. actual URL

The adapter's `routes(instanceId)` (defined generically in the pattern doc) returns the **actual navigable URL**, e.g. `/sub-games/word-grid/tesseract-crypt-02` — **not** a filesystem path. Expo Router's underlying file may be `app/sub-games/word-grid/[instanceId]/index.tsx`, but the corresponding public route has no `/index` suffix. Keep this distinction explicit in the adapter's implementation and its tests, so a future refactor doesn't accidentally append `/index` to a returned route string.

## 9. Word-grid-specific validation (in addition to the generic principles in the pattern doc)

- `letters.length === rows`; every row has exactly `columns` entries; every cell is exactly one uppercase A-Z character
- `gridRect` values are valid normalized fractions
- `targetSequence` non-empty, uppercase ASCII only, solvable per §4
- `assetId` (content) and `entranceAssetId` (metadata) resolve in the word-grid asset catalog (§7); `presentation.intro.assetId`, `presentation.failure.assetId`, `presentation.success.assetId` also resolve there; no duplicate asset-catalog keys
- `lifecycle` is a complete, valid `WordGridLifecycleConfig`; `saveKey` (if present) matches its canonical form
- Reward `id` resolves against real catalogs; `kind` is one word-grid supports
- `rows`/`columns` positive integers; `gapPct` non-negative
- `metadata.title`/`description` non-empty; `entranceFootprint.width`/`height` positive
- `presentation.failure.foregroundFit` is exactly `'full-width'` or `'cover'`

## 10. What's unchanged from the original implementation

The parser's core logic, grid/lifecycle/reward validation, the solvability check, aggregate error collection, string-to-array target conversion, percentage-to-runtime-rectangle conversion, and the majority of existing fixture tests all survive unchanged — only naming, container ownership, the placement-related pieces (§2), and the two corrections in §3/§6 changed.

## 11. Immediate cleanup task (do before gameboard/Tier 3 work begins)

1. Apply renames (§1).
2. Remove `placementPolicy` from `WordGridEncounterContent` and `SubGameInstanceDefinition`.
3. Remove the four `placementPolicy: 'fixed'` additions from `config/subGames.ts`.
4. Remove placement-related validation cases and fixtures (§2).
5. Delete the stray `EncounterManifest` re-export causing the current lint error.
6. Remove `metadata.introAssetId` from the schema and any code/fixtures still referencing it (§3).
7. Restore `foregroundFit`'s typed union (§6) if the current implementation has it as a bare `string`.
8. Add `entranceFootprint` to `metadata` and to existing fixtures with placeholder dimensions (real dimensions to be filled in during gameboard/layout work).
9. Confirm `tsc --noEmit`, `pnpm lint`, and the full test suite are clean, with no change to Tesseract's still-hardcoded runtime behavior.

---

_End of word-grid content spec._

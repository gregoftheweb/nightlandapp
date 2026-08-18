# Encounter Content Pattern — Shape-Agnostic Contract

**Status:** Implementation-ready
**Scope:** This document defines the pattern any manifest-authorable sub-game _shape_ implements. It contains nothing word-grid-specific — see `WORD_GRID_ENCOUNTER_CONTENT_SPEC.md` for the first (and currently only) real implementation of this pattern.
**Depends on:** `docs/SUBGAME_LIFECYCLE_CONTRACT.md`

---

## 1. Why this exists as its own document

Word-grid was built first, and its content spec originally contained both shape-agnostic infrastructure (the adapter interface, the identity rule, validation principles) and word-grid-specific schema (the grid, the letters) tangled together. This document pulls out only the shape-agnostic part, so that when a second manifest-authorable shape is eventually built, it has a real contract to implement against instead of needing to reverse-engineer what was generic versus word-grid-specific by reading word-grid's spec.

---

## 2. Identity rule (applies to every shape, not just word-grid)

**`instanceId` is the single, stable identity used everywhere downstream** for any manifest-authorable encounter — save/completion keys, reward flags, the route parameter, the resolved placement's identity in the gameboard manifest. It is authored once, on the content itself, and never changes or gets reused after removal.

The Tier 2 content catalog for any shape **must** key its entries by exactly this `instanceId` (`CONTENT[content.instanceId] = content`) — no separate catalog key that could drift from the content's own declared identity.

A gameboard slot's `contentRef` (see `GAMEBOARD_MANIFEST_SPEC.md`) is simply "the `instanceId` I want placed here" — it is not a third, independent identifier.

---

## 3. The shape-adapter interface

Every manifest-authorable shape implements this:

```typescript
interface EncounterInstanceRoutes {
  entry: string
  success?: string
  aftermath?: string
}

interface ParsedEncounter<TShapeConfig> {
  definition: SubGameInstanceDefinition // consumed by the existing
  // registry/lifecycle controller
  shapeConfig: TShapeConfig // consumed by the shape's own
  // renderer/screens
}

interface EncounterShapeAdapter<TRawEntry, TShapeConfig> {
  shapeId: string

  // Parses + validates ONE raw content entry. Returns ALL validation
  // errors found, not just the first.
  parse(entry: TRawEntry): ValidationResult<ParsedEncounter<TShapeConfig>>

  // Explicit route contract — returns the actual navigable URL/route
  // (NOT a filesystem path). Does NOT assume routes can be derived by
  // string manipulation on a generic dynamic route (e.g. stripping the
  // final path segment) — some shapes' screens may not follow a
  // sibling-route convention at all.
  routes(instanceId: string): EncounterInstanceRoutes

  // Validates a reward id against the real item/weapon/effect/ability
  // catalogs, scoped to whatever reward kinds this shape's lifecycle
  // config actually permits.
  validateRewardId(id: string, kind: RewardKind): boolean
}
```

The lifecycle controller and registry consume `ParsedEncounter.definition` without needing to know which shape (or whether a manifest at all) produced it — this is what keeps gameplay code shape-agnostic.

---

## 4. Content catalogs — raw vs. parsed, generically

Every shape's Tier 2 content catalog follows the same two-stage construction, regardless of what the shape's content actually looks like:

```typescript
type RawContentCatalog<TRaw> = Record<string, TRaw>

type ParsedContentCatalog<TShapeConfig> = Readonly<Record<string, ParsedEncounter<TShapeConfig>>>

function buildParsedCatalog<TRaw, TShapeConfig>(
  raw: RawContentCatalog<TRaw>,
  adapter: EncounterShapeAdapter<TRaw, TShapeConfig>
): ValidationResult<ParsedContentCatalog<TShapeConfig>>
```

**The static, hand-maintained catalog holds RAW, unparsed, untrusted content.** Static TypeScript registration does not imply validity — every entry must pass through `adapter.parse()` before it becomes part of the immutable parsed catalog that the rest of the app actually consumes. Nothing downstream of `buildParsedCatalog` should ever touch the raw catalog directly.

**Catalog key must equal `instanceId`** (§2) — validated as part of `buildParsedCatalog`, not left to convention.

---

## 5. Validation principles (apply to every shape)

- **One shared validator function per shape**, invoked identically by a Jest/CI test (the real build-time gate) and by on-device catalog construction (a safety net) — never two implementations that could drift from each other.
- **Collect and report every error found**, not just the first — content authoring is much friendlier when a single validation run tells you everything wrong at once.
- **Tier 2 orchestrates, Tier 1 validates.** A shape's own content-level rules (grid dimensions, dialogue graph structure, whatever is shape-specific) live in that shape's own parser. The catalog-construction step (§4) only calls that parser across every entry and aggregates the results — it does not duplicate shape-specific validation logic.
- **No silent defaults for lifecycle fields.** Every manifest-authorable shape's lifecycle config must be a complete, valid instance of `SubGameLifecycleConfig` (per `docs/SUBGAME_LIFECYCLE_CONTRACT.md`), possibly narrowed to shape-specific typed trigger enums (see word-grid's spec for a worked example), but never defaulted silently by the parser.

---

## 6. What this pattern deliberately does NOT cover

- **Placement.** Where an encounter appears on the board, how many exist, and structural rules governing them are the gameboard manifest's concern (`GAMEBOARD_MANIFEST_SPEC.md`, Tier 3) — not this pattern, and not any individual shape's content.
- **Shape-specific schema.** What a word-grid's content actually contains (grid, letters, target word) vs. what a future dialogue shape's content would contain (dialogue nodes, branches) is entirely shape-specific — this document only defines the _contract_ every shape's content conforms to, not the content itself.

---

## 7. Checklist for adding a new shape in the future

1. Define `TRawEntry` and `TShapeConfig` types specific to the new shape's content.
2. Implement `EncounterShapeAdapter<TRawEntry, TShapeConfig>` for it — `parse`, `routes`, `validateRewardId`.
3. Build its Tier 2 content catalog per §4, with the catalog-key-equals-`instanceId` rule enforced.
4. Register the new `shapeId` in the `SubGameShapeId` union so the gameboard manifest can reference it.
5. Write fixture content (valid + one deliberately invalid per validation rule) and adapter tests, following the same pattern as word-grid's.
6. Write a shape-specific content spec doc (like `WORD_GRID_ENCOUNTER_CONTENT_SPEC.md`) documenting only what's actually specific to the new shape — reference this document for everything generic, don't restate it.

---

_End of pattern doc._

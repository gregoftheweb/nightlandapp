# Trail Geometry & Branching — Implemented Specification (v6)

**Status:** Implemented and covered by the automated test suite
**Scope:** Current generated trail, branch, encounter-placement, and footstep behavior.
**Depends on:** `docs/GAMEBOARD_MANIFEST_SPEC.md` §3/§4, `modules/gameboardLayout.ts`, `docs/ENCOUNTER_CONTENT_PATTERN.md`

---

## 1-4. Core model, `TrailNetwork`, `EncounterPlacement`

```typescript
type TrailLocation =
  | { type: 'trunk'; progressPct: number }
  | { type: 'branch'; branchId: string; branchProgressPct: number }

interface TrailNetwork {
  trunk: PathPositionResolver
  branches: TrailBranch[]
  resolve(location: TrailLocation): Position
  distanceBetween(a: TrailLocation, b: TrailLocation): number // EUCLIDEAN
  geometry: TrailNetworkGeometry
}

interface TrailBranch {
  branchId: string
  originTrunkPct: number
  length: number
}

interface EncounterPlacement {
  instanceId: string
  shapeId: SubGameShapeId
  slotId: string
  location: TrailLocation
  position: { row: number; col: number }
  footprint: { width: number; height: number }
  occupancyId: string
}
```

---

## 5. Ownership — `generateLayout` owns trail generation directly

Resolved in favor of the cleaner option: **`generateLayout` no longer accepts an externally-built `PathPositionResolver` parameter at all.** It owns the full sequence internally:

```typescript
function generateLayout(
  manifest: GameboardManifest,
  catalogs: ParsedContentCatalogsByShape,
  level: Level, // the REAL authored level, not
  // LevelLayoutConstraints — needed
  // directly for §6
  random: RandomSource
): ValidationResult<{
  placements: EncounterPlacement[]
  trailNetwork: TrailNetwork
  generatedFootsteps: FootstepDescriptor[]
}>
```

Internally, `generateLayout`:

1. Counts eligible scattered-group instances from `manifest` + `catalogs` to compute `branchCount` (§8).
2. Calls `buildTraversalObstacles(level)` (§6) and builds ONE `BoardOccupancyRegistry` instance from `level` — this same single instance is reused for both trail-endpoint clearance checks (§12) and all subsequent encounter placement reservations (existing step 6 logic), not two separate registries.
3. Calls `generateTrailNetwork(obstacles, occupancy, random, branchCount, level.playerSpawn)` (§7) to get the runtime network (including §11's internal fallback when retries are exhausted).
4. Uses the resulting network to resolve all `range`/`end`/`scattered-group` placements (existing logic from step 6, now sourcing positions from the real network instead of the stub).
5. Generates footstep descriptors only after all encounter placements are resolved, passing both the final occupancy registry and the actual placement list into the footstep filter (§9/§17).

This removes the circular-dependency ambiguity entirely — there is one clear owner and one clear call sequence.

---

## 6. Traversal obstacles — real source, explicit signature (fixes round 4's blocker #2)

```typescript
function buildTraversalObstacles(level: Level): TraversalObstacles
```

Takes the real `Level` directly (now that `generateLayout` has it per §5, this is no longer a signature mismatch). Includes `level.objects` (buildings), `level.nonCollisionObjects` entries of type `'river'` (real mask segments), `level.greatPowers`, and board bounds. Excludes decorative `'footstep'`-type entries and any entry whose `shortName` starts with `'generated-footsteps-'` (§9).

---

## 7. `generateTrailNetwork` — final signature (consistent with §5/§6's fixes)

```typescript
function generateTrailNetwork(
  obstacles: TraversalObstacles, // from §6, built by the caller
  occupancy: BoardOccupancyRegistry, // for endpoint clearance, §12
  random: RandomSource,
  branchCount: number, // from §5, computed by the caller
  start: Position // the real player spawn
): ValidationResult<TrailNetwork>
```

A pure geometry function — takes derived data views, never the raw `Level` or manifest/content types itself. This keeps it testable in isolation with synthetic obstacle sets, independent of real game content.

---

## 8. Branch count formula

`min(random 2-4, eligible scattered-instance count)`, computed by `generateLayout` before calling `generateTrailNetwork`.

---

## 9. Generated footsteps — real discriminator, corrected (fixes round 4's blocker #3)

**Correction: `NonCollisionObject` has no `templateName` field, and `createNonCollisionObject()` does not preserve one.** The real, existing discriminator is `shortName` — the template system already sets this from whichever template was used to construct the object (confirmed: `createNonCollisionObject(templateName, ...)` looks up `nonCollisionTemplates[templateName]`, and the resulting object's `shortName` reflects that template).

Three templates are registered with the `generated-footsteps-` prefix, using the green, blue, and red footprint assets. Every place that identifies or filters generated footsteps uses **`shortName.startsWith('generated-footsteps-')`**, not `templateName`.

```typescript
interface FootstepDescriptor {
  position: Position
  rotationDegrees: number
  variant: 'green' | 'blue' | 'red'
  onBranchId?: string
}

const FOOTSTEP_INTERVAL_TILES = 24 // real board-tile units, tunable
const FIRST_FOOTSTEP_EDGE_MIN_TILES = 4
const FIRST_FOOTSTEP_EDGE_MAX_TILES = 6
```

Variants are selected deterministically through the layout's `RandomSource`: 75% green, 20% blue,
and 5% red. Descriptors remain data-only; runtime materialization selects the matching template.
Each trunk and branch starts with a dedicated descriptor targeted five walked tiles beyond the point
where its 2×2 footprint clears every object overlapping the path origin (acceptable band: 4–6
tiles). The search uses 0.25-tile increments and is independent of the regular interval. If the band
is obstructed, the closest clear point past the origin obstacle's edge is used. Subsequent candidates
use the regular interval measured from the accepted first descriptor. Every candidate is omitted when
its footprint overlaps fixed occupancy or a resolved encounter; candidates are skipped, never nudged.

---

## 10. Runtime state and persistence

Round 4 found that `nonCollisionObjects` exists in three separate places in current state (`state.nonCollisionObjects`, `state.level.nonCollisionObjects`, `state.levels[levelId].nonCollisionObjects`), and filtering all three on every save is fragile and easy to miss one.

Generated footsteps are **never written into any of those three non-collision arrays.** At runtime they exist as:

1. The compact `generatedFootsteps: FootstepDescriptor[]` array on `GameState`, and
2. A computed, in-memory-only set of runtime `NonCollisionObject`s created by `getRuntimeNonCollisionObjects()`.

The game screen memoizes this runtime merge by the authored-object and descriptor-array identities.
The spatial-grid path currently invokes the merger independently, although generated footsteps are
not inserted into the grid because they have no collision mask.

**Note for a separate future check (not fixed here):** whether encounter-entrance objects from step 6 have this same three-location duplication risk today is worth a quick, separate look — out of scope for this spec, flagged so it isn't lost.

`GameSnapshot` persists a data-only `trailNetworkGeometry` copy plus `generatedFootsteps`. It never
serializes the method-bearing `TrailNetwork` object. `toSnapshot()` copies trunk/branch waypoints and
descriptors; `fromSnapshot()` builds defaults with gameboard generation explicitly disabled, then
wraps the persisted geometry with `createTrailNetwork()`. Loading introduces no new trail randomness.
Snapshots missing either new field are rejected with `IncompatibleGameboardSaveError`.

```typescript
interface TrailNetworkGeometry {
  trunkWaypoints: Position[]
  branches: { branchId: string; originTrunkPct: number; waypoints: Position[] }[]
}

interface GameState {
  trailNetwork: TrailNetwork | null // runtime-only
  generatedFootsteps: FootstepDescriptor[]
}

interface GameSnapshot {
  trailNetworkGeometry: TrailNetworkGeometry | null
  generatedFootsteps: FootstepDescriptor[]
}
```

---

## 11. Graceful degradation fallback — scope clarified (answers round 4's clarification request)

If `generateTrailNetwork` exhausts all retries (§13), it returns a simple straight-line path between spawn and a validated top corner, with zero branches.

**Explicitly: the fallback path is exempt from traversability and self-intersection checks.** Generated
footsteps still use the normal three-color selection, origin-edge placement, interval, and occupancy
filtering on fallback geometry.

---

## 12. Endpoint clearance (unchanged from v4, uses the real `BoardOccupancyRegistry` per §7's signature)

```typescript
const HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT = { width: 8, height: 8 }
```

---

## 13. Trunk generation, smoothness, self-intersection, and bounded retries

1. Start: spawn. End: one of two top corners, subject to §12's clearance check.
2. Fixed 12-tile walk steps with direction accumulated gradually from one step to the next.
3. A maximum 18° turn per step produces smooth bends instead of a few long, sharply joined segments.
4. Direction wanders laterally while retaining an increasing bias toward the validated endpoint.
5. Every segment is checked against `TraversalObstacles` and previous non-adjacent trunk segments.
6. The spawn-containing obstacle has a bounded 120-tile path-escape exemption. This applies only to invisible path geometry; visible footsteps retain full occupancy filtering.
7. Length target: ≥3× straight-line distance.
8. Bounded retries: 20 local reroute attempts and 200 full regenerations; exhaustion triggers §11.

---

## 14. Branch generation

1. Count from §8. Each branch uses 12-tile walk steps from a trunk origin and has an absolute maximum walked length of `6 × FOOTSTEP_INTERVAL_TILES` (currently 144 tiles). The former 10–20%-of-trunk rule has been removed entirely.
2. Branches use the same obstacle and self-intersection rules, with the branch origin explicitly permitted to touch the trunk at that one point.
3. No intersection with other branches.
4. Spacing per §15.

---

## 15. Spacing, exclusions, distance scaling (unchanged from v4)

Manifest-authored regions stay trunk-only. Trunk-to-branch/branch-to-branch spacing is a generator constant. `minSpacingPct` converts using straight-line spawn-to-corner distance as its reference, not walked trunk length.

---

## 16. Branch content allocation (unchanged from v4)

When ≥1 branch and ≥1 eligible instance exist, at least one instance places near a branch terminus (last ~20% of branch length).

---

## 17. Footstep generation (uses §9's corrected discriminator)

After each path's dedicated edge-clearing first descriptor, footsteps are dropped every `FOOTSTEP_INTERVAL_TILES` (§9) of real cumulative distance measured from that first descriptor. Rotation uses local path direction, 0°=north/clockwise-positive (matches existing convention).

---

## 18. Explicitly deferred / out of scope

Spatial-grid runtime-footstep materialization waste, autosave tuning, logging-volume reduction,
visual trunk/branch footstep distinction, multi-instance branches, branch difficulty/reward scaling,
monster density tuning, the House of Silence's final content, and encounter-entrance duplication
auditing.

---

## 19. Completion record

1. ✅ Real traversal obstacles and shared occupancy registry.
2. ✅ Smooth fixed-step trunk generation, gradual turn limits, obstacle avoidance, non-self-intersection, ≥3× length, validated corner endpoint, bounded retries, and fallback.
3. ✅ Absolute six-footstep branch cap, branch spacing/intersection rules, and branch-terminus content allocation.
4. ✅ Final `EncounterPlacement` schema and `generateLayout` ownership.
5. ✅ Runtime-only generated descriptors and three template variants (75% green / 20% blue / 5% red).
6. ✅ Removal of all legacy hand-authored footsteps and the legacy template.
7. ✅ Fixed/Great-Power/resolved-encounter occupancy filtering for every trunk and branch footstep.
8. ✅ Dedicated 4–6-tiles-beyond-origin-edge first footstep for trunk and branches, with regular spacing based on the accepted first drop.
9. ✅ Regression coverage across standalone geometry and many seeded real layouts.
10. ✅ Byte-identical geometry/descriptor persistence, method-bearing rehydration, incompatible-old-save rejection, and zero random layout generation during valid snapshot loads.

---

_End of v6 — updated to describe the completed implementation and explicitly identify remaining deferred work._

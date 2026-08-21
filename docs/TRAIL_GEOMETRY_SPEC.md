# Trail Geometry & Branching — Requirements Spec (v5)

**Status:** Implementation-ready
**Scope:** Build order Step 8. Closes every gap found across four review rounds (7 + 7 + 9 + 4 findings).
**Depends on:** `docs/GAMEBOARD_MANIFEST_SPEC.md` §3/§4, `modules/gameboardLayout.ts`, `docs/ENCOUNTER_CONTENT_PATTERN.md`

---

## 1-4. Core model, `TrailNetwork`, `EncounterPlacement` (unchanged from v4)

```typescript
type TrailLocation =
  | { type: 'trunk'; progressPct: number }
  | { type: 'branch'; branchId: string; branchProgressPct: number }

interface TrailNetwork {
  trunk: PathPositionResolver
  branches: TrailBranch[]
  resolve(location: TrailLocation): Position
  distanceBetween(a: TrailLocation, b: TrailLocation): number // EUCLIDEAN
  // real board
  // distance —
  // stated
  // explicitly,
  // not left
  // implicit
  geometry: TrailNetworkGeometry // the underlying persisted-shape data
  // (trunkWaypoints + branch waypoints),
  // exposed directly on the runtime
  // interface so callers (persistence)
  // have a typed way to obtain it without
  // reaching into private implementation
  // details or reconstructing it from
  // sampled positions
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

## 5. Ownership — `generateLayout` now owns trail generation directly (fixes round 4's blocker #1)

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
3. Calls `generateTrailNetwork(obstacles, occupancy, random, branchCount)` (§7) to get the network (or triggers the fallback, §11, on failure). The returned `TrailNetwork.geometry` (§1-4) is what gets persisted per §10 — no separate reconstruction step needed.
4. Uses the resulting network to resolve all `range`/`end`/`scattered-group` placements (existing logic from step 6, now sourcing positions from the real network instead of the stub).
5. Generates footstep descriptors along the network (§10).

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
  branchCount: number // from §5, computed by the caller
): ValidationResult<TrailNetwork>
```

A pure geometry function — takes derived data views, never the raw `Level` or manifest/content types itself. This keeps it testable in isolation with synthetic obstacle sets, independent of real game content.

---

## 8. Branch count formula (unchanged in substance from v4 §5/§15, now correctly owned by `generateLayout` per §5)

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
```

Variants are selected deterministically through the layout's `RandomSource`: 75% green, 20% blue,
and 5% red. Descriptors remain data-only; runtime materialization selects the matching template.
Each trunk and branch starts with a dedicated descriptor targeted five walked tiles beyond the
point where its 2×2 footprint clears any object overlapping the path origin (acceptable band: 4–6
tiles). Subsequent candidates use the regular interval measured from that accepted first descriptor.
Every candidate is omitted when its footprint overlaps fixed occupancy or a resolved encounter.

---

## 10. Persistence — generated content NEVER enters persisted/duplicated state arrays at all (fixes round 4's blocker #4)

Round 4 found that `nonCollisionObjects` exists in three separate places in current state (`state.nonCollisionObjects`, `state.level.nonCollisionObjects`, `state.levels[levelId].nonCollisionObjects`), and filtering all three on every save is fragile and easy to miss one.

**Resolved by avoiding the problem structurally, not by filtering after the fact:** generated footsteps are **never written into any of those three arrays at all.** They exist ONLY as:

1. The compact `generatedFootsteps: FootstepDescriptor[]` array (the actual persisted source of truth), and
2. A computed, in-memory-only set of runtime `NonCollisionObject`s, rebuilt fresh from that descriptor array every time it's needed (new-game creation, and on load) — exactly the same "merge at read/compute time, never mutate the underlying stored source" pattern already established for encounter entrances in step 6.

Wherever rendering/spatial-grid/hit-testing code currently reads `state.nonCollisionObjects`, it must combine that real stored array with the separately-computed generated-footstep objects at read time — the same shape as how `runtimeObjects` already combines static level objects with generated encounter entrances today. This sidesteps needing to hunt down and filter three duplicate save locations entirely, since the generated data structurally never enters them.

**Note for a separate future check (not fixed here):** whether encounter-entrance objects from step 6 have this same three-location duplication risk today is worth a quick, separate look — out of scope for this spec, flagged so it isn't lost.

**Hydration/load-time generation must be skipped, not silently re-run (new finding from round 4, addressed here):** `fromSnapshot()` currently calls `getInitialState()` first (which would trigger a full, wasted trail-generation pass) before applying the persisted snapshot on top. This must change: the base-state initializer needs a way to skip trail/footstep generation when it's about to be immediately overwritten by snapshot data — e.g. an explicit `getInitialState({ skipTrailGeneration: true })` parameter, or a lower-level initializer that `fromSnapshot()` calls instead of the full `getInitialState()`. Either is acceptable; the requirement is that loading a save never performs real random trail generation just to discard it.

```typescript
interface TrailNetworkGeometry {
  trunkWaypoints: Position[]
  branches: { branchId: string; originTrunkPct: number; waypoints: Position[] }[]
}

interface GameState {
  trailNetworkGeometry: TrailNetworkGeometry // persisted directly from
  // TrailNetwork.geometry
  // (§1-4) — no separate
  // reconstruction needed
  generatedFootsteps: FootstepDescriptor[]
}
```

On load: `TrailNetwork` rehydrated (methods wrapped around the persisted `geometry`), footstep runtime objects rebuilt from descriptors — both via the same read-time computation as new-game creation, never regenerated with new randomness.

---

## 11. Graceful degradation fallback — scope clarified (answers round 4's clarification request)

If `generateTrailNetwork` exhausts all retries (§13), `generateLayout` falls back to a simple straight-line path between spawn and a validated top corner, zero branches.

**Explicitly: the fallback path is EXEMPT from traversability and self-intersection checks** — it's a deliberately simple last resort, not held to the same quality bar as normal generation. It may visually cross terrain/obstacles in this rare case; since it never reserves occupancy footprints anyway (§6/traversal was always about visual quality, not collision), this is an acceptable, minor cosmetic tradeoff for guaranteeing the game is always playable. Red footsteps ARE still generated along the fallback path, at the same tile interval, also without traversability checks — consistent behavior, just without the quality guarantees normal generation provides.

---

## 12. Endpoint clearance (unchanged from v4, uses the real `BoardOccupancyRegistry` per §7's signature)

```typescript
const HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT = { width: 8, height: 8 }
```

---

## 13. Trunk generation, self-intersection, bounded retries (refined with round 4's exemption notes)

1. Start: spawn. End: one of two top corners, subject to §12's clearance check.
2. Biased random walk, lateral deviation, each candidate segment checked against `TraversalObstacles` (§6) and against every previously-placed segment of the trunk — **with adjacent segments that share an endpoint exempted from the self-intersection test** (a normal polyline's consecutive segments touching at their shared vertex is not a self-intersection).
3. Mild bias away from already-visited regions to make 3× length achievable without genuine self-crossing.
4. Length target: ≥3× straight-line distance (default, tunable).
5. Bounded retries: ~20 attempts for local rerouting, ~20 for full regeneration; exhaustion triggers §11's fallback.

---

## 14. Branch generation

1. Count from §8. Each branch: biased walk from a trunk origin, bounded length (10-20% of trunk length), same traversability/self-intersection rules as the trunk, **with the branch's own origin point (where it meets the trunk) explicitly exempted from the trunk-intersection check** — a branch is SUPPOSED to touch the trunk at exactly that one point.
2. No intersection with other branches.
3. Spacing per §15.

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

Exact tuning constants beyond stated defaults, visual trunk/branch footstep distinction, multi-instance branches, branch difficulty/reward scaling, monster spawn density tuning, House of Silence's actual content, the flagged (not fixed) question of whether step 6's encounter-entrance objects have a similar multi-location save duplication risk.

---

## 19. Build order

1. Implement `buildTraversalObstacles(level)` (§6).
2. Implement `generateTrailNetwork(obstacles, occupancy, random, branchCount)` (§7) returning `ValidationResult<TrailNetwork>`, with non-self-intersection (§13, with adjacency/origin exemptions per §13/§14), obstacle avoidance, length-ratio retry, and the fallback (§11).
3. Implement branch generation (§14).
4. Rewrite `generateLayout`'s signature and internal orchestration exactly per §5 — remove the old externally-supplied-resolver parameter entirely.
5. Update `EncounterPlacement` to the final schema (§4). Real consumers: `config/types/gameboard.ts`, `generateLayout`'s output, save schema/serialization/hydration, the debug minimap, existing placement tests. The Tier 3 manifest validator is NOT a consumer.
6. Implement generated-footstep handling per §9/§10 — real `shortName` discriminator, structurally never entering persisted `nonCollisionObjects` arrays, computed-at-read-time merging matching the existing encounter-entrance pattern.
7. Fix `fromSnapshot()`'s wasted-generation issue per §10 — skip trail/footstep generation when a snapshot is about to be applied.
8. Implement the corrected `minSpacingPct` reference (§15) and branch content allocation (§16).
9. Playtest extensively via the debug minimap: many new games, confirm windiness/length/corner-clearance/non-self-intersection, confirm branches dead-end cleanly and get content when eligible, confirm footsteps look natural, confirm save/reload reproduces IDENTICAL geometry with zero wasted regeneration on load, confirm the fallback path works if deliberately triggered (e.g. temporarily lowering retry limits in a test build).

---

_End of v5 — addresses every finding from four review rounds (7 + 7 + 9 + 4)._

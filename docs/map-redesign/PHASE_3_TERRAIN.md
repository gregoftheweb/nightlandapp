# Phase 3: Terrain regions

Six supplied WebP assets are placed relative to the central Redoubt and Watchers using the reference map. Coordinates are upper-left visual anchors in board cells; north is decreasing row.

| Region                 | Row | Column | Width | Height | Blocks movement |
| ---------------------- | --- | ------ | ----- | ------ | --------------- |
| Giant’s Sea            | 94  | 250    | 52    | 63     | Yes             |
| Mountains of the Voice | 315 | 280    | 48    | 50     | Yes             |
| Giant’s Pit            | 216 | 270    | 20    | 15     | Yes             |
| Deep Valley            | 210 | 150    | 42    | 28     | No              |
| Vale of Red Fire       | 143 | 175    | 44    | 22     | No              |
| Valley of the Hounds   | 178 | 304    | 28    | 42     | No              |

## Geometry and rendering

`config/terrain.ts` owns placement, artwork, movement flags and optional effects. `config/terrainShapes.json` contains local cell rectangles sampled from the supplied images at their configured tile sizes (cell-center alpha >= 180). This keeps transparent corners open and excludes faint exterior haze. Geometry is authored data at runtime: images are not decoded to perform movement checks. Resizing or replacing artwork requires updating the corresponding shape data. Rendering stretches each image into exactly the bounds used to sample its shape.

Walkable valleys remain walkable across their whole illustrated area, including rocky sides. No damage or other new terrain effects are enabled. Optional `effects` support `eachTurn` (default) and `onEnter`; overlaps apply each region once per interaction check, regardless of how many shape rectangles overlap. Effects currently target the player. Monster terrain effects can be added separately without changing movement flags.

The terrain layer sits below actors and landmarks. All six images are preloaded. The debug minimap shows artwork and shape overlays (red blocked, green walkable); tapping a region reports its name, anchor and movement rule.

## Movement and routing

`modules/terrain.ts` combines cliff restrictions with cached blocked terrain cells. Shared checks cover player movement, held movement via existing turn handling, Jaunt validation, monster movement and spawning. Checks consider complete monster footprints, all crossed cells for faster moves, and diagonal corner clearance. Defensive reducers reject invalid movement and blocked spawns.

Monsters retain their direct movement in clear terrain. When blocked, pursuing monsters use a reverse breadth-first distance field to route around obstacles, shared by footprint size during the turn. Fleeing monsters select valid nearby steps away from the player. Combat behavior remains separate from terrain effects.

Blocked terrain shapes are reserved during encounter placement and included in trail obstacle geometry. Walkable valleys do not become obstacles. The existing trail generator continues to use its geometric routing rather than the monster distance field; both consume the same blocked region shape data. Later road/trail design phases remain separate.

## River compatibility

The river keeps its existing anchor (340, 195), 22×15 visual bounds, 13 authored rectangles, rendering and minimap display. A terrain-effect adapter interprets those rectangles as a walkable effect region, preserving heal +5 and hide on interaction turns. The legacy non-collision handler skips river effects so they do not execute twice. Multiple region effects can coexist.

River rectangles no longer block trail traversal. They remain placement reservations so generated encounters do not overlap the river artwork. Placement reservations and movement blocking are separate concerns.

## Saves

Gameboard manifest version is 5. Existing incompatible expedition saves follow the existing new-expedition flow so old trail and encounter geometry cannot intersect newly blocked terrain.

## Verification

Terrain tests cover blocked crossings, diagonal corners, larger monster footprints, reducer enforcement, monster routing around a wall, river shape/effect behavior, overlapping/entry-only effects, authored region boundary clearance and blocked spawn exhaustion. Existing trail tests now assert that the walkable river is excluded from traversal obstacles.

Final checks passed: TypeScript, formatting, lint (no errors; existing warnings remain), all 82 suites / 642 tests, and Expo web export. The authored-region tests verify all terrain shape cells clear the outer cliffs and that the Redoubt/player start, northern destination and Watcher anchors remain walkable.

## Inspection and Watcher presentation

Long-pressing a terrain shape opens the existing information dialog with its name, description and artwork. Foreground entities retain inspection priority, transparent margins do not capture long presses, and ordinary taps retain movement behavior. All five Watchers render at twice their original width and height around the existing footprint center; their information dialogs omit HP, AC and Attack.

Pre-push validation covered 82 suites / 644 tests. The full run passed 81 suites; the Jaunt Cave weapon suite hit a timeout while generating an unrelated world map. Its fixtures now use the existing `skipGameboardLayout` option, and both tests passed on targeted rerun. Formatting, lint (no errors), TypeScript and Expo web export passed.

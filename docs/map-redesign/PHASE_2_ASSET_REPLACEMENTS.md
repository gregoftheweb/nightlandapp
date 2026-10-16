# Phase 2: Building and Great Power asset replacements

This phase changes visual assets and pixel-size loader metadata only. Map coordinates, entity instance IDs, world footprints, collisions, terrain, trail generation, pathfinding, gameboard version, and encounter placement remain unchanged.

## Step 1 — buildings (completed first)

Converted all **16 building images**, including five archive variants, from `/mnt/devplex/Nightland/assets/images/gameboard-buildings-NEW/` into `assets/images/sprites/buildings/gameboard-buildings/` at WebP quality 90. Dimensions and transparency were checked for every conversion. Nine superseded WebP building files were retired after all runtime references were updated.

Active replacements: Redoubt, Aero-Wreckage, Deep Silo, Tesseract/word-grid entrance, Jaunt Cave entrance, Current-Loom entrance, cursed totem, petrified willow, healing pool, and the existing poison-pool visual. Ruins are included as an available asset without adding a building or placement. The river, Hermit Hollow, and Rune Obelisk keep their existing art because there is no matching replacement.

The two archived `cursed-totem` sources share a basename. The JPG becomes `archive/cursed-totem.webp`; the PNG becomes `archive/cursed-totem-png.webp`, preserving both.

Step 1 verification completed before Step 2: all 16 images decoded as WebP, dimensions/alpha matched their originals, TypeScript passed, and 51 targeted loader/catalog tests passed.

## Step 2 — Great Powers and Watchers

Converted all **8 Great Power images**, including three archive variants, from `/mnt/devplex/Nightland/assets/images/Great Powers/` into `assets/images/sprites/great-powers/`.

| Watcher    | Stable template ID | Selected source                 |
| ---------- | ------------------ | ------------------------------- |
| North-West | `watcher_nw`       | `watcher-north-west.png`        |
| North-East | `watcher_ne`       | `watcher-north-east.png`        |
| South-West | `watcher_sw`       | `watcher-south-west.png`        |
| South      | `watcher_s`        | `watcher-south.png`             |
| South-East | `watcher_se`       | `watcher-south-east-circle.png` |

Only South-East currently has a board instance. Its placement and behavior remain intact. The other four directions are registered as available templates, without adding coordinates or instances. Archived alternatives and unnamed Gemini images are included without guessing new entities or replacing the selected directional art.

## Updated runtime references

- `config/objects.ts`
- `config/subGames.ts`
- `config/monsters.ts`
- `app/sub-games/_shared/word-grid/assetCatalog.ts`
- `app/sub-games/_shared/current-loom/assetCatalog.ts`
- `app/sub-games/_shared/timed-encounter/assetCatalog.ts`
- `components/startup/GameBoardImagePreloader.tsx`
- `components/GameBoard.tsx`
- `app/game/index.tsx`

The startup preloader now covers the new water-pool, petrified-willow, Current-Loom, and four additional Watcher images. Pixel-size metadata matches the new images (1254×1254 for the active buildings and most Watchers, 1024×1024 for South-West). Existing tile footprints are not resized. The preloader behavior tests were updated to handle the expanded registry.

## Complete conversion manifests

- `assets/images/sprites/buildings/gameboard-buildings/README.md` lists every building source, output WebP, and logical use.
- `assets/images/sprites/great-powers/README.md` lists every Great Power source, output WebP, and directional mapping.

Source originals were left untouched. No AI regeneration, cropping, background removal, or map changes were performed.

## Final validation

- All 24 output files decode as WebP; source dimensions and existing alpha channels are preserved.
- All 185 static image references resolve to existing files, including every new Watcher template.
- `pnpm check` passed: formatting, lint, TypeScript, and 80 suites / 633 tests.
- `pnpm exec expo export --platform web` succeeded without missing-asset errors.
- Layout, world anchors, gameboard manifest, collision, movement, trail generation, and pathfinding files have no changes.

## Follow-up: reference-map Watcher placement

After the asset replacement, all five Watchers were placed at the user's request. Upper-left anchors for their unchanged 6×6 footprints:

| Watcher    | Row | Column |
| ---------- | --- | ------ |
| North-West | 165 | 157    |
| North-East | 161 | 229    |
| South-West | 253 | 137    |
| South      | 281 | 203    |
| South-East | 265 | 255    |

These approximate the supplied map relative to the Redoubt center at (200, 200). The South-East Watcher keeps its existing instance ID and combat overrides. The debug minimap displays each placed Watcher's artwork and name. Manifest version 4 requires a new expedition rather than restoring an obsolete layout. Collision and pathfinding algorithms are unchanged; the existing occupancy system includes the new Watcher footprints.

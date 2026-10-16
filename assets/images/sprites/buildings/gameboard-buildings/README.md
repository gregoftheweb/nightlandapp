# Building asset replacements

Source: `/mnt/devplex/Nightland/assets/images/gameboard-buildings-NEW/`. All 16 images were converted to WebP at quality 90, encoding method 6. Original dimensions and alpha channels were verified unchanged. Originals remain in the source folder.

| Source file                      | WebP file in this directory       | Existing logical use                                                   |
| -------------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| `aero-wreckage.png`              | `aero-wreckage.webp`              | aerowreckage-puzzle entrance                                           |
| `archive/cursed-totem.jpg`       | `archive/cursed-totem.webp`       | Archived alternative; not selected at runtime                          |
| `archive/cursed-totem.png`       | `archive/cursed-totem-png.webp`   | Archived alternative; not selected at runtime                          |
| `archive/jaunt-cave.png`         | `archive/jaunt-cave.webp`         | Archived alternative; not selected at runtime                          |
| `archive/last-redoubt.png`       | `archive/last-redoubt.webp`       | Archived alternative; not selected at runtime                          |
| `archive/loom-entrance.png`      | `archive/loom-entrance.webp`      | Archived alternative; not selected at runtime                          |
| `cursed-totem-no-rear-gear.png`  | `cursed-totem-no-rear-gear.webp`  | cursedTotem                                                            |
| `jaunt-cave-no-rear-gear.png`    | `jaunt-cave-no-rear-gear.webp`    | jaunt-cave-entrance / both Jaunt Cave instances                        |
| `loom-entrance-no-rear-gear.png` | `loom-entrance-no-rear-gear.webp` | current-loom-entrance / all Current-Loom instances                     |
| `petrified-willow.png`           | `petrified-willow.webp`           | petrifiedWillow                                                        |
| `pool-of-peace.png`              | `pool-of-peace.webp`              | healingPool                                                            |
| `pool-of-water.png`              | `pool-of-water.webp`              | poisonPool visual; existing poison effects unchanged                   |
| `redoubt.png`                    | `redoubt.webp`                    | redoubt (Last Redoubt)                                                 |
| `ruins.png`                      | `ruins.webp`                      | Included for future use; no existing matching building ID or placement |
| `silo.png`                       | `silo.webp`                       | deep-silo entrance                                                     |
| `tesseract-puzzle.png`           | `tesseract-puzzle.webp`           | tesseract-entrance / existing word-grid entrances                      |

The archived PNG/JPG pair shares the name `cursed-totem`. The JPG keeps `archive/cursed-totem.webp`; the PNG is named `archive/cursed-totem-png.webp` so neither variant overwrites the other. Prompt text files are not images and were not converted.

Root no-rear-gear variants are the active cave, loom, and totem images. The river, Hermit Hollow, and Rune Obelisk have no matching replacement in the source folder and retain their existing artwork. `ruins.webp` is available without inventing a new entity or changing the map.

References were updated in `config/objects.ts`, `config/subGames.ts`, the word-grid/current-loom/timed-encounter asset catalogs, and `components/startup/GameBoardImagePreloader.tsx`. Loader pixel dimensions reflect the new 1254×1254 active images; world footprints, IDs, positions, effects, and pathfinding remain unchanged.

# Building asset replacements

**Current set (as of 2026-10-20):** realistic/detailed illustrations, sourced from
`/mnt/devplex/Nightland/Docs/assets/buildings-real/`. These replaced an earlier
stylized-circular-badge set (ornate ring frame, in-image text label) that lived in this
directory before. The badge set is not preserved anywhere in this repo; if it's ever
wanted again it would need to be re-sourced.

| File                    | Logical use                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `aero-wreckage.webp`    | aerowreckage-puzzle entrance                                           |
| `cursed-totem.webp`     | cursedTotem                                                            |
| `hermit-hollow.webp`    | hermit-hollow entrance (same art already used by the sub-game itself)  |
| `jaunt-cave.webp`       | jaunt-cave-entrance / both Jaunt Cave instances                        |
| `loom-entrance.webp`    | current-loom-entrance / all Current-Loom instances                     |
| `petrified-willow.webp` | petrifiedWillow                                                        |
| `pool-of-peace.webp`    | healingPool                                                            |
| `pool-of-water.webp`    | poisonPool visual; existing poison effects unchanged                   |
| `redoubt.webp`          | redoubt (Last Redoubt)                                                 |
| `ruins.webp`            | Included for future use; no existing matching building ID or placement |
| `rune-obelisk.webp`     | rune-obelisk entrance (centralized copy; see note below)               |
| `silo.webp`             | deep-silo entrance                                                     |
| `tesseract-puzzle.webp` | tesseract-entrance / existing word-grid entrances                      |

These images are **not uniform dimensions** (unlike the old 1254x1254 badge set) - they
vary per asset. The gameboard renders every building with `resizeMode="contain"`
(`components/GameBoard.tsx`), so non-square/differently-sized source images display
correctly without distortion. Declared `width`/`height` values in preload asset lists
(`GameBoardImagePreloader.tsx`, word-grid/current-loom/timed-encounter asset catalogs)
are only used to size tiny hidden decode-trigger views and do not need to match each
image's real aspect ratio.

## Centralization note (2026-10-20)

Every sub-game's overworld/gameboard building icon should import from this directory -
no sub-game should source its own gameboard entrance image from its own background
folder (`assets/images/backgrounds/subgames/<name>/...`). Two had drifted from that
rule and were fixed:

- **hermit-hollow** - `config/subGames.ts` previously imported the entrance icon from
  `assets/images/backgrounds/subgames/hermit/hermit-save2.webp` (a byte-identical
  duplicate of this directory's `hermit-hollow.webp`). Re-pointed the import here; the
  duplicate file was deleted.
- **rune-obelisk** - `config/subGames.ts` previously imported the entrance icon from
  `assets/images/backgrounds/subgames/rosseta/obelisk-entrance.webp`. That file is also
  legitimately used as the sub-game's own intro-screen background and stays there for
  that purpose; a copy was added here as `rune-obelisk.webp` specifically for the
  gameboard icon reference, and only the gameboard reference (in `config/subGames.ts`
  and `GameBoardImagePreloader.tsx`) now points at it.

Historical note: an earlier asset-replacement pass (see git history) sourced from files
named with a `-no-rear-gear` suffix (e.g. `cursed-totem-no-rear-gear.png`). No file or
code reference with that suffix remains in the repo; it only ever existed in the
original (external) source folder's filenames, not here.

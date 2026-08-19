import type { GameboardManifest } from './types/gameboard'
/**
 * Authored gameboard structure matching today's encounter set.
 * This value is validated in tests but is not consumed by the running game yet.
 *
 * NOTE: placement percentages currently reflect today's dev/test layout —
 * all four one-off encounters are clustered near the level start for easy
 * testing, per current practice. These are NOT final story-beat positions
 * (e.g. Aero-Wreckage at ~1/3, Jaunt Cave at midpoint, per original design
 * intent). Update these ranges when the real level path/placement is
 * designed — do not treat these values as intentional final placement.
 */
export const GAMEBOARD_MANIFEST = {
  version: 1,
  slots: [
    {
      slotId: 'hermit-hollow',
      shapeId: 'dialogue',
      kind: 'range',
      placement: { minPct: 0, maxPct: 0.025 },
      contentRef: 'hermit-hollow',
    },
    {
      slotId: 'aerowreckage-puzzle',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0, maxPct: 0.03 },
      contentRef: 'aerowreckage-puzzle',
    },
    {
      slotId: 'deep-silo',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0, maxPct: 0.04 },
      contentRef: 'deep-silo',
    },
    {
      slotId: 'jaunt-cave',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0, maxPct: 0.05 },
      contentRef: 'jaunt-cave',
    },
    {
      slotId: 'word-grid-clues',
      shapeId: 'word-grid',
      kind: 'scattered-group',
      placement: { exclude: ['end'] },
      instances: ['tesseract-crypt-01'],
    },
  ],
} satisfies GameboardManifest

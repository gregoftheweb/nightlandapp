import type { GameboardManifest } from './types/gameboard'

/**
 * Authored gameboard structure matching today's encounter set.
 *
 * NOTE: placement percentages are spaced apart just enough to avoid
 * footprint collisions during layout-generator testing (build order step 6),
 * kept intentionally tight/close together for fast manual testing. These
 * are NOT final story-beat positions. Real design intent for later:
 * Aero-Wreckage ~1/3 along the path, Jaunt Cave at the midpoint, Deep Silo
 * and Hermit Hollow's real positions TBD. Update these ranges once real
 * trail geometry (build order step 8) replaces the current linear-interpolation
 * stub PathPositionResolver.
 */
export const GAMEBOARD_MANIFEST = {
  version: 1,
  slots: [
    {
      slotId: 'hermit-hollow',
      shapeId: 'dialogue',
      kind: 'range',
      placement: { minPct: 0.02, maxPct: 0.06 },
      contentRef: 'hermit-hollow',
    },
    {
      slotId: 'aerowreckage-puzzle',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.09, maxPct: 0.13 },
      contentRef: 'aerowreckage-puzzle',
    },
    {
      slotId: 'jaunt-cave',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.16, maxPct: 0.2 },
      contentRef: 'jaunt-cave',
    },
    {
      slotId: 'deep-silo',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.23, maxPct: 0.27 },
      contentRef: 'deep-silo',
    },
    {
      slotId: 'word-grid-clues',
      shapeId: 'word-grid',
      kind: 'scattered-group',
      placement: { exclude: ['end'] },
      instances: ['word-tile-crypt-01', 'word-tile-crypt-02'],
    },
  ],
} satisfies GameboardManifest

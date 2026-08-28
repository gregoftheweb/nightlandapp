import type { GameboardManifest } from './types/gameboard'

/**
 * Act One follows the Earth-Current pacing plan in GAMEPLAY_STORY_DESIGN.md.
 * Slot order mirrors narrative order; range slots provide the corresponding
 * trunk progression. The two middle Looms remain a scattered group so trail
 * generation can place them on branch trails.
 *
 * Rune-locks and Deep Silo's five-Loom hard gate are encounter/runtime rules,
 * not placement concerns, and therefore are not represented by this manifest.
 */
export const GAMEBOARD_MANIFEST = {
  version: 2,
  slots: [
    {
      slotId: 'tesseract-note',
      shapeId: 'word-grid',
      kind: 'range',
      placement: { minPct: 0.02, maxPct: 0.06 },
      contentRef: 'word-tile-crypt-01',
    },
    {
      slotId: 'hermit-hollow',
      shapeId: 'dialogue',
      kind: 'range',
      placement: { minPct: 0.1, maxPct: 0.14 },
      contentRef: 'hermit-hollow',
    },
    {
      slotId: 'salamander-note',
      shapeId: 'word-grid',
      kind: 'range',
      placement: { minPct: 0.18, maxPct: 0.22 },
      contentRef: 'word-tile-crypt-02',
    },
    {
      slotId: 'aerowreckage-puzzle',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.26, maxPct: 0.3 },
      contentRef: 'aerowreckage-puzzle',
    },
    {
      slotId: 'current-loom-first',
      shapeId: 'current-loom',
      kind: 'range',
      placement: { minPct: 0.34, maxPct: 0.38 },
      contentRef: 'current-loom-01',
    },
    {
      slotId: 'current-looms-branches',
      shapeId: 'current-loom',
      kind: 'scattered-group',
      placement: { exclude: ['end'], minSpacingPct: 0.05 },
      instances: ['current-loom-02', 'current-loom-03'],
    },
    {
      slotId: 'jaunt-cave-first',
      shapeId: 'timed-encounter',
      kind: 'range',
      placement: { minPct: 0.46, maxPct: 0.5 },
      contentRef: 'jaunt-cave',
    },
    {
      slotId: 'deep-silo',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.58, maxPct: 0.62 },
      contentRef: 'deep-silo',
    },
    {
      slotId: 'rune-obelisk',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.66, maxPct: 0.7 },
      contentRef: 'rune-obelisk',
    },
    {
      slotId: 'current-loom-fourth',
      shapeId: 'current-loom',
      kind: 'range',
      placement: { minPct: 0.74, maxPct: 0.78 },
      contentRef: 'current-loom-04',
    },
    {
      slotId: 'jaunt-cave-second',
      shapeId: 'timed-encounter',
      kind: 'range',
      placement: { minPct: 0.82, maxPct: 0.86 },
      contentRef: 'jaunt-cave-02',
    },
    {
      slotId: 'current-loom-fifth',
      shapeId: 'current-loom',
      kind: 'range',
      placement: { minPct: 0.9, maxPct: 0.94 },
      contentRef: 'current-loom-05',
    },
  ],
} satisfies GameboardManifest

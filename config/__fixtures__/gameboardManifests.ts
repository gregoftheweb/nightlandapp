import type { GameboardManifest } from '../types/gameboard'

export const VALID_GAMEBOARD_MANIFEST: GameboardManifest = {
  version: 1,
  slots: [
    {
      slotId: 'jaunt-range',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.4, maxPct: 0.5 },
      contentRef: 'jaunt-cave',
    },
    {
      slotId: 'deep-silo-range',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.55, maxPct: 0.65 },
      contentRef: 'deep-silo',
    },
    {
      slotId: 'aerowreckage-range',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.2, maxPct: 0.3 },
      contentRef: 'aerowreckage-puzzle',
    },
    {
      slotId: 'hermit-end',
      shapeId: 'dialogue',
      kind: 'end',
      contentRef: 'hermit-hollow',
    },
    {
      slotId: 'word-grid-clues',
      shapeId: 'word-grid',
      kind: 'scattered-group',
      placement: {
        exclude: [{ nearSlotId: 'jaunt-range', bufferPct: 0.05 }],
        minSpacingPct: 0.1,
      },
      instances: ['word-tile-crypt-01'],
    },
  ],
}

export function cloneGameboardManifest(): Record<string, any> {
  return JSON.parse(JSON.stringify(VALID_GAMEBOARD_MANIFEST))
}

const mutate =
  (change: (manifest: Record<string, any>) => void): (() => unknown) =>
  () => {
    const manifest = cloneGameboardManifest()
    change(manifest)
    return manifest
  }

export const invalidGameboardFixtures: Record<
  string,
  { expectedCode: string; make: () => unknown }
> = {
  invalidVersion: {
    expectedCode: 'invalid-manifest-version',
    make: mutate((manifest) => (manifest.version = 0)),
  },
  nonIntegerVersion: {
    expectedCode: 'invalid-manifest-version',
    make: mutate((manifest) => (manifest.version = 1.5)),
  },
  invalidManifest: {
    expectedCode: 'invalid-gameboard-manifest',
    make: () => null,
  },
  emptySlots: {
    expectedCode: 'empty-manifest-slots',
    make: () => ({ version: 1, slots: [] }),
  },
  invalidSlotId: {
    expectedCode: 'invalid-slot-id',
    make: mutate((manifest) => (manifest.slots[0].slotId = 'Bad Slot')),
  },
  duplicateSlotId: {
    expectedCode: 'duplicate-slot-id',
    make: mutate((manifest) => (manifest.slots[1].slotId = 'jaunt-range')),
  },
  invalidSlot: {
    expectedCode: 'invalid-slot',
    make: mutate((manifest) => (manifest.slots[0] = null)),
  },
  invalidRangeBounds: {
    expectedCode: 'invalid-range-bounds',
    make: mutate((manifest) => (manifest.slots[0].placement = { minPct: 0.8, maxPct: 0.2 })),
  },
  emptyScatteredInstances: {
    expectedCode: 'empty-scattered-instances',
    make: mutate((manifest) => (manifest.slots[4].instances = [])),
  },
  duplicateScatteredInstance: {
    expectedCode: 'duplicate-scattered-instance',
    make: mutate((manifest) => manifest.slots[4].instances.push('word-tile-crypt-01')),
  },
  unknownContentRef: {
    expectedCode: 'unknown-content-ref',
    make: mutate((manifest) => (manifest.slots[4].instances[0] = 'missing-grid')),
  },
  unknownRegistryContentRef: {
    expectedCode: 'unknown-content-ref',
    make: mutate((manifest) => (manifest.slots[0].contentRef = 'missing-one-off')),
  },
  invalidContentRef: {
    expectedCode: 'invalid-content-ref',
    make: mutate((manifest) => (manifest.slots[0].contentRef = 42)),
  },
  shapeMismatch: {
    expectedCode: 'shape-id-mismatch',
    make: mutate((manifest) => {
      manifest.slots[0].contentRef = 'word-tile-crypt-01'
    }),
  },
  unregisteredShape: {
    expectedCode: 'unregistered-shape-id',
    make: mutate((manifest) => (manifest.slots[0].shapeId = 'unknown-shape')),
  },
  globalDuplicateInstance: {
    expectedCode: 'duplicate-global-instance-id',
    make: mutate((manifest) => {
      manifest.slots.push({
        slotId: 'jaunt-end',
        shapeId: 'one-off',
        kind: 'end',
        contentRef: 'jaunt-cave',
      })
    }),
  },
  rangeWithScatteredFields: {
    expectedCode: 'invalid-slot-fields',
    make: mutate((manifest) => (manifest.slots[0].instances = ['deep-silo'])),
  },
  endWithScatteredFields: {
    expectedCode: 'invalid-slot-fields',
    make: mutate((manifest) => (manifest.slots[3].instances = ['deep-silo'])),
  },
  scatteredWithRangeFields: {
    expectedCode: 'invalid-slot-fields',
    make: mutate((manifest) => (manifest.slots[4].placement.minPct = 0.2)),
  },
  scatteredWithContentRef: {
    expectedCode: 'invalid-slot-fields',
    make: mutate((manifest) => (manifest.slots[4].contentRef = 'jaunt-cave')),
  },
  invalidMinSpacing: {
    expectedCode: 'invalid-min-spacing',
    make: mutate((manifest) => (manifest.slots[4].placement.minSpacingPct = 2)),
  },
  invalidBuffer: {
    expectedCode: 'invalid-region-buffer',
    make: mutate((manifest) => (manifest.slots[4].placement.exclude[0].bufferPct = -0.1)),
  },
  unknownNearSlot: {
    expectedCode: 'unknown-region-slot',
    make: mutate(
      (manifest) => (manifest.slots[4].placement.exclude[0].nearSlotId = 'missing-slot')
    ),
  },
  selfReferencingRegion: {
    expectedCode: 'self-referencing-region',
    make: mutate(
      (manifest) => (manifest.slots[4].placement.exclude[0].nearSlotId = 'word-grid-clues')
    ),
  },
  nearScatteredSlot: {
    expectedCode: 'invalid-region-slot-kind',
    make: mutate((manifest) => {
      manifest.slots.push({
        slotId: 'other-grids',
        shapeId: 'word-grid',
        kind: 'scattered-group',
        placement: { exclude: [] },
        instances: ['fixture-grid-01'],
      })
      manifest.slots[4].placement.exclude[0].nearSlotId = 'other-grids'
    }),
  },
  duplicateExclusion: {
    expectedCode: 'duplicate-exclusion',
    make: mutate((manifest) => {
      manifest.slots[4].placement.exclude = ['start', 'start']
    }),
  },
  unsatisfiableExclusions: {
    expectedCode: 'unsatisfiable-exclusions',
    make: mutate((manifest) => {
      manifest.slots[4].placement.exclude = ['start', 'end']
    }),
  },
  invalidSlotKind: {
    expectedCode: 'invalid-slot-kind',
    make: mutate((manifest) => (manifest.slots[0].kind = 'somewhere')),
  },
  invalidRegion: {
    expectedCode: 'invalid-region',
    make: mutate((manifest) => (manifest.slots[4].placement.exclude = ['middle'])),
  },
  invalidExclusions: {
    expectedCode: 'invalid-exclusions',
    make: mutate((manifest) => delete manifest.slots[4].placement.exclude),
  },
}

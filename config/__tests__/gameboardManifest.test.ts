import { GAMEBOARD_MANIFEST } from '../gameboardManifest'
import { validateGameboardManifest } from '../gameboardManifestValidator'

describe('real gameboard manifest', () => {
  it('passes Tier 3 validation against the real registries and catalogs', () => {
    expect(validateGameboardManifest(GAMEBOARD_MANIFEST)).toEqual({
      success: true,
      value: GAMEBOARD_MANIFEST,
    })
  })

  it('follows the authored Act One encounter order', () => {
    expect(GAMEBOARD_MANIFEST.slots.map((slot) => slot.slotId)).toEqual([
      'tesseract-note',
      'hermit-hollow',
      'salamander-note',
      'aerowreckage-puzzle',
      'current-loom-first',
      'current-looms-branches',
      'jaunt-cave-first',
      'deep-silo',
      'rune-obelisk',
      'current-loom-fourth',
      'jaunt-cave-second',
      'current-loom-fifth',
    ])
  })

  it('registers exactly five Current-Looms, including two branch candidates', () => {
    const loomIds = GAMEBOARD_MANIFEST.slots.flatMap((slot) => {
      if (slot.shapeId !== 'current-loom') return []
      return slot.kind === 'scattered-group' ? slot.instances : [slot.contentRef]
    })
    expect(loomIds).toEqual([
      'current-loom-01',
      'current-loom-02',
      'current-loom-03',
      'current-loom-04',
      'current-loom-05',
    ])
    expect(
      GAMEBOARD_MANIFEST.slots.find((slot) => slot.slotId === 'current-looms-branches')
    ).toEqual(
      expect.objectContaining({
        kind: 'scattered-group',
        instances: ['current-loom-02', 'current-loom-03'],
      })
    )
  })

  it('registers the rune obelisk as a fixed one-off range slot', () => {
    const slot = GAMEBOARD_MANIFEST.slots.find((candidate) => candidate.slotId === 'rune-obelisk')
    expect(slot).toEqual({
      slotId: 'rune-obelisk',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.66, maxPct: 0.7 },
      contentRef: 'rune-obelisk',
    })
  })
})

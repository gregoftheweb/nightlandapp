import { GAMEBOARD_MANIFEST } from '../gameboardManifest'
import { validateGameboardManifest } from '../gameboardManifestValidator'

describe('real gameboard manifest', () => {
  it('passes Tier 3 validation against the real registries and catalogs', () => {
    expect(validateGameboardManifest(GAMEBOARD_MANIFEST)).toEqual({
      success: true,
      value: GAMEBOARD_MANIFEST,
    })
  })

  it('registers both word-grid encounters in the scattered group', () => {
    const wordGridSlot = GAMEBOARD_MANIFEST.slots.find((slot) => slot.slotId === 'word-grid-clues')
    expect(wordGridSlot).toEqual(
      expect.objectContaining({
        shapeId: 'word-grid',
        kind: 'scattered-group',
        instances: ['word-tile-crypt-01', 'word-tile-crypt-02'],
      })
    )
  })

  it('registers both Jaunt Cave instances in their own timed-encounter group', () => {
    const timedSlot = GAMEBOARD_MANIFEST.slots.find((slot) => slot.slotId === 'timed-encounters')
    expect(timedSlot).toEqual(
      expect.objectContaining({
        shapeId: 'timed-encounter',
        kind: 'scattered-group',
        instances: ['jaunt-cave', 'jaunt-cave-02'],
      })
    )
  })

  it('registers both Current-Loom instances in a scattered group', () => {
    const slot = GAMEBOARD_MANIFEST.slots.find((candidate) => candidate.slotId === 'current-looms')
    expect(slot).toEqual({
      slotId: 'current-looms',
      shapeId: 'current-loom',
      kind: 'scattered-group',
      placement: { exclude: ['end'] },
      instances: ['current-loom-01', 'current-loom-02'],
    })
  })

  it('registers the rune obelisk as a fixed one-off range slot', () => {
    const slot = GAMEBOARD_MANIFEST.slots.find((candidate) => candidate.slotId === 'rune-obelisk')
    expect(slot).toEqual({
      slotId: 'rune-obelisk',
      shapeId: 'one-off',
      kind: 'range',
      placement: { minPct: 0.16, maxPct: 0.2 },
      contentRef: 'rune-obelisk',
    })
  })
})

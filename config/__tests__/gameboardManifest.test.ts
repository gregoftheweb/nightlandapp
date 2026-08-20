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
})

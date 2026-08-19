import { GAMEBOARD_MANIFEST } from '../gameboardManifest'
import { validateGameboardManifest } from '../gameboardManifestValidator'

describe('real gameboard manifest', () => {
  it('passes Tier 3 validation against the real registries and catalogs', () => {
    expect(validateGameboardManifest(GAMEBOARD_MANIFEST)).toEqual({
      success: true,
      value: GAMEBOARD_MANIFEST,
    })
  })
})

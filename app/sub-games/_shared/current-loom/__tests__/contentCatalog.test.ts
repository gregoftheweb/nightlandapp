import { CURRENT_LOOM_ASSETS } from '../assetCatalog'
import { parsedCurrentLoomContentResult, RAW_CURRENT_LOOM_CONTENT } from '../contentCatalog'

describe('Current-Loom Tier 2 catalog', () => {
  it('contains all five authored instances keyed by instanceId', () => {
    expect(Object.keys(RAW_CURRENT_LOOM_CONTENT)).toEqual([
      'current-loom-01',
      'current-loom-02',
      'current-loom-03',
      'current-loom-04',
      'current-loom-05',
    ])
    expect(parsedCurrentLoomContentResult.success).toBe(true)
    if (!parsedCurrentLoomContentResult.success) return
    expect(Object.keys(parsedCurrentLoomContentResult.value)).toEqual([
      'current-loom-01',
      'current-loom-02',
      'current-loom-03',
      'current-loom-04',
      'current-loom-05',
    ])
  })

  it('shares the identical five visual asset ids across all instances', () => {
    const references = Object.values(RAW_CURRENT_LOOM_CONTENT).map((entry) => [
      entry.metadata.entrance.assetId,
      entry.presentation.puzzle.assetId,
      entry.presentation.intro.assetId,
      entry.presentation.hazard.assetId,
      entry.presentation.success.assetId,
    ])
    references.forEach((reference) => expect(reference).toEqual(references[0]))
    expect(new Set(references[0])).toEqual(new Set(Object.keys(CURRENT_LOOM_ASSETS)))
  })
})

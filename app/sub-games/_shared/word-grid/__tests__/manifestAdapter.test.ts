import { createWordGridAssetCatalog, type WordGridAssetCatalog } from '../assetCatalog'
import { createWordGridShapeAdapter, validateWordGridManifest } from '../manifestAdapter'
import {
  VALID_WORD_GRID_ENTRY,
  VALID_WORD_GRID_MANIFEST,
  invalidManifestFixtures,
} from '../__fixtures__/manifestFixtures'

const assetRegistrations = ['board', 'entrance', 'intro', 'failure', 'success'].map(
  (assetId, index) => ({
    assetId,
    image: index + 1,
    intrinsicSize: { width: 100, height: 80 },
  })
)

const builtAssets = createWordGridAssetCatalog(assetRegistrations)
if (!builtAssets.success) throw new Error('Fixture asset catalog must be valid')
const assets: WordGridAssetCatalog = builtAssets.value

const baseOptions = {
  assets,
  reservedInstanceIds: new Set(['jaunt-cave', 'deep-silo', 'hermit-hollow', 'aerowreckage-puzzle']),
}

describe('word-grid manifest schema and adapter', () => {
  it('parses a complete valid fixture into registry and renderer configurations', () => {
    const result = validateWordGridManifest(VALID_WORD_GRID_MANIFEST, baseOptions)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.value).toHaveLength(1)
    const parsed = result.value[0]
    expect(parsed.definition).toEqual(
      expect.objectContaining({
        instanceId: 'fixture-grid-01',
        shapeId: 'word-grid',
        placementPolicy: 'generated',
        entryRoute: '/sub-games/word-grid/fixture-grid-01',
        title: 'Fixture Grid',
      })
    )
    expect(parsed.shapeConfig.targetSequence).toEqual(['N', 'I', 'G', 'H', 'T'])
    expect(parsed.shapeConfig.gridRect).toEqual({ left: 0.1, top: 0.1, right: 0.9, bottom: 0.9 })
    expect(parsed.shapeConfig.presentation.intro.backgroundAsset).toBe(3)
    expect(parsed.shapeConfig.tapFeedback).toEqual(
      VALID_WORD_GRID_ENTRY.presentation.puzzle.tapFeedback
    )
  })

  it('declares explicit instance-preserving routes', () => {
    const adapter = createWordGridShapeAdapter({ assets })
    expect(adapter.routes('fixture-grid-01')).toEqual({
      entry: '/sub-games/word-grid/fixture-grid-01',
      success: '/sub-games/word-grid/fixture-grid-01/success',
      aftermath: '/sub-games/word-grid/fixture-grid-01/aftermath',
    })
  })

  it('validates reward ids against real reward catalogs', () => {
    const adapter = createWordGridShapeAdapter({ assets })
    expect(adapter.validateRewardId('persius-scroll', 'item')).toBe(true)
    expect(adapter.validateRewardId('weapon-lazer-pistol-001', 'weapon')).toBe(true)
    expect(adapter.validateRewardId('unlock_hide_ability', 'ability')).toBe(true)
    expect(adapter.validateRewardId('not-a-reward', 'item')).toBe(false)
  })

  it('collects all errors from an entry instead of stopping at the first', () => {
    const invalid = invalidManifestFixtures.invalidRows.make() as Record<string, any>
    invalid.instances[0].metadata.title = ''
    invalid.instances[0].content.targetSequence = 'night'
    invalid.instances[0].content.assetId = 'missing'

    const result = validateWordGridManifest(invalid, baseOptions)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'invalid-grid-size',
        'invalid-metadata-title',
        'invalid-target-sequence',
        'unknown-asset-id',
      ])
    )
  })

  it.each(Object.entries(invalidManifestFixtures))(
    'rejects the %s fixture with its specific validation error',
    (name, fixture) => {
      const options =
        name === 'generatedHasFixedPlacement'
          ? { ...baseOptions, fixedPlacementInstanceIds: new Set(['fixture-grid-01']) }
          : baseOptions
      const result = validateWordGridManifest(fixture.make(), options)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.errors.map(({ code }) => code)).toContain(fixture.expectedCode)
    }
  )

  it('rejects duplicate asset registrations before a catalog can be used', () => {
    const result = createWordGridAssetCatalog([
      assetRegistrations[0],
      { ...assetRegistrations[0], image: 99 },
    ])
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.map(({ code }) => code)).toContain('duplicate-asset-id')
  })

  it('rejects invalid asset dimensions before a catalog can be used', () => {
    const result = createWordGridAssetCatalog([
      { ...assetRegistrations[0], intrinsicSize: { width: 0, height: 80 } },
    ])
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.map(({ code }) => code)).toContain('invalid-asset-dimensions')
  })
})

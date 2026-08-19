import { buildParsedCatalog, buildRawCatalog } from '@config/contentCatalog'
import { SUB_GAMES } from '@config/subGames'

import { createWordGridAssetCatalog } from '../assetCatalog'
import { parsedWordGridContentResult } from '../contentCatalog'
import { createWordGridShapeAdapter } from '../manifestAdapter'
import { tesseractWordGridConfig } from '../../../tesseract/wordGridConfig'
import {
  cloneContent,
  invalidContentFixtures,
  VALID_WORD_GRID_CONTENT,
} from '../__fixtures__/manifestFixtures'

const fixtureAssetsResult = createWordGridAssetCatalog(
  ['board', 'entrance', 'intro', 'failure', 'success'].map((assetId, index) => ({
    assetId,
    image: index + 1,
    intrinsicSize: { width: 100, height: 80 },
  }))
)

if (!fixtureAssetsResult.success) throw new Error('Fixture asset catalog must be valid')
const adapter = createWordGridShapeAdapter({ assets: fixtureAssetsResult.value })

describe('content catalogs', () => {
  it('parses tesseract-crypt-01 equivalently to the current hardcoded content', () => {
    expect(parsedWordGridContentResult.success).toBe(true)
    if (!parsedWordGridContentResult.success) return

    const parsed = parsedWordGridContentResult.value['tesseract-crypt-01']
    const currentDefinition = SUB_GAMES['tesseract-crypt-01']
    expect(parsed).toBeDefined()

    const { puzzleRoute, wrongInputOutcome, successOutcome, ...parsedContentConfig } =
      parsed.shapeConfig
    const {
      puzzleRoute: _currentPuzzleRoute,
      wrongInputOutcome: _currentWrongInputOutcome,
      successOutcome: _currentSuccessOutcome,
      ...currentContentConfig
    } = tesseractWordGridConfig

    expect(parsedContentConfig).toEqual(currentContentConfig)
    expect(parsed.definition).toEqual(
      expect.objectContaining({
        instanceId: currentDefinition.instanceId,
        shapeId: currentDefinition.shapeId,
        title: currentDefinition.title,
        description: currentDefinition.description,
        introBackgroundImage: currentDefinition.introBackgroundImage,
      })
    )
    expect(parsed.definition.entrance).toEqual(currentDefinition.entrance)
    expect(parsed.definition.lifecycle.failure).toEqual(currentDefinition.lifecycle.failure)
    expect(parsed.definition.lifecycle.waypoint).toEqual(currentDefinition.lifecycle.waypoint)
    expect(parsed.definition.lifecycle.revisit).toBe(currentDefinition.lifecycle.revisit)
    expect(parsed.definition.lifecycle.progress).toEqual(currentDefinition.lifecycle.progress)
    expect(parsed.definition.lifecycle.returnToRpg).toEqual(currentDefinition.lifecycle.returnToRpg)
    expect(parsed.definition.lifecycle.completion).toEqual({
      event: 'success-confirmed',
      idempotent: currentDefinition.lifecycle.completion.idempotent,
    })
    expect(parsed.definition.lifecycle.reward).toEqual({
      kind: 'item',
      id: 'persius-scroll',
      grantEvent: 'success-screen-entered',
      idempotent: true,
    })

    // Tier 1 intentionally produces the future dynamic routes; runtime still uses legacy routes.
    expect({ puzzleRoute, wrongInputOutcome, successOutcome }).toEqual({
      puzzleRoute: '/sub-games/word-grid/tesseract-crypt-01/puzzle',
      wrongInputOutcome: {
        route: '/sub-games/word-grid/tesseract-crypt-01/failure',
        delayMs: 500,
      },
      successOutcome: {
        route: '/sub-games/word-grid/tesseract-crypt-01/success',
        delayMs: 500,
      },
    })
  })

  it('builds an immutable parsed catalog from valid raw content', () => {
    const raw = buildRawCatalog([
      { instanceId: VALID_WORD_GRID_CONTENT.instanceId, content: VALID_WORD_GRID_CONTENT },
    ])

    const result = buildParsedCatalog(raw, adapter)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(Object.isFrozen(result.value)).toBe(true)
    expect(result.value['fixture-grid-01'].definition.instanceId).toBe('fixture-grid-01')
    expect(result.value['fixture-grid-01'].shapeConfig.targetSequence).toEqual([
      'N',
      'I',
      'G',
      'H',
      'T',
    ])
  })

  it('rejects a catalog key that differs from the content instanceId', () => {
    const result = buildParsedCatalog({ 'wrong-key': VALID_WORD_GRID_CONTENT }, adapter)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'catalog-key-instance-id-mismatch' }),
      ])
    )
  })

  it('rejects duplicate registrations before constructing a raw catalog', () => {
    expect(() =>
      buildRawCatalog([
        { instanceId: 'fixture-grid-01', content: VALID_WORD_GRID_CONTENT },
        { instanceId: 'fixture-grid-01', content: cloneContent() },
      ])
    ).toThrow("Duplicate content registration for instanceId 'fixture-grid-01'")
  })

  it('aggregates content errors from every invalid catalog entry and returns no catalog', () => {
    const invalidRows = invalidContentFixtures.invalidRows.make() as Record<string, any>
    invalidRows.instanceId = 'fixture-grid-rows'
    const invalidTarget = invalidContentFixtures.invalidTargetCharacters.make() as Record<
      string,
      any
    >
    invalidTarget.instanceId = 'fixture-grid-target'
    const raw = buildRawCatalog([
      { instanceId: 'fixture-grid-01', content: VALID_WORD_GRID_CONTENT },
      { instanceId: 'fixture-grid-rows', content: invalidRows },
      { instanceId: 'fixture-grid-target', content: invalidTarget },
    ])

    const result = buildParsedCatalog(raw, adapter)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result).not.toHaveProperty('value')
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'invalid-grid-size' }),
        expect.objectContaining({ code: 'invalid-target-sequence' }),
      ])
    )
  })
})

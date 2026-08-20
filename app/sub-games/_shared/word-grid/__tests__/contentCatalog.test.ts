import { buildParsedCatalog, buildRawCatalog } from '@config/contentCatalog'
import { collectible, SALAMANDER_LETTER_TEXT } from '@config/objects'

import { createWordGridAssetCatalog } from '../assetCatalog'
import { parsedWordGridContentResult } from '../contentCatalog'
import { createWordGridShapeAdapter } from '../manifestAdapter'
import { wordTileCrypt01Content } from '../content/wordTileCrypt01'
import { wordTileCrypt02Content } from '../content/wordTileCrypt02'
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
  it('parses the solvable SALAMANDER encounter with its lifecycle and registered reward', () => {
    expect(parsedWordGridContentResult.success).toBe(true)
    if (!parsedWordGridContentResult.success) return

    const parsed = parsedWordGridContentResult.value['word-tile-crypt-02']
    expect(parsed).toBeDefined()
    expect(wordTileCrypt02Content.content.assetId).toBe('word-grid-board-blank')
    expect(wordTileCrypt02Content.content.rows).toBe(5)
    expect(wordTileCrypt02Content.content.columns).toBe(5)
    expect(parsed.shapeConfig.targetSequence).toEqual('SALAMANDER'.split(''))
    expect(parsed.definition.lifecycle).toEqual(
      expect.objectContaining({
        failure: {
          exit: 'death',
          message: 'Christos failed to spell SALAMANDER.',
          killerName: 'Ancient Evil',
          suppressDeathDialog: true,
          deathRoute: '/death',
        },
        waypoint: { createsWaypoint: false },
        revisit: 'success-screen',
        progress: { mode: 'local-only' },
        reward: {
          kind: 'item',
          id: 'salamander-letter',
          grantEvent: 'success-screen-entered',
          idempotent: true,
        },
      })
    )

    const availableCounts = wordTileCrypt02Content.content.letters
      .flat()
      .reduce<Record<string, number>>((counts, letter) => {
        counts[letter] = (counts[letter] ?? 0) + 1
        return counts
      }, {})
    const requiredCounts = 'SALAMANDER'
      .split('')
      .reduce<Record<string, number>>((counts, letter) => {
        counts[letter] = (counts[letter] ?? 0) + 1
        return counts
      }, {})
    expect(requiredCounts.A).toBe(3)
    Object.entries(requiredCounts).forEach(([letter, required]) => {
      expect(availableCounts[letter]).toBeGreaterThanOrEqual(required)
    })

    expect(collectible.salamanderLetter).toEqual(
      expect.objectContaining({
        shortName: 'salamanderLetter',
        name: "The Salamander's Letter",
        effects: [{ type: 'showMessage', message: SALAMANDER_LETTER_TEXT }],
      })
    )
    expect(wordTileCrypt02Content.presentation.success.rewardModalText).toBe(SALAMANDER_LETTER_TEXT)
  })

  it('parses word-tile-crypt-01 from authored content', () => {
    expect(parsedWordGridContentResult.success).toBe(true)
    if (!parsedWordGridContentResult.success) return

    const parsed = parsedWordGridContentResult.value['word-tile-crypt-01']
    expect(parsed).toBeDefined()
    expect(wordTileCrypt01Content.content.assetId).toBe('word-grid-board-blank')

    const { puzzleRoute, wrongInputOutcome, successOutcome } = parsed.shapeConfig
    expect(parsed.shapeConfig.letters).toEqual(wordTileCrypt01Content.content.letters)
    expect(parsed.shapeConfig.targetSequence).toEqual('TESSERACT'.split(''))
    expect(parsed.definition).toEqual(
      expect.objectContaining({
        instanceId: 'word-tile-crypt-01',
        shapeId: 'word-grid',
        title: wordTileCrypt01Content.metadata.title,
        description: wordTileCrypt01Content.metadata.description,
      })
    )
    expect(parsed.definition.lifecycle.failure).toEqual(wordTileCrypt01Content.lifecycle.failure)
    expect(parsed.definition.lifecycle.waypoint).toEqual(wordTileCrypt01Content.lifecycle.waypoint)
    expect(parsed.definition.lifecycle.revisit).toBe(wordTileCrypt01Content.lifecycle.revisit)
    expect(parsed.definition.lifecycle.progress).toEqual(wordTileCrypt01Content.lifecycle.progress)
    expect(parsed.definition.lifecycle.returnToRpg).toEqual(
      wordTileCrypt01Content.lifecycle.returnToRpg
    )
    expect(parsed.definition.lifecycle.completion).toEqual({
      event: 'success-confirmed',
      idempotent: true,
    })
    expect(parsed.definition.lifecycle.reward).toEqual({
      kind: 'item',
      id: 'persius-scroll',
      grantEvent: 'success-screen-entered',
      idempotent: true,
    })

    // Parsed routes are the real dynamic Expo Router URLs used at runtime.
    expect({ puzzleRoute, wrongInputOutcome, successOutcome }).toEqual({
      puzzleRoute: '/sub-games/word-grid/word-tile-crypt-01/puzzle',
      wrongInputOutcome: {
        route: '/sub-games/word-grid/word-tile-crypt-01/failure',
        delayMs: 500,
      },
      successOutcome: {
        route: '/sub-games/word-grid/word-tile-crypt-01/success',
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

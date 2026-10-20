import {
  invalidGameboardFixtures,
  VALID_GAMEBOARD_MANIFEST,
} from '../__fixtures__/gameboardManifests'
import { validateGameboardManifest } from '../gameboardManifestValidator'

describe('gameboard manifest validator', () => {
  it('accepts a valid manifest using real registry and parsed word-grid content', () => {
    const result = validateGameboardManifest(VALID_GAMEBOARD_MANIFEST)

    expect(result).toEqual({ success: true, value: VALID_GAMEBOARD_MANIFEST })
  })

  it.each(Object.entries(invalidGameboardFixtures))(
    'rejects the %s fixture with its specific validation error',
    (_name, fixture) => {
      const result = validateGameboardManifest(fixture.make())

      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.errors.map(({ code }) => code)).toContain(fixture.expectedCode)
    }
  )

  it('rejects an unregistered shape before attempting content lookup', () => {
    const result = validateGameboardManifest(invalidGameboardFixtures.unregisteredShape.make())

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.map(({ code }) => code)).toContain('unregistered-shape-id')
    expect(result.errors.map(({ code }) => code)).not.toContain('unknown-content-ref')
  })

  it('aggregates independent errors across slots', () => {
    const manifest = invalidGameboardFixtures.invalidVersion.make() as Record<string, any>
    manifest.slots[0].slotId = 'Bad Slot'
    manifest.slots[0].placement = { minPct: 0.9, maxPct: 0.1 }
    manifest.slots[1].contentRef = 'missing-dialogue'

    const result = validateGameboardManifest(manifest)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'invalid-manifest-version',
        'invalid-slot-id',
        'invalid-range-bounds',
        'unknown-content-ref',
      ])
    )
  })

  it('accepts a world-object slot referencing a real building template', () => {
    const manifest = JSON.parse(JSON.stringify(VALID_GAMEBOARD_MANIFEST))
    manifest.slots.push({
      slotId: 'poison-pool-range',
      shapeId: 'world-object',
      kind: 'range',
      placement: { minPct: 0.1, maxPct: 0.2 },
      contentRef: 'poisonPool',
    })

    const result = validateGameboardManifest(manifest)

    expect(result).toEqual({ success: true, value: manifest })
  })

  it('rejects a world-object slot referencing an unknown template', () => {
    const manifest = JSON.parse(JSON.stringify(VALID_GAMEBOARD_MANIFEST))
    manifest.slots.push({
      slotId: 'bogus-pool-range',
      shapeId: 'world-object',
      kind: 'range',
      placement: { minPct: 0.1, maxPct: 0.2 },
      contentRef: 'not-a-real-template',
    })

    const result = validateGameboardManifest(manifest)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.map(({ code }) => code)).toContain('unknown-content-ref')
  })
})

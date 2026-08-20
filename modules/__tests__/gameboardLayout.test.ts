import { GAMEBOARD_MANIFEST } from '@config/gameboardManifest'
import { levels } from '@config/levels'
import {
  getInitialState,
  fromSnapshot,
  IncompatibleGameboardSaveError,
  toSnapshot,
} from '../gameState'
import {
  buildBoardOccupancyRegistry,
  BoardOccupancyRegistry,
  generateLayout,
  LinearPathPositionResolver,
  RandomSource,
  REAL_PARSED_CONTENT_CATALOGS,
} from '../gameboardLayout'
import { buildGameboardCatalogIdentity, sha256 } from '../gameboardIdentity'

const encounterIds = [
  'jaunt-cave',
  'deep-silo',
  'aerowreckage-puzzle',
  'hermit-hollow',
  'tesseract-crypt-01',
]

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

describe('gameboard layout integration', () => {
  test('seeds real objects, every non-collision object, and player spawn', () => {
    const level = levels['1']
    const entries = buildBoardOccupancyRegistry(level).snapshot()
    expect(entries).toHaveLength(level.objects.length + level.nonCollisionObjects!.length + 1)
    expect(entries.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        ...level.objects.map(({ id }) => id),
        ...level.nonCollisionObjects!.map(({ id }) => id),
        'player-spawn',
      ])
    )
  })

  test.each(Array.from({ length: 50 }, (_, index) => index + 1))(
    'seed %i produces all placements without fixed or generated overlap',
    (seed) => {
      const occupancy = buildBoardOccupancyRegistry(levels['1'])
      const fixedCount = occupancy.snapshot().length
      const result = generateLayout(
        GAMEBOARD_MANIFEST,
        REAL_PARSED_CONTENT_CATALOGS,
        { width: 400, height: 400, occupancy },
        new LinearPathPositionResolver(),
        new RandomSource(seededRandom(seed))
      )
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.value.map(({ instanceId }) => instanceId).sort()).toEqual(
        [...encounterIds].sort()
      )
      expect(new Set(result.value.map(({ occupancyId }) => occupancyId)).size).toBe(5)
      expect(occupancy.snapshot()).toHaveLength(fixedCount + 5)
    }
  )

  test('succeeds repeatedly with the real Math.random source', () => {
    for (let run = 0; run < 25; run += 1) {
      const occupancy = buildBoardOccupancyRegistry(levels['1'])
      const result = generateLayout(
        GAMEBOARD_MANIFEST,
        REAL_PARSED_CONTENT_CATALOGS,
        { width: 400, height: 400, occupancy },
        new LinearPathPositionResolver(),
        new RandomSource()
      )
      expect(result.success).toBe(true)
      if (result.success) expect(result.value).toHaveLength(5)
    }
  })

  test('new game merges exactly one generated object per encounter into both runtime lists', () => {
    const state = getInitialState('1')
    expect(state.level.objects).toBe(state.objects)
    for (const instanceId of encounterIds) {
      expect(
        state.encounterPlacements.filter((entry) => entry.instanceId === instanceId)
      ).toHaveLength(1)
      expect(
        state.objects.filter((object) => object.subGame?.instanceId === instanceId)
      ).toHaveLength(1)
    }
  })

  test('save identity is SHA-256 and rejects mismatches instead of migrating', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    const state = getInitialState('1')
    expect(state.gameboardCatalogIdentity).toEqual(buildGameboardCatalogIdentity())
    const snapshot = toSnapshot(state)
    expect(fromSnapshot(snapshot).encounterPlacements).toEqual(state.encounterPlacements)
    expect(() =>
      fromSnapshot({
        ...snapshot,
        gameboardCatalogIdentity: { ...snapshot.gameboardCatalogIdentity, gameboardHash: 'stale' },
      })
    ).toThrow(IncompatibleGameboardSaveError)
  })

  test('returns every failed slot and overlap reason without throwing or partial output', () => {
    const occupancy = new BoardOccupancyRegistry()
    occupancy.reserve('block-path', { row: 0, col: 0 }, { width: 400, height: 400 })
    const result = generateLayout(
      GAMEBOARD_MANIFEST,
      REAL_PARSED_CONTENT_CATALOGS,
      { width: 400, height: 400, occupancy },
      new LinearPathPositionResolver(),
      new RandomSource(() => 0.5)
    )
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors).toHaveLength(5)
    expect(
      result.errors.every((error) => error.message.includes('would overlap existing object'))
    ).toBe(true)
  })
})

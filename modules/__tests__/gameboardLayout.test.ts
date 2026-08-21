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
  RandomSource,
  REAL_PARSED_CONTENT_CATALOGS,
} from '../gameboardLayout'
import { buildGameboardCatalogIdentity, sha256 } from '../gameboardIdentity'

const encounterIds = [
  'jaunt-cave',
  'deep-silo',
  'aerowreckage-puzzle',
  'hermit-hollow',
  'word-tile-crypt-01',
  'word-tile-crypt-02',
]

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

describe('gameboard layout integration', () => {
  test('seeds all four static buildings with their real footprints', () => {
    const level = levels['1']
    const registry = buildBoardOccupancyRegistry(level)
    const entries = registry.snapshot()
    expect(entries).toEqual(
      expect.arrayContaining([
        { id: 'redoubt_390_198', position: { row: 390, col: 198 }, width: 8, height: 8 },
        {
          id: 'healingPool_375_20',
          position: { row: 375, col: 20 },
          width: 4,
          height: 4,
        },
        {
          id: 'poisonPool_250_250',
          position: { row: 250, col: 250 },
          width: 2,
          height: 2,
        },
        {
          id: 'cursedTotem_385_220',
          position: { row: 385, col: 220 },
          width: 4,
          height: 8,
        },
      ])
    )
    level.objects.forEach((object) => {
      expect(registry.isFree(object.position!, { width: 1, height: 1 }).free).toBe(false)
    })
  })

  test('seeds all 48 hand-placed footsteps individually', () => {
    const level = levels['1']
    const footsteps = level.nonCollisionObjects!.filter((object) => object.type === 'footstep')
    const registry = buildBoardOccupancyRegistry(level)
    const entries = registry.snapshot()
    expect(footsteps).toHaveLength(48)
    footsteps.forEach((footstep) => {
      expect(entries).toContainEqual({
        id: footstep.id,
        position: footstep.position,
        width: footstep.width,
        height: footstep.height,
      })
      expect(registry.isFree(footstep.position, { width: 1, height: 1 }).free).toBe(false)
    })
  })

  test('seeds the river as its 13 real collision-mask segments, not its bounding box', () => {
    const level = levels['1']
    const river = level.nonCollisionObjects!.find((object) => object.type === 'river')!
    const registry = buildBoardOccupancyRegistry(level)
    const entries = registry.snapshot()
    const riverEntries = entries.filter((entry) => entry.id.startsWith(`${river.id}-mask-`))
    expect(river.collisionMask).toHaveLength(13)
    expect(riverEntries).toHaveLength(13)
    river.collisionMask!.forEach((segment, index) => {
      expect(riverEntries).toContainEqual({
        id: `${river.id}-mask-${index}`,
        position: {
          row: river.position.row + segment.row,
          col: river.position.col + segment.col,
        },
        width: segment.width ?? 1,
        height: segment.height ?? 1,
      })
    })
    expect(entries.some((entry) => entry.id === river.id)).toBe(false)
  })

  test('seeds the player spawn and canonical level Great Powers', () => {
    const level = levels['1']
    const registry = buildBoardOccupancyRegistry(level)
    const entries = registry.snapshot()
    expect(entries).toContainEqual({
      id: 'player-spawn',
      position: level.playerSpawn,
      width: 1,
      height: 1,
    })
    expect(entries).toContainEqual({
      id: 'watcher_se_380_180',
      position: { row: 380, col: 180 },
      width: 6,
      height: 6,
    })
    expect(registry.isFree(level.playerSpawn, { width: 1, height: 1 }).free).toBe(false)
    expect(registry.isFree({ row: 380, col: 180 }, { width: 1, height: 1 }).free).toBe(false)
    expect(entries).toHaveLength(67)
  })

  test('rejects conflicts with the Watcher and a static building', () => {
    const registry = buildBoardOccupancyRegistry(levels['1'])
    expect(registry.isFree({ row: 382, col: 182 }, { width: 1, height: 1 })).toEqual({
      free: false,
      overlappingIds: ['watcher_se_380_180'],
    })
    expect(() =>
      registry.reserve('watcher-conflict', { row: 382, col: 182 }, { width: 1, height: 1 })
    ).toThrow('would overlap existing object watcher_se_380_180')
    expect(registry.isFree({ row: 390, col: 198 }, { width: 1, height: 1 })).toEqual({
      free: false,
      overlappingIds: ['redoubt_390_198'],
    })
    expect(() =>
      registry.reserve('redoubt-conflict', { row: 390, col: 198 }, { width: 1, height: 1 })
    ).toThrow('would overlap existing object redoubt_390_198')
  })

  test('rejects a real river segment but permits empty space inside its bounding box', () => {
    const registry = buildBoardOccupancyRegistry(levels['1'])
    const segmentPosition = { row: 370, col: 197 }
    expect(registry.isFree(segmentPosition, { width: 1, height: 1 })).toEqual({
      free: false,
      overlappingIds: ['river_370_195_0-mask-0'],
    })
    expect(() =>
      registry.reserve('river-conflict', segmentPosition, { width: 1, height: 1 })
    ).toThrow('would overlap existing object river_370_195_0-mask-0')

    // The anchor is inside the 22x15 bounding rectangle but outside every real mask segment.
    expect(registry.isFree({ row: 370, col: 195 }, { width: 1, height: 1 })).toEqual({
      free: true,
      overlappingIds: [],
    })
  })

  test.each(Array.from({ length: 50 }, (_, index) => index + 1))(
    'seed %i produces all placements without fixed or generated overlap',
    (seed) => {
      const result = generateLayout(
        GAMEBOARD_MANIFEST,
        REAL_PARSED_CONTENT_CATALOGS,
        levels['1'],
        new RandomSource(seededRandom(seed))
      )
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.value.placements.map(({ instanceId }) => instanceId).sort()).toEqual(
        [...encounterIds].sort()
      )
      expect(new Set(result.value.placements.map(({ occupancyId }) => occupancyId)).size).toBe(6)
      expect(result.value.trailNetwork.geometry.trunkWaypoints.length).toBeGreaterThan(2)
      expect(result.value.trailNetwork.branches).toHaveLength(2)
      expect(
        result.value.placements.some(
          (placement) =>
            placement.location.type === 'branch' && placement.location.branchProgressPct >= 0.8
        )
      ).toBe(true)
      const independentOccupancy = buildBoardOccupancyRegistry(levels['1'])
      result.value.placements.forEach((placement) => {
        expect(independentOccupancy.isFree(placement.position, placement.footprint).free).toBe(true)
        independentOccupancy.reserve(placement.instanceId, placement.position, placement.footprint)
      })
    }
  )

  test('succeeds repeatedly with the real Math.random source', () => {
    for (let run = 0; run < 25; run += 1) {
      const result = generateLayout(
        GAMEBOARD_MANIFEST,
        REAL_PARSED_CONTENT_CATALOGS,
        levels['1'],
        new RandomSource()
      )
      expect(result.success).toBe(true)
      if (result.success) expect(result.value.placements).toHaveLength(6)
    }
  })

  test.each([7, 19, 43])('seed %i resolves placements against a real winding network', (seed) => {
    const result = generateLayout(
      GAMEBOARD_MANIFEST,
      REAL_PARSED_CONTENT_CATALOGS,
      levels['1'],
      new RandomSource(seededRandom(seed))
    )
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.value.trailNetwork.geometry.trunkWaypoints.length).toBeGreaterThan(2)
    expect(
      result.value.trailNetwork.geometry.trunkWaypoints.some(
        (point) => Math.abs(point.col - levels['1'].playerSpawn.col) > 20
      )
    ).toBe(true)
    result.value.placements.forEach((placement) => {
      expect(placement.position).toEqual(result.value.trailNetwork.resolve(placement.location))
    })
  })

  test('caps branch count to eligible scattered instances and allocates a branch terminus', () => {
    const oneScatteredInstanceManifest = {
      ...GAMEBOARD_MANIFEST,
      slots: GAMEBOARD_MANIFEST.slots.map((slot) =>
        slot.kind === 'scattered-group' ? { ...slot, instances: [slot.instances[0]] } : slot
      ),
    }
    const result = generateLayout(
      oneScatteredInstanceManifest,
      REAL_PARSED_CONTENT_CATALOGS,
      levels['1'],
      new RandomSource(seededRandom(31))
    )
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.value.trailNetwork.branches).toHaveLength(1)
    const scattered = result.value.placements.find(
      (placement) => placement.slotId === 'word-grid-clues'
    )!
    expect(scattered.location.type).toBe('branch')
    if (scattered.location.type === 'branch') {
      expect(scattered.location.branchProgressPct).toBeGreaterThanOrEqual(0.8)
    }
  })

  test('uses one occupancy registry for endpoint checks and every reservation', () => {
    const isFreeInstances = new Set<BoardOccupancyRegistry>()
    const reserveInstances = new Set<BoardOccupancyRegistry>()
    const originalIsFree = BoardOccupancyRegistry.prototype.isFree
    const originalReserve = BoardOccupancyRegistry.prototype.reserve
    const isFreeSpy = jest
      .spyOn(BoardOccupancyRegistry.prototype, 'isFree')
      .mockImplementation(function (this: BoardOccupancyRegistry, position, footprint) {
        isFreeInstances.add(this)
        return originalIsFree.call(this, position, footprint)
      })
    const reserveSpy = jest
      .spyOn(BoardOccupancyRegistry.prototype, 'reserve')
      .mockImplementation(function (this: BoardOccupancyRegistry, label, position, footprint) {
        reserveInstances.add(this)
        return originalReserve.call(this, label, position, footprint)
      })

    const result = generateLayout(
      GAMEBOARD_MANIFEST,
      REAL_PARSED_CONTENT_CATALOGS,
      levels['1'],
      new RandomSource(seededRandom(53))
    )
    isFreeSpy.mockRestore()
    reserveSpy.mockRestore()

    expect(result.success).toBe(true)
    expect(isFreeInstances.size).toBe(1)
    expect(reserveInstances.size).toBe(1)
    expect([...isFreeInstances][0]).toBe([...reserveInstances][0])
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

  test('rejects pre-release saves with the former flat placement progress schema', () => {
    const snapshot = toSnapshot(getInitialState('1'))
    const [placement, ...remaining] = snapshot.encounterPlacements
    expect(placement.location.type).toBe('trunk')
    if (placement.location.type !== 'trunk')
      throw new Error('Expected first manifest-authored placement on trunk')
    const { location: _location, ...placementWithoutLocation } = placement
    const legacySnapshot = {
      ...snapshot,
      encounterPlacements: [
        { ...placementWithoutLocation, progressPct: placement.location.progressPct },
        ...remaining,
      ],
    }
    expect(() => fromSnapshot(legacySnapshot as typeof snapshot)).toThrow(
      IncompatibleGameboardSaveError
    )
  })

  test('returns endpoint validation failure without throwing when the entire board is occupied', () => {
    const blockedLevel = {
      ...levels['1'],
      objects: [
        ...levels['1'].objects,
        {
          id: 'block-path',
          shortName: 'block-path',
          category: 'building',
          name: 'Block Path',
          position: { row: 0, col: 0 },
          size: { width: 400, height: 400 },
        },
      ],
    }
    const result = generateLayout(
      GAMEBOARD_MANIFEST,
      REAL_PARSED_CONTENT_CATALOGS,
      blockedLevel,
      new RandomSource(() => 0.5)
    )
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors).toEqual([
      expect.objectContaining({
        code: 'trail-endpoint-unavailable',
        path: 'trail.end',
      }),
    ])
  })
})

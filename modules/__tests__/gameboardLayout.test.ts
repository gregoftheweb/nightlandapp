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
import {
  generatedFootstepsToNonCollisionObjects,
  getRuntimeNonCollisionObjects,
} from '../runtimeNonCollisionObjects'
import { getNonCollisionTemplate } from '@config/objects'
import { buildSpatialGrid } from '../spacialGrid'
import { getObjectAtPoint } from '../utils'
import { FOOTSTEP_INTERVAL_TILES, MAX_BRANCH_LENGTH_TILES } from '../trailGeometry'
import * as trailGeometry from '../trailGeometry'

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

function pathLength(points: readonly { row: number; col: number }[]): number {
  return points
    .slice(1)
    .reduce(
      (sum, point, index) =>
        sum + Math.hypot(point.row - points[index].row, point.col - points[index].col),
      0
    )
}

function walkedDistanceToPoint(
  points: readonly { row: number; col: number }[],
  target: { row: number; col: number }
): number {
  let walked = 0
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const end = points[index]
    const deltaRow = end.row - start.row
    const deltaCol = end.col - start.col
    const segmentLengthSquared = deltaRow * deltaRow + deltaCol * deltaCol
    const progress = Math.max(
      0,
      Math.min(
        1,
        ((target.row - start.row) * deltaRow + (target.col - start.col) * deltaCol) /
          segmentLengthSquared
      )
    )
    const projected = {
      row: start.row + deltaRow * progress,
      col: start.col + deltaCol * progress,
    }
    if (Math.hypot(projected.row - target.row, projected.col - target.col) < 1e-6) {
      return walked + Math.sqrt(segmentLengthSquared) * progress
    }
    walked += Math.sqrt(segmentLengthSquared)
  }
  throw new Error('Point is not on path')
}

function overlapsRedoubt(position: { row: number; col: number }): boolean {
  return (
    position.row < 398 && position.row + 2 > 390 && position.col < 206 && position.col + 2 > 198
  )
}

function turnAngles(points: readonly { row: number; col: number }[]): number[] {
  const headings = points
    .slice(1)
    .map((point, index) => Math.atan2(point.col - points[index].col, points[index].row - point.row))
  return headings.slice(1).map((heading, index) => {
    const difference = Math.atan2(
      Math.sin(heading - headings[index]),
      Math.cos(heading - headings[index])
    )
    return (Math.abs(difference) * 180) / Math.PI
  })
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

  test('has no hand-placed footsteps or legacy footstep template', () => {
    const level = levels['1']
    const footsteps = level.nonCollisionObjects!.filter((object) => object.type === 'footstep')
    const registry = buildBoardOccupancyRegistry(level)
    const entries = registry.snapshot()
    expect(footsteps).toHaveLength(0)
    expect(entries.some((entry) => entry.id.includes('footsteps'))).toBe(false)
    expect(getNonCollisionTemplate('footsteps')).toBeUndefined()
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
    expect(entries).toHaveLength(19)
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
      result.value.trailNetwork.branches.forEach((branch) => {
        expect(branch.length).toBeGreaterThan(0)
        expect(branch.length).toBeLessThanOrEqual(MAX_BRANCH_LENGTH_TILES + 1e-10)
      })
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
      result.value.generatedFootsteps.forEach((footstep) => {
        expect(independentOccupancy.isFree(footstep.position, { width: 2, height: 2 }).free).toBe(
          true
        )
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
    expect(result.value.trailNetwork.geometry.trunkWaypoints.length).toBeGreaterThan(50)
    expect(
      result.value.trailNetwork.geometry.trunkWaypoints.some(
        (point) => Math.abs(point.col - levels['1'].playerSpawn.col) > 20
      )
    ).toBe(true)
    const waypoints = result.value.trailNetwork.geometry.trunkWaypoints
    expect(
      Math.max(
        ...waypoints
          .slice(1)
          .map((point, index) =>
            Math.hypot(point.row - waypoints[index].row, point.col - waypoints[index].col)
          )
      )
    ).toBeLessThanOrEqual(18 + 1e-10)
    expect(Math.max(...turnAngles(waypoints))).toBeLessThanOrEqual(18.01)
    const firstTrunkFootstep = result.value.generatedFootsteps.find(
      (descriptor) => descriptor.onBranchId === undefined
    )!
    const firstDistance = walkedDistanceToPoint(waypoints, firstTrunkFootstep.position)
    let redoubtClearanceDistance = 0
    while (
      overlapsRedoubt(
        result.value.trailNetwork.trunk.positionAt(redoubtClearanceDistance / pathLength(waypoints))
      )
    ) {
      redoubtClearanceDistance += 0.01
    }
    expect(firstDistance - redoubtClearanceDistance).toBeGreaterThanOrEqual(4)
    expect(firstDistance - redoubtClearanceDistance).toBeLessThanOrEqual(6)
    expect(overlapsRedoubt(firstTrunkFootstep.position)).toBe(false)
    const followingTrunkFootsteps = result.value.generatedFootsteps
      .filter((descriptor) => descriptor.onBranchId === undefined)
      .slice(1, 4)
    followingTrunkFootsteps.forEach((descriptor) => {
      const intervalsFromFirst =
        (walkedDistanceToPoint(waypoints, descriptor.position) - firstDistance) /
        FOOTSTEP_INTERVAL_TILES
      expect(intervalsFromFirst).toBeCloseTo(Math.round(intervalsFromFirst), 6)
    })
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

  test('keeps generated footsteps out of stored arrays and materializes them only for runtime reads', () => {
    const state = getInitialState('1')
    expect(state.trailNetwork).not.toBeNull()
    expect(state.generatedFootsteps.length).toBeGreaterThan(0)
    expect(state.generatedFootsteps.some((descriptor) => descriptor.onBranchId !== undefined)).toBe(
      true
    )
    expect(
      state.nonCollisionObjects?.some((object) =>
        object.shortName.startsWith('generated-footsteps-')
      )
    ).toBe(false)
    expect(
      state.level.nonCollisionObjects?.some((object) =>
        object.shortName.startsWith('generated-footsteps-')
      )
    ).toBe(false)

    const runtimeObjects = getRuntimeNonCollisionObjects(state)
    const generatedObjects = runtimeObjects.filter((object) =>
      object.shortName.startsWith('generated-footsteps-')
    )
    expect(generatedObjects).toHaveLength(state.generatedFootsteps.length)
    expect(generatedObjects.every((object) => object.canTap === true)).toBe(true)
    expect(generatedObjects[0].position).toEqual(state.generatedFootsteps[0].position)
    expect(generatedObjects[0].rotation).toBe(state.generatedFootsteps[0].rotationDegrees)
    expect(generatedObjects[0].image).toBe(
      getNonCollisionTemplate(`generated-footsteps-${state.generatedFootsteps[0].variant}`)?.image
    )
    const tappableGeneratedFootstep = generatedObjects.find((object) => {
      const hit = getObjectAtPoint(object.position.row, object.position.col, {
        ...state,
        nonCollisionObjects: runtimeObjects,
      })
      return hit?.type === 'nonCollisionObject' && hit.data.id === object.id
    })
    expect(tappableGeneratedFootstep).toBeDefined()
    expect(tappableGeneratedFootstep).toEqual(
      expect.objectContaining({
        name: "Persius' Trail",
        description: 'A fresh trail of footprints winds onward through the Night Land.',
      })
    )
    const spatialGrid = buildSpatialGrid(state)
    expect(
      spatialGrid
        .getNearby(state.generatedFootsteps[0].position, 1)
        .some((entry) => entry.data.shortName.startsWith('generated-footsteps-'))
    ).toBe(false)
    const snapshot = toSnapshot(state) as unknown as Record<string, unknown>
    expect(snapshot).not.toHaveProperty('trailNetwork')
    expect(snapshot).toHaveProperty('trailNetworkGeometry')
    expect(snapshot).toHaveProperty('generatedFootsteps')
  })

  test('materializes all three variants with distinct matching assets', () => {
    const variants = ['green', 'blue', 'red'] as const
    const objects = generatedFootstepsToNonCollisionObjects(
      variants.map((variant, index) => ({
        position: { row: index, col: index + 1 },
        rotationDegrees: index * 30,
        variant,
      }))
    )

    expect(objects.map((object) => object.shortName)).toEqual(
      variants.map((variant) => `generated-footsteps-${variant}`)
    )
    objects.forEach((object, index) => {
      expect(object.image).toBe(
        getNonCollisionTemplate(`generated-footsteps-${variants[index]}`)?.image
      )
      expect(object.canTap).toBe(true)
      expect(object.rotation).toBe(index * 30)
    })
    expect(new Set(objects.map((object) => object.image)).size).toBe(3)
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

  test('persists and rehydrates identical trail geometry, resolution, and footsteps', () => {
    const state = getInitialState('1')
    const snapshot = toSnapshot(state)
    const geometryBytes = JSON.stringify(state.trailNetwork!.geometry)
    expect(JSON.stringify(snapshot.trailNetworkGeometry)).toBe(geometryBytes)

    const generateSpy = jest.spyOn(trailGeometry, 'generateTrailNetwork')
    const restored = fromSnapshot(snapshot)

    expect(generateSpy).not.toHaveBeenCalled()
    generateSpy.mockRestore()
    expect(JSON.stringify(restored.trailNetwork!.geometry)).toBe(geometryBytes)
    const locations = [
      { type: 'trunk' as const, progressPct: 0 },
      { type: 'trunk' as const, progressPct: 0.25 },
      { type: 'trunk' as const, progressPct: 0.73 },
      { type: 'trunk' as const, progressPct: 1 },
      ...state.trailNetwork!.branches.flatMap((branch) => [
        { type: 'branch' as const, branchId: branch.branchId, branchProgressPct: 0 },
        { type: 'branch' as const, branchId: branch.branchId, branchProgressPct: 0.5 },
        { type: 'branch' as const, branchId: branch.branchId, branchProgressPct: 1 },
      ]),
    ]
    locations.forEach((location) => {
      expect(restored.trailNetwork!.resolve(location)).toEqual(
        state.trailNetwork!.resolve(location)
      )
    })
    expect(restored.generatedFootsteps).toEqual(state.generatedFootsteps)
    expect(generatedFootstepsToNonCollisionObjects(restored.generatedFootsteps)).toEqual(
      generatedFootstepsToNonCollisionObjects(state.generatedFootsteps)
    )
  })

  test('rejects pre-persistence snapshots without trail geometry or footsteps', () => {
    const snapshot = toSnapshot(getInitialState('1'))
    const {
      trailNetworkGeometry: _trailNetworkGeometry,
      generatedFootsteps: _generatedFootsteps,
      ...oldSnapshot
    } = snapshot

    expect(() => fromSnapshot(oldSnapshot as typeof snapshot)).toThrow(
      IncompatibleGameboardSaveError
    )
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

import type { Level, Position } from '@config/types'
import { BoardOccupancyRegistry, RandomSource } from '../gameboardLayout'
import {
  buildTraversalObstacles,
  createTrailNetwork,
  generateTrailNetwork,
  HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT,
  TRAIL_LENGTH_RATIO,
  type TrailNetworkGeometry,
  type TraversalObstacle,
} from '../trailGeometry'

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function pathLength(path: readonly Position[]): number {
  return path.slice(1).reduce((sum, point, index) => sum + distance(path[index], point), 0)
}

function distance(a: Position, b: Position): number {
  return Math.hypot(a.row - b.row, a.col - b.col)
}

function orientation(a: Position, b: Position, c: Position): number {
  return (b.col - a.col) * (c.row - a.row) - (b.row - a.row) * (c.col - a.col)
}

function onSegment(a: Position, b: Position, point: Position): boolean {
  return (
    point.row >= Math.min(a.row, b.row) - 1e-7 &&
    point.row <= Math.max(a.row, b.row) + 1e-7 &&
    point.col >= Math.min(a.col, b.col) - 1e-7 &&
    point.col <= Math.max(a.col, b.col) + 1e-7
  )
}

function segmentsIntersect(a: Position, b: Position, c: Position, d: Position): boolean {
  const abC = orientation(a, b, c)
  const abD = orientation(a, b, d)
  const cdA = orientation(c, d, a)
  const cdB = orientation(c, d, b)
  if (abC * abD < -1e-7 && cdA * cdB < -1e-7) return true
  return (
    (Math.abs(abC) <= 1e-7 && onSegment(a, b, c)) ||
    (Math.abs(abD) <= 1e-7 && onSegment(a, b, d)) ||
    (Math.abs(cdA) <= 1e-7 && onSegment(c, d, a)) ||
    (Math.abs(cdB) <= 1e-7 && onSegment(c, d, b))
  )
}

function pathSelfIntersects(path: readonly Position[]): boolean {
  for (let first = 0; first < path.length - 1; first += 1) {
    for (let second = first + 2; second < path.length - 1; second += 1) {
      if (segmentsIntersect(path[first], path[first + 1], path[second], path[second + 1])) {
        return true
      }
    }
  }
  return false
}

function segmentCrossesObstacle(a: Position, b: Position, obstacle: TraversalObstacle): boolean {
  const minRow = obstacle.position.row
  const minCol = obstacle.position.col
  const maxRow = minRow + obstacle.height
  const maxCol = minCol + obstacle.width
  const inside = (point: Position) =>
    point.row >= minRow && point.row <= maxRow && point.col >= minCol && point.col <= maxCol
  if (inside(a) || inside(b)) return true
  const corners = [
    { row: minRow, col: minCol },
    { row: minRow, col: maxCol },
    { row: maxRow, col: maxCol },
    { row: maxRow, col: minCol },
  ]
  return corners.some((corner, index) =>
    segmentsIntersect(a, b, corner, corners[(index + 1) % corners.length])
  )
}

function intersectionsBetween(a: readonly Position[], b: readonly Position[]): Position[] {
  const intersections: Position[] = []
  for (let first = 0; first < a.length - 1; first += 1) {
    for (let second = 0; second < b.length - 1; second += 1) {
      if (segmentsIntersect(a[first], a[first + 1], b[second], b[second + 1])) {
        intersections.push(a[first])
      }
    }
  }
  return intersections
}

const BOARD = { width: 600, height: 600, obstacles: [] }
const START = { row: 580, col: 300 }

describe('standalone trail geometry', () => {
  test('buildTraversalObstacles uses real building, river-mask, and Great Power shapes only', () => {
    const level = {
      id: 'fixture',
      name: 'fixture',
      boardSize: { width: 100, height: 80 },
      playerSpawn: { row: 70, col: 50 },
      items: [],
      objects: [
        {
          id: 'building',
          shortName: 'building',
          category: 'building',
          name: 'Building',
          position: { row: 20, col: 30 },
          size: { width: 5, height: 7 },
        },
      ],
      nonCollisionObjects: [
        {
          id: 'river',
          shortName: 'river',
          category: 'decoration',
          name: 'River',
          position: { row: 5, col: 6 },
          rotation: 0,
          width: 50,
          height: 50,
          image: 1,
          zIndex: 1,
          type: 'river',
          canTap: false,
          active: true,
          collisionMask: [{ row: 2, col: 3, width: 4, height: 5 }],
        },
        {
          id: 'blue-step',
          shortName: 'footsteps',
          category: 'decoration',
          name: 'Footstep',
          position: { row: 10, col: 10 },
          rotation: 0,
          width: 2,
          height: 2,
          image: 1,
          zIndex: 1,
          type: 'footstep',
          canTap: false,
          active: true,
        },
        {
          id: 'generated-step',
          shortName: 'generated-footsteps',
          category: 'decoration',
          name: 'Generated Footstep',
          position: { row: 12, col: 12 },
          rotation: 0,
          width: 2,
          height: 2,
          image: 1,
          zIndex: 1,
          type: 'footstep',
          canTap: false,
          active: true,
        },
      ],
      greatPowers: [
        {
          id: 'watcher',
          templateId: 'watcher',
          kind: 'greatPower',
          shortName: 'watcher',
          category: 'greatPower',
          name: 'Watcher',
          position: { row: 40, col: 50 },
          currentHP: 10,
          maxHP: 10,
          attack: 1,
          ac: 1,
          width: 6,
          height: 8,
        },
      ],
    } satisfies Level

    expect(buildTraversalObstacles(level)).toEqual({
      width: 100,
      height: 80,
      obstacles: [
        { id: 'building', position: { row: 20, col: 30 }, width: 5, height: 7 },
        { id: 'river-mask-0', position: { row: 7, col: 9 }, width: 4, height: 5 },
        { id: 'watcher', position: { row: 40, col: 50 }, width: 6, height: 8 },
      ],
    })
  })

  test('generates a long, clear, non-self-intersecting trunk and exactly the requested branches', () => {
    const obstacle = { id: 'fixture-rock', position: { row: 250, col: 20 }, width: 8, height: 8 }
    const result = generateTrailNetwork(
      { ...BOARD, obstacles: [obstacle] },
      new BoardOccupancyRegistry(),
      new RandomSource(seededRandom(37)),
      3,
      START
    )
    expect(result.success).toBe(true)
    if (!result.success) return
    const { geometry, branches } = result.value
    expect(branches).toHaveLength(3)
    expect(geometry.branches).toHaveLength(3)
    const end = geometry.trunkWaypoints.at(-1)!
    expect(end.row).toBe(0)
    expect(pathLength(geometry.trunkWaypoints)).toBeGreaterThanOrEqual(
      distance(START, end) * TRAIL_LENGTH_RATIO
    )
    expect(pathSelfIntersects(geometry.trunkWaypoints)).toBe(false)
    for (let index = 0; index < geometry.trunkWaypoints.length - 1; index += 1) {
      expect(
        segmentCrossesObstacle(
          geometry.trunkWaypoints[index],
          geometry.trunkWaypoints[index + 1],
          obstacle
        )
      ).toBe(false)
    }

    geometry.branches.forEach((branch, branchIndex) => {
      expect(pathSelfIntersects(branch.waypoints)).toBe(false)
      expect(pathLength(branch.waypoints)).toBeGreaterThanOrEqual(
        pathLength(geometry.trunkWaypoints) * 0.1
      )
      expect(pathLength(branch.waypoints)).toBeLessThanOrEqual(
        pathLength(geometry.trunkWaypoints) * 0.2
      )
      for (let index = 0; index < branch.waypoints.length - 1; index += 1) {
        expect(
          segmentCrossesObstacle(branch.waypoints[index], branch.waypoints[index + 1], obstacle)
        ).toBe(false)
      }
      const trunkIntersections = intersectionsBetween(branch.waypoints, geometry.trunkWaypoints)
      expect(trunkIntersections).toHaveLength(1)
      geometry.branches.slice(branchIndex + 1).forEach((other) => {
        expect(intersectionsBetween(branch.waypoints, other.waypoints)).toHaveLength(0)
      })
    })
  })

  test('distanceBetween is Euclidean for every location pairing', () => {
    const geometry: TrailNetworkGeometry = {
      trunkWaypoints: [
        { row: 0, col: 0 },
        { row: 0, col: 10 },
      ],
      branches: [
        {
          branchId: 'a',
          originTrunkPct: 0.5,
          waypoints: [
            { row: 0, col: 5 },
            { row: 12, col: 5 },
          ],
        },
        {
          branchId: 'b',
          originTrunkPct: 0.8,
          waypoints: [
            { row: 0, col: 8 },
            { row: 0, col: 13 },
          ],
        },
      ],
    }
    const network = createTrailNetwork(geometry)
    expect(
      network.distanceBetween({ type: 'trunk', progressPct: 0 }, { type: 'trunk', progressPct: 1 })
    ).toBe(10)
    expect(
      network.distanceBetween(
        { type: 'trunk', progressPct: 0 },
        { type: 'branch', branchId: 'a', branchProgressPct: 1 }
      )
    ).toBe(13)
    expect(
      network.distanceBetween(
        { type: 'branch', branchId: 'a', branchProgressPct: 1 },
        { type: 'branch', branchId: 'b', branchProgressPct: 1 }
      )
    ).toBeCloseTo(Math.sqrt(208), 12)
  })

  test('rejects a blocked preferred corner and selects another cleared top-edge endpoint', () => {
    const occupancy = new BoardOccupancyRegistry([
      {
        id: 'blocked-left',
        position: { row: 0, col: 0 },
        ...HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT,
      },
    ])
    const result = generateTrailNetwork(BOARD, occupancy, new RandomSource(() => 0.25), 0, START)
    expect(result.success).toBe(true)
    if (!result.success) return
    const end = result.value.geometry.trunkWaypoints.at(-1)!
    expect(end).not.toEqual({ row: 0, col: 0 })
    expect(occupancy.isFree(end, HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT).free).toBe(true)
  })

  test('falls back to a straight trunk with zero branches when normal generation is impossible', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const result = generateTrailNetwork(
      {
        ...BOARD,
        obstacles: [{ id: 'everything', position: { row: 0, col: 0 }, width: 600, height: 600 }],
      },
      new BoardOccupancyRegistry(),
      new RandomSource(seededRandom(4)),
      2,
      START
    )
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.value.geometry.trunkWaypoints).toHaveLength(2)
    expect(result.value.geometry.branches).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('straight-line fallback'))
    warn.mockRestore()
  })

  test('branchCount zero is a valid generated trunk-only network', () => {
    const result = generateTrailNetwork(
      BOARD,
      new BoardOccupancyRegistry(),
      new RandomSource(seededRandom(91)),
      0,
      START
    )
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.value.geometry.trunkWaypoints.length).toBeGreaterThan(2)
    expect(result.value.branches).toEqual([])
    expect(result.value.geometry.branches).toEqual([])
  })
})

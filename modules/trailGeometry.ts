import type { Level, Position, ValidationResult } from '@config/types'
import type { BoardOccupancyRegistry, PathPositionResolver, RandomSource } from './gameboardLayout'

export type TrailLocation =
  | { type: 'trunk'; progressPct: number }
  | { type: 'branch'; branchId: string; branchProgressPct: number }

export interface TrailNetworkGeometry {
  trunkWaypoints: Position[]
  branches: { branchId: string; originTrunkPct: number; waypoints: Position[] }[]
}

export interface FootstepDescriptor {
  position: Position
  rotationDegrees: number
  onBranchId?: string
}

export interface TrailBranch {
  branchId: string
  originTrunkPct: number
  length: number
}

export interface TrailNetwork {
  trunk: PathPositionResolver
  branches: TrailBranch[]
  resolve(location: TrailLocation): Position
  distanceBetween(a: TrailLocation, b: TrailLocation): number
  geometry: TrailNetworkGeometry
}

export interface TraversalObstacle {
  id: string
  position: Position
  width: number
  height: number
}

export interface TraversalObstacles {
  width: number
  height: number
  obstacles: TraversalObstacle[]
}

export const HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT = { width: 8, height: 8 } as const
export const TRAIL_LENGTH_RATIO = 3
export const MAX_LOCAL_REROUTE_ATTEMPTS = 20
export const MAX_FULL_REGENERATION_ATTEMPTS = 200
export const MIN_BRANCH_SPACING_PCT = 0.08
export const FOOTSTEP_INTERVAL_TILES = 24

const EPSILON = 1e-7
const TRUNK_STEP = 12
const MAX_TRUNK_TURN_RADIANS = (18 * Math.PI) / 180
const TRUNK_EDGE_MARGIN = 120
const BRANCH_STEP = 12
export const MAX_BRANCH_LENGTH_TILES = 6 * FOOTSTEP_INTERVAL_TILES
const ENDPOINT_NUDGE_STEP = 8

interface Segment {
  start: Position
  end: Position
}

interface PathMetrics {
  cumulative: number[]
  length: number
}

/** Builds the geometry-only obstacle view used by standalone trail generation. */
export function buildTraversalObstacles(level: Level): TraversalObstacles {
  const obstacles: TraversalObstacle[] = []

  level.objects.forEach((object) => {
    if (!object.position) return
    obstacles.push({
      id: object.id,
      position: { ...object.position },
      width: object.size?.width ?? object.width ?? 1,
      height: object.size?.height ?? object.height ?? 1,
    })
  })

  level.nonCollisionObjects?.forEach((object) => {
    // The river-only gate structurally excludes both authored footsteps and decorations.
    if (object.type !== 'river' || object.shortName === 'generated-footsteps') {
      return
    }
    if (object.collisionMask?.length) {
      object.collisionMask.forEach((segment, index) => {
        obstacles.push({
          id: `${object.id}-mask-${index}`,
          position: {
            row: object.position.row + segment.row,
            col: object.position.col + segment.col,
          },
          width: segment.width ?? 1,
          height: segment.height ?? 1,
        })
      })
      return
    }
    obstacles.push({
      id: object.id,
      position: { ...object.position },
      width: object.width || 1,
      height: object.height || 1,
    })
  })

  level.greatPowers?.forEach((greatPower) => {
    obstacles.push({
      id: greatPower.id,
      position: { ...greatPower.position },
      width: greatPower.width ?? 1,
      height: greatPower.height ?? 1,
    })
  })

  return { width: level.boardSize.width, height: level.boardSize.height, obstacles }
}

/**
 * Generates persisted trail geometry without reading or changing game state.
 * The start is deliberately supplied by the caller; Stage 3 will wire in the real spawn.
 */
export function generateTrailNetwork(
  obstacles: TraversalObstacles,
  occupancy: BoardOccupancyRegistry,
  random: RandomSource,
  branchCount: number,
  start: Position
): ValidationResult<TrailNetwork> {
  if (!Number.isInteger(branchCount) || branchCount < 0) {
    return failure(
      'invalid-branch-count',
      'branchCount',
      'branchCount must be a non-negative integer'
    )
  }
  if (!pointInBounds(start, obstacles)) {
    return failure('invalid-trail-start', 'start', 'Trail start must be inside board bounds')
  }

  const endpoints = endpointCandidates(obstacles, occupancy, random)
  if (endpoints.length === 0) {
    return failure(
      'trail-endpoint-unavailable',
      'trail.end',
      'No top-edge position has clearance for the House of Silence placeholder'
    )
  }

  let completedTrunkAttempts = 0
  for (let attempt = 0; attempt < MAX_FULL_REGENERATION_ATTEMPTS; attempt += 1) {
    const end = endpoints[attempt % endpoints.length]
    const trunk = generateTrunk(start, end, obstacles, random)
    if (!trunk) continue
    completedTrunkAttempts += 1
    const branches = generateBranches(trunk, branchCount, obstacles, random)
    if (!branches) continue
    return { success: true, value: createTrailNetwork({ trunkWaypoints: trunk, branches }) }
  }

  const fallbackEnd = endpoints[0]
  console.warn(
    `[trail-geometry] Generation retries exhausted (${completedTrunkAttempts} completed trunks); using obstacle-exempt straight-line fallback with zero branches.`
  )
  return {
    success: true,
    value: createTrailNetwork({ trunkWaypoints: [{ ...start }, { ...fallbackEnd }], branches: [] }),
  }
}

export function createTrailNetwork(geometry: TrailNetworkGeometry): TrailNetwork {
  const copiedGeometry: TrailNetworkGeometry = {
    trunkWaypoints: geometry.trunkWaypoints.map(copyPosition),
    branches: geometry.branches.map((branch) => ({
      branchId: branch.branchId,
      originTrunkPct: branch.originTrunkPct,
      waypoints: branch.waypoints.map(copyPosition),
    })),
  }
  const trunk = new PolylinePathPositionResolver(copiedGeometry.trunkWaypoints)
  const branchResolvers = new Map(
    copiedGeometry.branches.map((branch) => [
      branch.branchId,
      new PolylinePathPositionResolver(branch.waypoints),
    ])
  )
  const branches: TrailBranch[] = copiedGeometry.branches.map((branch) => ({
    branchId: branch.branchId,
    originTrunkPct: branch.originTrunkPct,
    length: branchResolvers.get(branch.branchId)!.length,
  }))

  const resolve = (location: TrailLocation): Position => {
    if (location.type === 'trunk') return trunk.positionAt(location.progressPct)
    const branch = branchResolvers.get(location.branchId)
    if (!branch) throw new Error(`Unknown trail branch '${location.branchId}'`)
    return branch.positionAt(location.branchProgressPct)
  }

  return {
    trunk,
    branches,
    resolve,
    distanceBetween(a, b) {
      const aPosition = resolve(a)
      const bPosition = resolve(b)
      return distance(aPosition, bPosition)
    },
    geometry: copiedGeometry,
  }
}

export function generateFootstepDescriptors(
  trailNetwork: TrailNetwork,
  interval: number = FOOTSTEP_INTERVAL_TILES
): FootstepDescriptor[] {
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('Footstep interval must be a positive finite distance')
  }
  return [
    ...footstepsAlongPath(trailNetwork.geometry.trunkWaypoints, interval),
    ...trailNetwork.geometry.branches.flatMap((branch) =>
      footstepsAlongPath(branch.waypoints, interval, branch.branchId)
    ),
  ]
}

function footstepsAlongPath(
  waypoints: readonly Position[],
  interval: number,
  onBranchId?: string
): FootstepDescriptor[] {
  const metrics = pathMetrics(waypoints)
  const descriptors: FootstepDescriptor[] = []
  let segmentIndex = 1
  for (let walked = 0; walked <= metrics.length + EPSILON; walked += interval) {
    while (
      segmentIndex < metrics.cumulative.length - 1 &&
      metrics.cumulative[segmentIndex] <= walked
    ) {
      segmentIndex += 1
    }
    const segmentStart = waypoints[segmentIndex - 1]
    const segmentEnd = waypoints[segmentIndex]
    const segmentStartDistance = metrics.cumulative[segmentIndex - 1]
    const segmentLength = metrics.cumulative[segmentIndex] - segmentStartDistance
    const progress = segmentLength <= EPSILON ? 0 : (walked - segmentStartDistance) / segmentLength
    const deltaRow = segmentEnd.row - segmentStart.row
    const deltaCol = segmentEnd.col - segmentStart.col
    const rotationDegrees = (Math.atan2(deltaCol, -deltaRow) * 180) / Math.PI
    descriptors.push({
      position: interpolate(segmentStart, segmentEnd, progress),
      rotationDegrees: (rotationDegrees + 360) % 360,
      ...(onBranchId ? { onBranchId } : {}),
    })
  }
  return descriptors
}

export class PolylinePathPositionResolver implements PathPositionResolver {
  private readonly metrics: PathMetrics

  constructor(private readonly waypoints: readonly Position[]) {
    if (waypoints.length < 2) throw new Error('A trail path requires at least two waypoints')
    this.metrics = pathMetrics(waypoints)
  }

  get length(): number {
    return this.metrics.length
  }

  positionAt(progressPct: number): Position {
    const progress = clamp(progressPct, 0, 1)
    const target = progress * this.metrics.length
    let index = 1
    while (index < this.metrics.cumulative.length - 1 && this.metrics.cumulative[index] < target) {
      index += 1
    }
    const previousDistance = this.metrics.cumulative[index - 1]
    const segmentLength = this.metrics.cumulative[index] - previousDistance
    const segmentProgress =
      segmentLength <= EPSILON ? 0 : (target - previousDistance) / segmentLength
    return interpolate(this.waypoints[index - 1], this.waypoints[index], segmentProgress)
  }

  distanceBetween(aPct: number, bPct: number): number {
    return distance(this.positionAt(aPct), this.positionAt(bPct))
  }
}

function endpointCandidates(
  obstacles: TraversalObstacles,
  occupancy: BoardOccupancyRegistry,
  random: RandomSource
): Position[] {
  const maxCol = obstacles.width - HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT.width
  const maxRow = obstacles.height - HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT.height
  if (maxCol < 0 || maxRow < 0) return []
  const leftFirst = random.next() < 0.5
  const corners = leftFirst ? [0, maxCol] : [maxCol, 0]
  const columns: number[] = []
  for (const corner of corners) {
    for (let offset = 0; offset <= maxCol; offset += ENDPOINT_NUDGE_STEP) {
      const col = corner === 0 ? offset : maxCol - offset
      if (!columns.some((candidate) => Math.abs(candidate - col) <= EPSILON)) columns.push(col)
    }
  }
  return columns
    .map((col) => ({ row: 0, col }))
    .filter((position) => occupancy.isFree(position, HOUSE_OF_SILENCE_PLACEHOLDER_FOOTPRINT).free)
}

function generateTrunk(
  start: Position,
  end: Position,
  obstacles: TraversalObstacles,
  random: RandomSource
): Position[] | undefined {
  const directDistance = distance(start, end)
  const targetLength = directDistance * TRAIL_LENGTH_RATIO
  const waypoints: Position[] = [copyPosition(start)]
  let lateralSign = initialLateralSign(start, obstacles, random)
  let heading = wanderingHeading(start, start, lateralSign)
  let reversalTurnDirection = 0
  const maxSteps = Math.ceil(targetLength / TRUNK_STEP) * 5

  for (let stepIndex = 0; stepIndex < maxSteps; stepIndex += 1) {
    const current = waypoints[waypoints.length - 1]
    const walked = pathMetrics(waypoints).length
    const toEnd = distance(current, end)
    const approachingEnd = walked + toEnd >= targetLength
    const endHeading = headingToward(current, end)
    if (approachingEnd) reversalTurnDirection = 0

    if (
      approachingEnd &&
      toEnd <= TRUNK_STEP &&
      Math.abs(angleDifference(heading, endHeading)) <= MAX_TRUNK_TURN_RADIANS
    ) {
      if (!canAddSegment(waypoints, end, obstacles)) return undefined
      waypoints.push(copyPosition(end))
      return pathMetrics(waypoints).length + EPSILON >= targetLength ? waypoints : undefined
    }

    if (!approachingEnd) {
      const reachedLateralEdge =
        (lateralSign < 0 && current.col <= TRUNK_EDGE_MARGIN) ||
        (lateralSign > 0 && current.col >= obstacles.width - TRUNK_EDGE_MARGIN)
      if (reachedLateralEdge) {
        lateralSign *= -1
        reversalTurnDirection = lateralSign
      }
    }

    const desiredHeading = approachingEnd
      ? endHeading
      : wanderingHeading(current, start, lateralSign)
    let accepted = false
    for (let localAttempt = 0; localAttempt < MAX_LOCAL_REROUTE_ATTEMPTS; localAttempt += 1) {
      const desiredTurn = clamp(
        angleDifference(heading, desiredHeading),
        -MAX_TRUNK_TURN_RADIANS,
        MAX_TRUNK_TURN_RADIANS
      )
      const jitter =
        start.row - current.row < TRUNK_EDGE_MARGIN
          ? 0
          : ((random.next() - 0.5) * (72 * Math.PI)) / 180
      const completingReversal =
        reversalTurnDirection !== 0 &&
        Math.abs(angleDifference(heading, desiredHeading)) <= MAX_TRUNK_TURN_RADIANS
      const turn =
        reversalTurnDirection === 0
          ? clamp(desiredTurn + jitter, -MAX_TRUNK_TURN_RADIANS, MAX_TRUNK_TURN_RADIANS)
          : completingReversal
            ? angleDifference(heading, desiredHeading)
            : reversalTurnDirection * MAX_TRUNK_TURN_RADIANS
      const candidateHeading = normalizeAngle(heading + turn)
      const rerouteScale = 1 - (localAttempt / (MAX_LOCAL_REROUTE_ATTEMPTS - 1)) * 0.75
      const stepLength = (approachingEnd ? Math.min(TRUNK_STEP, toEnd) : TRUNK_STEP) * rerouteScale
      const candidate = {
        row: current.row - Math.cos(candidateHeading) * stepLength,
        col: current.col + Math.sin(candidateHeading) * stepLength,
      }
      if (!pointInBounds(candidate, obstacles) || !canAddSegment(waypoints, candidate, obstacles))
        continue
      waypoints.push(candidate)
      heading = candidateHeading
      if (completingReversal) reversalTurnDirection = 0
      accepted = true
      break
    }
    if (!accepted) return undefined
  }
  return undefined
}

function wanderingHeading(current: Position, start: Position, lateralSign: number): number {
  const upwardRate = start.row - current.row < TRUNK_EDGE_MARGIN ? 0.45 : 0.02
  return lateralSign * Math.acos(upwardRate)
}

function initialLateralSign(
  start: Position,
  obstacles: TraversalObstacles,
  random: RandomSource
): number {
  const preferred = random.next() < 0.5 ? -1 : 1
  for (const sign of [preferred, -preferred]) {
    const heading = wanderingHeading(start, start, sign)
    const path = [start]
    let clear = true
    const probeSteps = Math.ceil(TRUNK_EDGE_MARGIN / TRUNK_STEP)
    for (let step = 0; step < probeSteps; step += 1) {
      const current = path[path.length - 1]
      const candidate = {
        row: current.row - Math.cos(heading) * TRUNK_STEP,
        col: current.col + Math.sin(heading) * TRUNK_STEP,
      }
      if (!pointInBounds(candidate, obstacles) || !canAddSegment(path, candidate, obstacles)) {
        clear = false
        break
      }
      path.push(candidate)
    }
    if (clear) return sign
  }
  return preferred
}

function generateBranches(
  trunk: Position[],
  branchCount: number,
  obstacles: TraversalObstacles,
  random: RandomSource
): TrailNetworkGeometry['branches'] | undefined {
  if (branchCount === 0) return []
  const trunkMetrics = pathMetrics(trunk)
  const directReference = distance(trunk[0], trunk[trunk.length - 1])
  const minimumOriginSpacing = directReference * MIN_BRANCH_SPACING_PCT
  const branches: TrailNetworkGeometry['branches'] = []

  for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
    let accepted: TrailNetworkGeometry['branches'][number] | undefined
    for (let attempt = 0; attempt < MAX_LOCAL_REROUTE_ATTEMPTS * 4; attempt += 1) {
      const originPct = 0.12 + random.next() * 0.76
      const originDistance = originPct * trunkMetrics.length
      if (
        branches.some(
          (branch) =>
            Math.abs(branch.originTrunkPct * trunkMetrics.length - originDistance) <
            minimumOriginSpacing
        )
      ) {
        continue
      }
      const origin = positionAtDistance(trunk, trunkMetrics, originDistance)
      const desiredLength = MAX_BRANCH_LENGTH_TILES * (0.65 + random.next() * 0.35)
      const waypoints = generateBranch(origin, desiredLength, trunk, branches, obstacles, random)
      if (!waypoints) continue
      accepted = { branchId: `branch-${branchIndex + 1}`, originTrunkPct: originPct, waypoints }
      break
    }
    if (!accepted) return undefined
    branches.push(accepted)
  }
  return branches
}

function generateBranch(
  origin: Position,
  desiredLength: number,
  trunk: Position[],
  existingBranches: TrailNetworkGeometry['branches'],
  obstacles: TraversalObstacles,
  random: RandomSource
): Position[] | undefined {
  const waypoints = [copyPosition(origin)]
  const trunkDirection = directionNearPoint(trunk, origin)
  const side = random.next() < 0.5 ? -1 : 1
  const base = { row: -trunkDirection.col * side, col: trunkDirection.row * side }

  while (pathMetrics(waypoints).length + EPSILON < desiredLength) {
    const current = waypoints[waypoints.length - 1]
    const remaining = desiredLength - pathMetrics(waypoints).length
    const step = Math.min(BRANCH_STEP, remaining)
    let accepted = false
    for (let attempt = 0; attempt < MAX_LOCAL_REROUTE_ATTEMPTS; attempt += 1) {
      const jitter = (random.next() - 0.5) * 0.9
      const direction = normalize({
        row: base.row + trunkDirection.row * jitter,
        col: base.col + trunkDirection.col * jitter,
      })
      const candidate = {
        row: current.row + direction.row * step,
        col: current.col + direction.col * step,
      }
      if (!pointInBounds(candidate, obstacles) || !canAddSegment(waypoints, candidate, obstacles))
        continue
      const candidateSegment = { start: current, end: candidate }
      const mayTouchOrigin = waypoints.length === 1
      if (pathIntersects(candidateSegment, trunk, mayTouchOrigin ? origin : undefined)) continue
      if (existingBranches.some((branch) => pathIntersects(candidateSegment, branch.waypoints)))
        continue
      waypoints.push(candidate)
      accepted = true
      break
    }
    if (!accepted) return undefined
  }
  return waypoints
}

function canAddSegment(
  path: Position[],
  candidate: Position,
  obstacles: TraversalObstacles
): boolean {
  const segment = { start: path[path.length - 1], end: candidate }
  if (
    obstacles.obstacles.some((obstacle) => {
      if (
        pointInsideObstacle(path[0], obstacle) &&
        pointInsideObstacle(segment.start, obstacle) &&
        distance(path[0], segment.start) <= TRUNK_EDGE_MARGIN
      ) {
        return false
      }
      return segmentIntersectsRectangle(segment, obstacle)
    })
  )
    return false
  for (let index = 0; index < path.length - 2; index += 1) {
    if (segmentsIntersect(segment, { start: path[index], end: path[index + 1] })) return false
  }
  return true
}

function pointInsideObstacle(point: Position, obstacle: TraversalObstacle): boolean {
  return (
    point.row >= obstacle.position.row &&
    point.row <= obstacle.position.row + obstacle.height &&
    point.col >= obstacle.position.col &&
    point.col <= obstacle.position.col + obstacle.width
  )
}

function pathIntersects(segment: Segment, path: Position[], allowedPoint?: Position): boolean {
  for (let index = 0; index < path.length - 1; index += 1) {
    const other = { start: path[index], end: path[index + 1] }
    if (!segmentsIntersect(segment, other)) continue
    if (allowedPoint && intersectionIsOnlySharedEndpoint(segment, other, allowedPoint)) continue
    return true
  }
  return false
}

function intersectionIsOnlySharedEndpoint(a: Segment, b: Segment, point: Position): boolean {
  const aHasPoint = samePosition(a.start, point) || samePosition(a.end, point)
  const bHasPoint = Math.abs(cross(b.start, b.end, point)) <= EPSILON && onSegment(b, point)
  if (!aHasPoint || !bHasPoint) return false
  return (
    Math.abs(cross(a.start, a.end, b.start)) > EPSILON ||
    Math.abs(cross(a.start, a.end, b.end)) > EPSILON
  )
}

function segmentIntersectsRectangle(segment: Segment, rectangle: TraversalObstacle): boolean {
  const minRow = rectangle.position.row
  const minCol = rectangle.position.col
  const maxRow = minRow + rectangle.height
  const maxCol = minCol + rectangle.width
  if (pointInRectangle(segment.start, minRow, minCol, maxRow, maxCol)) return true
  if (pointInRectangle(segment.end, minRow, minCol, maxRow, maxCol)) return true
  const corners = [
    { row: minRow, col: minCol },
    { row: minRow, col: maxCol },
    { row: maxRow, col: maxCol },
    { row: maxRow, col: minCol },
  ]
  return corners.some((corner, index) =>
    segmentsIntersect(segment, { start: corner, end: corners[(index + 1) % corners.length] })
  )
}

function segmentsIntersect(a: Segment, b: Segment): boolean {
  const d1 = cross(a.start, a.end, b.start)
  const d2 = cross(a.start, a.end, b.end)
  const d3 = cross(b.start, b.end, a.start)
  const d4 = cross(b.start, b.end, a.end)
  if (
    ((d1 > EPSILON && d2 < -EPSILON) || (d1 < -EPSILON && d2 > EPSILON)) &&
    ((d3 > EPSILON && d4 < -EPSILON) || (d3 < -EPSILON && d4 > EPSILON))
  )
    return true
  return (
    (Math.abs(d1) <= EPSILON && onSegment(a, b.start)) ||
    (Math.abs(d2) <= EPSILON && onSegment(a, b.end)) ||
    (Math.abs(d3) <= EPSILON && onSegment(b, a.start)) ||
    (Math.abs(d4) <= EPSILON && onSegment(b, a.end))
  )
}

function pathMetrics(waypoints: readonly Position[]): PathMetrics {
  const cumulative = [0]
  for (let index = 1; index < waypoints.length; index += 1) {
    cumulative.push(cumulative[index - 1] + distance(waypoints[index - 1], waypoints[index]))
  }
  return { cumulative, length: cumulative[cumulative.length - 1] }
}

function positionAtDistance(path: Position[], metrics: PathMetrics, target: number): Position {
  let index = 1
  while (index < metrics.cumulative.length - 1 && metrics.cumulative[index] < target) index += 1
  const before = metrics.cumulative[index - 1]
  const length = metrics.cumulative[index] - before
  return interpolate(
    path[index - 1],
    path[index],
    length <= EPSILON ? 0 : (target - before) / length
  )
}

function directionNearPoint(path: Position[], point: Position): Position {
  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY
  for (let index = 0; index < path.length - 1; index += 1) {
    const candidateDistance = distance(point, path[index]) + distance(point, path[index + 1])
    if (candidateDistance < closestDistance) {
      closestDistance = candidateDistance
      closestIndex = index
    }
  }
  return unitVector(path[closestIndex], path[closestIndex + 1])
}

function pointInBounds(point: Position, obstacles: TraversalObstacles): boolean {
  return (
    point.row >= 0 && point.col >= 0 && point.row < obstacles.height && point.col < obstacles.width
  )
}

function pointInRectangle(
  point: Position,
  minRow: number,
  minCol: number,
  maxRow: number,
  maxCol: number
): boolean {
  return point.row >= minRow && point.row <= maxRow && point.col >= minCol && point.col <= maxCol
}

function cross(a: Position, b: Position, c: Position): number {
  return (b.col - a.col) * (c.row - a.row) - (b.row - a.row) * (c.col - a.col)
}

function onSegment(segment: Segment, point: Position): boolean {
  return (
    point.row >= Math.min(segment.start.row, segment.end.row) - EPSILON &&
    point.row <= Math.max(segment.start.row, segment.end.row) + EPSILON &&
    point.col >= Math.min(segment.start.col, segment.end.col) - EPSILON &&
    point.col <= Math.max(segment.start.col, segment.end.col) + EPSILON
  )
}

function samePosition(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) <= EPSILON && Math.abs(a.col - b.col) <= EPSILON
}

function distance(a: Position, b: Position): number {
  return Math.hypot(a.row - b.row, a.col - b.col)
}

function unitVector(from: Position, to: Position): Position {
  return normalize({ row: to.row - from.row, col: to.col - from.col })
}

function headingToward(from: Position, to: Position): number {
  return Math.atan2(to.col - from.col, from.row - to.row)
}

function normalizeAngle(angle: number): number {
  let normalized = angle
  while (normalized <= -Math.PI) normalized += Math.PI * 2
  while (normalized > Math.PI) normalized -= Math.PI * 2
  return normalized
}

function angleDifference(from: number, to: number): number {
  return normalizeAngle(to - from)
}

function normalize(vector: Position): Position {
  const length = Math.hypot(vector.row, vector.col)
  return length <= EPSILON
    ? { row: -1, col: 0 }
    : { row: vector.row / length, col: vector.col / length }
}

function interpolate(a: Position, b: Position, amount: number): Position {
  return { row: a.row + (b.row - a.row) * amount, col: a.col + (b.col - a.col) * amount }
}

function copyPosition(position: Position): Position {
  return { row: position.row, col: position.col }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function failure<T>(code: string, path: string, message: string): ValidationResult<T> {
  return { success: false, errors: [{ code, path, message }] }
}

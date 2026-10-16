import type { GameState, Level, Position, TerrainRegion } from '@config/types'
import { boundaryForState, isBoundaryWalkable, canCrossMapBoundary } from './mapBoundary'

type World = Pick<GameState, 'gridWidth' | 'gridHeight' | 'level'>

export function terrainContains(region: TerrainRegion, p: Position): boolean {
  const row = p.row - region.position.row
  const col = p.col - region.position.col
  return region.shape.some(
    (s) => row >= s.row && row < s.row + s.height && col >= s.col && col < s.col + s.width
  )
}

/** Match the topmost visible terrain shape, excluding transparent image margins. */
export function getTerrainAtPoint(
  level: Pick<Level, 'terrainRegions'>,
  position: Position
): TerrainRegion | undefined {
  return [...(level.terrainRegions ?? [])]
    .reverse()
    .find((region) => terrainContains(region, position))
}

/** Adapter keeps authored river placement, rendering and save compatibility intact. */
export function effectRegions(
  state: Pick<GameState, 'level' | 'nonCollisionObjects'>
): TerrainRegion[] {
  return [
    ...(state.level.terrainRegions ?? []),
    ...(state.nonCollisionObjects ?? [])
      .filter((o) => o.type === 'river' && o.active)
      .map((o) => ({
        id: o.id,
        name: o.name,
        position: o.position,
        width: o.width,
        height: o.height,
        image: o.image,
        shape: (o.collisionMask ?? []).map((s) => ({
          ...s,
          width: s.width ?? 1,
          height: s.height ?? 1,
        })),
        blocksMovement: false,
        effects: o.collisionEffects,
        effectTiming: 'eachTurn' as const,
      })),
  ]
}

const blockedCache = new WeakMap<Level, Uint8Array>()
function blockedCells(world: World): Uint8Array {
  const existing = blockedCache.get(world.level)
  if (existing) return existing
  const cells = new Uint8Array(world.gridWidth * world.gridHeight)
  for (const region of world.level.terrainRegions ?? []) {
    if (!region.blocksMovement) continue
    for (const s of region.shape)
      for (let y = 0; y < s.height; y++)
        for (let x = 0; x < s.width; x++) {
          const row = region.position.row + s.row + y
          const col = region.position.col + s.col + x
          if (row >= 0 && col >= 0 && row < world.gridHeight && col < world.gridWidth)
            cells[row * world.gridWidth + col] = 1
        }
  }
  blockedCache.set(world.level, cells)
  return cells
}

export function isTerrainWalkable(world: World, p: Position, width = 1, height = 1): boolean {
  if (!isBoundaryWalkable(boundaryForState(world), p, width, height)) return false
  const blocked = blockedCells(world)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (blocked[(p.row + y) * world.gridWidth + p.col + x]) return false
    }
  return true
}

/** Check all crossed cells and both sides of diagonal joins, including actor footprint. */
export function canTraverseTerrain(
  world: World,
  from: Position,
  to: Position,
  width = 1,
  height = 1
): boolean {
  if (!canCrossMapBoundary(boundaryForState(world), from, to)) return false
  if (!isTerrainWalkable(world, to, width, height)) return false
  let row = Math.round(from.row),
    col = Math.round(from.col)
  const dx = Math.abs(to.col - col),
    dy = Math.abs(to.row - row)
  const sx = Math.sign(to.col - col),
    sy = Math.sign(to.row - row)
  let ix = 0,
    iy = 0
  while (ix < dx || iy < dy) {
    const d = (1 + 2 * ix) * dy - (1 + 2 * iy) * dx
    if (d === 0) {
      if (
        !isTerrainWalkable(world, { row, col: col + sx }, width, height) ||
        !isTerrainWalkable(world, { row: row + sy, col }, width, height)
      )
        return false
      col += sx
      row += sy
      ix++
      iy++
    } else if (d < 0) {
      col += sx
      ix++
    } else {
      row += sy
      iy++
    }
    if (!isTerrainWalkable(world, { row, col }, width, height)) return false
  }
  return true
}

/** Reverse breadth-first field shared by pursuing monsters with the same footprint. */
export function buildTerrainDistances(
  world: World,
  target: Position,
  width = 1,
  height = 1
): Int32Array {
  const distances = new Int32Array(world.gridWidth * world.gridHeight).fill(-1)
  const queue = new Int32Array(distances.length)
  if (!isTerrainWalkable(world, target, width, height)) return distances
  let head = 0,
    tail = 0
  const first = target.row * world.gridWidth + target.col
  queue[tail++] = first
  distances[first] = 0
  const boundary = boundaryForState(world)
  const blocked = blockedCells(world)
  // Precompute footprint clearance once, rather than rebuilding geometry per search edge.
  const clear = new Uint8Array(distances.length)
  for (let row = 0; row < world.gridHeight; row++)
    for (let col = 0; col < world.gridWidth; col++) {
      let valid = true
      for (let y = 0; y < height && valid; y++)
        for (let x = 0; x < width; x++) {
          const r = row + y,
            c = col + x,
            i = r * world.gridWidth + c
          if (
            r >= world.gridHeight ||
            c >= world.gridWidth ||
            !boundary.walkable[i] ||
            blocked[i]
          ) {
            valid = false
            break
          }
        }
      if (valid) clear[row * world.gridWidth + col] = 1
    }
  while (head < tail) {
    const i = queue[head++],
      row = Math.floor(i / world.gridWidth),
      col = i % world.gridWidth
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const r = row + dy,
          c = col + dx,
          next = r * world.gridWidth + c
        if (
          r < 0 ||
          c < 0 ||
          r >= world.gridHeight ||
          c >= world.gridWidth ||
          !clear[next] ||
          distances[next] !== -1
        )
          continue
        if (dx && dy && (!clear[row * world.gridWidth + c] || !clear[r * world.gridWidth + col]))
          continue
        distances[next] = distances[i] + 1
        queue[tail++] = next
      }
  }
  return distances
}

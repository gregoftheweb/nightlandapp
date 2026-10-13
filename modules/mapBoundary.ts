import type { Position } from '@config/types'
import { NIGHT_LAND_OUTLINE } from '@config/mapBoundary'

type Boundary = { width: number; height: number; land: Uint8Array; walkable: Uint8Array }
const cache = new Map<string, Boundary>()

function insidePolygon(col: number, row: number): boolean {
  let inside = false
  for (let i = 0, j = NIGHT_LAND_OUTLINE.length - 1; i < NIGHT_LAND_OUTLINE.length; j = i++) {
    const a = NIGHT_LAND_OUTLINE[i]
    const b = NIGHT_LAND_OUTLINE[j]
    if (
      a.row > row !== b.row > row &&
      col < ((b.col - a.col) * (row - a.row)) / (b.row - a.row) + a.col
    )
      inside = !inside
  }
  return inside
}

/** Cached tile mask. Other levels retain their rectangular cliff ring. */
export function getMapBoundary(width: number, height: number, levelId = '1'): Boundary {
  const key = `${levelId}:${width}:${height}`
  const existing = cache.get(key)
  if (existing) return existing
  const land = new Uint8Array(width * height)
  const walkable = new Uint8Array(width * height)
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      land[row * width + col] =
        levelId !== '1' || insidePolygon((col + 0.5) / width, (row + 0.5) / height) ? 1 : 0
    }
  }
  for (let row = 1; row < height - 1; row++) {
    for (let col = 1; col < width - 1; col++) {
      // A solid one-cell rim, including diagonal joins, prevents corner gaps.
      let clear = true
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!land[(row + dy) * width + col + dx]) clear = false
        }
      }
      if (clear) walkable[row * width + col] = 1
    }
  }
  const boundary = { width, height, land, walkable }
  cache.set(key, boundary)
  return boundary
}

export function isBoundaryWalkable(
  boundary: Boundary,
  position: Position,
  width = 1,
  height = 1
): boolean {
  if (!Number.isInteger(position.row) || !Number.isInteger(position.col)) return false
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const row = position.row + dy
      const col = position.col + dx
      if (
        row < 0 ||
        col < 0 ||
        row >= boundary.height ||
        col >= boundary.width ||
        !boundary.walkable[row * boundary.width + col]
      )
        return false
    }
  }
  return true
}

/** Supercover traversal checks both sides of a diagonal crossing. */
export function canCrossMapBoundary(boundary: Boundary, from: Position, to: Position): boolean {
  if (![from.row, from.col, to.row, to.col].every(Number.isFinite)) return false
  let row = Math.round(from.row)
  let col = Math.round(from.col)
  const endRow = Math.round(to.row)
  const endCol = Math.round(to.col)
  if (!isBoundaryWalkable(boundary, { row: endRow, col: endCol })) return false
  const dx = Math.abs(endCol - col)
  const dy = Math.abs(endRow - row)
  const sx = Math.sign(endCol - col)
  const sy = Math.sign(endRow - row)
  let ix = 0
  let iy = 0
  while (ix < dx || iy < dy) {
    const decision = (1 + 2 * ix) * dy - (1 + 2 * iy) * dx
    if (decision === 0) {
      if (
        !isBoundaryWalkable(boundary, { row, col: col + sx }) ||
        !isBoundaryWalkable(boundary, { row: row + sy, col })
      )
        return false
      col += sx
      row += sy
      ix++
      iy++
    } else if (decision < 0) {
      col += sx
      ix++
    } else {
      row += sy
      iy++
    }
    if (!isBoundaryWalkable(boundary, { row, col })) return false
  }
  return true
}

export function boundaryForState(state: {
  gridWidth: number
  gridHeight: number
  level?: { id: string }
  currentLevelId?: string
}): Boundary {
  return getMapBoundary(
    state.gridWidth,
    state.gridHeight,
    state.level?.id ?? state.currentLevelId ?? '1'
  )
}

/** Atlas column/row and orientation for an edge tile; null means interior/exterior. */
export function cliffTileAt(
  boundary: Boundary,
  row: number,
  col: number
): { column: number; row: number; rotation: number } | null {
  const index = row * boundary.width + col
  if (!boundary.land[index] || boundary.walkable[index]) return null
  const clear = (r: number, c: number) =>
    r >= 0 &&
    c >= 0 &&
    r < boundary.height &&
    c < boundary.width &&
    !!boundary.land[r * boundary.width + c]
  const north = !clear(row - 1, col)
  const east = !clear(row, col + 1)
  const south = !clear(row + 1, col)
  const west = !clear(row, col - 1)
  if (north && west) return { column: 0, row: 1, rotation: 0 }
  if (north && east) return { column: 1, row: 1, rotation: 0 }
  if (south && east) return { column: 0, row: 1, rotation: 180 }
  if (south && west) return { column: 1, row: 1, rotation: 180 }
  if (north) return { column: 0, row: 0, rotation: 0 }
  if (east) return { column: 1, row: 0, rotation: 0 }
  if (south) return { column: 2, row: 0, rotation: 0 }
  if (west) return { column: 3, row: 0, rotation: 0 }
  if (!clear(row - 1, col - 1)) return { column: 2, row: 1, rotation: 0 }
  if (!clear(row - 1, col + 1)) return { column: 3, row: 1, rotation: 0 }
  if (!clear(row + 1, col + 1)) return { column: 2, row: 1, rotation: 180 }
  return { column: 3, row: 1, rotation: 180 }
}

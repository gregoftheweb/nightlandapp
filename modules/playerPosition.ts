import type { Position } from '@config/types'

/** Player state is tile-addressed even when its source geometry has sub-tile precision. */
export function toIntegerTilePosition(position: Position): Position {
  return {
    row: Math.round(position.row),
    col: Math.round(position.col),
  }
}

import type { Position } from './types'

/** Rough silhouette from Docs/assets/night-land-map-reference.png.
 * Coordinates are fractions of the board; north is decreasing row.
 * The southwest bay and southern tip preserve Phase 1's existing pool and spawn.
 */
export const NIGHT_LAND_OUTLINE: readonly Position[] = [
  { col: 0, row: 0 },
  { col: 0.16, row: 0.025 },
  { col: 0.28, row: 0.065 },
  { col: 0.43, row: 0.035 },
  { col: 0.56, row: 0 },
  { col: 0.76, row: 0 },
  { col: 0.88, row: 0.045 },
  { col: 0.94, row: 0.15 },
  { col: 0.965, row: 0.3 },
  { col: 0.99, row: 0.43 },
  { col: 0.97, row: 0.6 },
  { col: 0.92, row: 0.69 },
  { col: 0.94, row: 0.81 },
  { col: 0.89, row: 0.99 },
  { col: 0.73, row: 0.96 },
  { col: 0.64, row: 0.975 },
  { col: 0.57, row: 1 },
  { col: 0.46, row: 1 },
  { col: 0.34, row: 0.98 },
  { col: 0.025, row: 0.96 },
  { col: 0.025, row: 0.9 },
  { col: 0.12, row: 0.84 },
  { col: 0.07, row: 0.72 },
  { col: 0.045, row: 0.6 },
  { col: 0, row: 0.53 },
  { col: 0, row: 0.39 },
  { col: 0.04, row: 0.3 },
  { col: 0, row: 0.21 },
]

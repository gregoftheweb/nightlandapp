/** Level 1 anchors, expressed in grid cells (north is decreasing row). */
export const REDOUBT_POSITION = { row: 192, col: 192 } as const
export const PLAYER_START_POSITION = { row: 203, col: 200 } as const
export const NORTHERN_TRAIL_DESTINATION = { row: 56, col: 224 } as const
// Approximate reference-map anchors around the central Redoubt, north at the top.
// Coordinates mark the upper-left corner of each Watcher's 6×6 footprint.
export const WATCHER_POSITIONS = {
  watcher_nw: { row: 165, col: 157 },
  watcher_ne: { row: 161, col: 229 },
  watcher_sw: { row: 253, col: 137 },
  watcher_s: { row: 281, col: 203 },
  watcher_se: { row: 265, col: 255 },
} as const
// Roughly half the old full-board winding expedition (400 cells × ratio 3).
export const EXPEDITION_TRAIL_LENGTH = 600

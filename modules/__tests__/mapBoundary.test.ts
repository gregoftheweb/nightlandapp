import { levels } from '../../config/levels'
import { playerConfig } from '../../config/player'
import type { GameState } from '../../config/types'
import { calculateNewPosition } from '../movement'
import {
  boundaryForState,
  canCrossMapBoundary,
  cliffTileAt,
  getMapBoundary,
  isBoundaryWalkable,
} from '../mapBoundary'
import { reduceMovement } from '../../state/slices/movementSlice'
import { reduceJaunt } from '../../state/slices/jauntSlice'

const boundary = getMapBoundary(400, 400, '1')
function stateAt(row: number, col: number): GameState {
  return {
    level: levels['1'],
    currentLevelId: '1',
    gridWidth: 400,
    gridHeight: 400,
    player: {
      ...playerConfig,
      position: { row, col },
      jauntUnlocked: true,
      isJauntArmed: true,
      jauntCrystalCharges: 2,
    },
    inCombat: false,
    distanceTraveled: 0,
  } as GameState
}

describe('irregular Night Land cliffs', () => {
  test('the playable interior is connected and includes current spawn, items and pool access', () => {
    const start = levels['1'].playerSpawn
    expect(isBoundaryWalkable(boundary, start)).toBe(true)
    for (const item of levels['1'].items)
      expect(isBoundaryWalkable(boundary, item.position!)).toBe(true)
    expect(isBoundaryWalkable(boundary, { row: 375, col: 20 }, 4, 4)).toBe(true)
    const visited = new Set<number>([start.row * 400 + start.col])
    const queue = [start]
    for (let i = 0; i < queue.length; i++) {
      const pos = queue[i]
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const next = { row: pos.row + dr, col: pos.col + dc }
        const key = next.row * 400 + next.col
        if (!visited.has(key) && isBoundaryWalkable(boundary, next)) {
          visited.add(key)
          queue.push(next)
        }
      }
    }
    expect(visited.size).toBe(boundary.walkable.reduce((sum, cell) => sum + cell, 0))
  })

  test('every blocked land cell has a cliff sprite and all exterior cells are blocked', () => {
    const directions = new Set<number>()
    for (let row = 0; row < 400; row++) {
      for (let col = 0; col < 400; col++) {
        const index = row * 400 + col
        const tile = cliffTileAt(boundary, row, col)
        if (!boundary.land[index]) expect(boundary.walkable[index]).toBe(0)
        if (boundary.land[index] && !boundary.walkable[index]) {
          expect(tile).not.toBeNull()
          if (tile?.row === 0) directions.add(tile.column)
        } else expect(tile).toBeNull()
      }
    }
    expect(directions.size).toBe(4)
    expect(isBoundaryWalkable(boundary, { row: 20, col: 390 })).toBe(false)
    expect(isBoundaryWalkable(boundary, { row: 200, col: 200 })).toBe(true)
  })

  test('normal and held movement stop at the irregular eastern cliff; reducers cannot bypass it', () => {
    let state = stateAt(60, 300)
    for (let i = 0; i < 100; i++) {
      const position = calculateNewPosition(state.player.position, 'right', state)
      state = reduceMovement(state, { type: 'MOVE_PLAYER', payload: { position } })!
    }
    expect(state.player.position.col).toBeLessThan(398)
    expect(isBoundaryWalkable(boundaryForState(state), state.player.position)).toBe(true)
    expect(calculateNewPosition(state.player.position, 'right', state)).toEqual(
      state.player.position
    )
    expect(reduceMovement(state, { type: 'MOVE_PLAYER', payload: { direction: 'right' } })).toBe(
      state
    )
    expect(
      reduceMovement(state, { type: 'MOVE_PLAYER', payload: { position: { row: 60, col: 399 } } })
    ).toBe(state)
  })

  test('Jaunt rejects exterior targets without consuming charges or creating flashes', () => {
    const state = stateAt(60, 300)
    const result = reduceJaunt(state, {
      type: 'EXECUTE_JAUNT',
      payload: { targetPosition: { row: 60, col: 399 } },
    })
    expect(result).toBe(state)
    expect(result?.player.jauntCrystalCharges).toBe(2)
  })

  test('multi-cell movement cannot cross an indentation even between valid endpoints', () => {
    // The northern notch lies between two valid pieces of land.
    const from = { row: 15, col: 30 }
    const to = { row: 15, col: 220 }
    expect(isBoundaryWalkable(boundary, from)).toBe(true)
    expect(isBoundaryWalkable(boundary, to)).toBe(true)
    expect(canCrossMapBoundary(boundary, from, to)).toBe(false)
    expect(canCrossMapBoundary(boundary, { row: 200, col: 200 }, { row: 210, col: 210 })).toBe(true)
  })

  test('larger footprints and non-finite coordinates cannot bypass the mask', () => {
    expect(isBoundaryWalkable(boundary, { row: 395, col: 200 }, 1, 10)).toBe(false)
    expect(canCrossMapBoundary(boundary, { row: 200, col: 200 }, { row: NaN, col: 200 })).toBe(
      false
    )
  })

  test('other levels retain a rectangular ring', () => {
    const other = getMapBoundary(600, 500, '2')
    expect(isBoundaryWalkable(other, { row: 490, col: 50 })).toBe(true)
    expect(isBoundaryWalkable(other, { row: 1, col: 1 })).toBe(true)
    expect(isBoundaryWalkable(other, { row: 0, col: 1 })).toBe(false)
  })
})

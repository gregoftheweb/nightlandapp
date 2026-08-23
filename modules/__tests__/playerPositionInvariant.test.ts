import { createInitialGameState, fromSnapshot, toSnapshot } from '../gameState'
import { reducer } from '../../state/reducer'

function expectIntegerPlayerPosition(state: ReturnType<typeof createInitialGameState>) {
  expect(Number.isInteger(state.player.position.row)).toBe(true)
  expect(Number.isInteger(state.player.position.col)).toBe(true)
}

describe('player integer-tile position invariant', () => {
  test('fresh spawn and level reset use integer tile coordinates', () => {
    const initial = createInitialGameState()
    expectIntegerPlayerPosition(initial)

    const changed = reducer(initial, { type: 'SET_LEVEL', levelId: '1' })
    expectIntegerPlayerPosition(changed)
  })

  test('MOVE_PLAYER rounds explicit positions and repairs fractional current positions', () => {
    const initial = createInitialGameState()
    const explicit = reducer(initial, {
      type: 'MOVE_PLAYER',
      payload: { position: { row: 262.6657385757874, col: 104.49 } },
    })
    expect(explicit.player.position).toEqual({ row: 263, col: 104 })

    const infected = {
      ...initial,
      player: { ...initial.player, position: { row: 50.6, col: 75.4 } },
    }
    const directional = reducer(infected, {
      type: 'MOVE_PLAYER',
      payload: { direction: 'right' },
    })
    expect(directional.player.position).toEqual({ row: 51, col: 76 })
  })

  test('EXECUTE_JAUNT rounds its target to an integer tile', () => {
    const initial = createInitialGameState()
    const armed = {
      ...initial,
      player: {
        ...initial.player,
        jauntUnlocked: true,
        jauntCrystalCharges: 1,
        isJauntArmed: true,
      },
    }
    const result = reducer(armed, {
      type: 'EXECUTE_JAUNT',
      payload: { targetPosition: { row: 120.51, col: 200.49 } },
    })
    expect(result.player.position).toEqual({ row: 121, col: 200 })
  })

  test('DEBUG_TELEPORT_PLAYER rounds a fractional EncounterPlacement position', () => {
    const initial = createInitialGameState()
    const fractionalPlacement = {
      ...initial.encounterPlacements[0],
      position: { row: 262.6657385757874, col: 181.51 },
    }
    const result = reducer(initial, {
      type: 'DEBUG_TELEPORT_PLAYER',
      payload: { targetPosition: fractionalPlacement.position },
    })
    expect(result.player.position).toEqual({ row: 263, col: 182 })
  })

  test('UPDATE_PLAYER and hydration round incoming positions', () => {
    const initial = createInitialGameState()
    const updated = reducer(initial, {
      type: 'UPDATE_PLAYER',
      payload: { updates: { position: { row: 9.6, col: 8.4 } } },
    })
    expect(updated.player.position).toEqual({ row: 10, col: 8 })

    const hydrated = reducer(initial, {
      type: 'HYDRATE_GAME_STATE',
      payload: {
        state: {
          ...initial,
          player: { ...initial.player, position: { row: 33.3, col: 44.8 } },
        },
      },
    })
    expect(hydrated.player.position).toEqual({ row: 33, col: 45 })
  })

  test('snapshot restoration repairs legacy fractional player coordinates', () => {
    const initial = createInitialGameState()
    const snapshot = toSnapshot(initial)
    snapshot.player.position = { row: 87.7, col: 91.2 }

    expect(fromSnapshot(snapshot).player.position).toEqual({ row: 88, col: 91 })
  })
})

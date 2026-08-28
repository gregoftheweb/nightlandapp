import { RandomSource } from '@modules/gameboardLayout'

import {
  applyCurrentLoomHazard,
  applyCurrentLoomTickDrain,
  createCurrentLoomPuzzle,
  isCurrentLoomSolved,
  tickCurrentLoom,
  type CurrentLoomPuzzleState,
} from '../puzzleState'

const state = (channels: CurrentLoomPuzzleState['channels'], tickCount = 0) => ({
  channels,
  tickCount,
})

describe('Current-Loom puzzle state', () => {
  it('alternates the middle-channel odd-unit donor deterministically', () => {
    expect(tickCurrentLoom(state([4, 6, 3, 6, 6]), 2).state.channels).toEqual([4, 5, 4, 6, 6])
    expect(tickCurrentLoom(state([4, 6, 3, 6, 6], 1), 2).state.channels).toEqual([4, 6, 4, 5, 6])
  })

  it('drains the sole neighbor for either end channel', () => {
    expect(tickCurrentLoom(state([4, 6, 4, 6, 5]), 0).state.channels).toEqual([5, 5, 4, 6, 5])
    expect(tickCurrentLoom(state([5, 6, 4, 6, 4]), 4).state.channels).toEqual([5, 6, 4, 5, 5])
  })

  it('recognizes only five equal channels as solved', () => {
    expect(isCurrentLoomSolved(state([5, 5, 5, 5, 5]))).toBe(true)
    expect(isCurrentLoomSolved(state([4, 6, 5, 5, 5]))).toBe(false)
  })

  it('preserves sum 25 after ordinary ticks and every boundary correction', () => {
    let puzzle = state([1, 9, 1, 9, 5])
    for (let index = 0; index < 100; index += 1) {
      const result = tickCurrentLoom(puzzle, index % 5)
      puzzle = result.state
      expect(puzzle.channels.reduce((sum, value) => sum + value, 0)).toBe(25)
      expect(puzzle.channels.every((value) => value >= 0 && value <= 10)).toBe(true)
    }
  })

  it('snaps a boundary-hit channel to five without cascading hazard checks', () => {
    const result = tickCurrentLoom(state([9, 4, 4, 4, 4]), 0)
    expect(result.hazardChannel).toBe(0)
    expect(result.state.channels[0]).toBe(5)
    expect(result.state.channels.reduce((sum, value) => sum + value, 0)).toBe(25)
  })

  it('generates fresh valid unsolved configurations with injectable randomness', () => {
    const first = createCurrentLoomPuzzle(new RandomSource(() => 0.1))
    const second = createCurrentLoomPuzzle(new RandomSource(() => 0.8))
    for (const puzzle of [first, second]) {
      expect(puzzle.channels.reduce((sum, value) => sum + value, 0)).toBe(25)
      expect(puzzle.channels.every((value) => value > 0 && value < 10)).toBe(true)
      expect(isCurrentLoomSolved(puzzle)).toBe(false)
    }
    expect(first.channels).not.toEqual(second.channels)
  })

  it('applies repeated hazard damage from the latest HP and dispatches lethal game over', () => {
    const dispatch = jest.fn()
    const navigate = jest.fn()
    let liveHP = 12

    liveHP = applyCurrentLoomHazard(liveHP, dispatch, navigate)
    liveHP = applyCurrentLoomHazard(liveHP, dispatch, navigate)
    liveHP = applyCurrentLoomHazard(liveHP, dispatch, navigate)

    expect(liveHP).toBe(0)
    expect(
      dispatch.mock.calls
        .map(([action]) => action)
        .filter((action) => action.type === 'UPDATE_PLAYER')
        .map((action) => action.payload.updates.currentHP)
    ).toEqual([7, 2, 0])
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'GAME_OVER' }))
    expect(navigate).toHaveBeenCalledWith('/death')
  })

  it('drains one HP per redistribution tick and uses the current-drain death framing', () => {
    const dispatch = jest.fn()
    const navigate = jest.fn()

    expect(applyCurrentLoomTickDrain(2, dispatch, navigate)).toBe(1)
    expect(applyCurrentLoomTickDrain(1, dispatch, navigate)).toBe(0)

    expect(dispatch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'GAME_OVER',
        payload: expect.objectContaining({ killerName: 'The Draining Earth Current' }),
      })
    )
    expect(navigate).toHaveBeenCalledWith('/death')
  })
})

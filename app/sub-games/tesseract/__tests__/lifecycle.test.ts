import { createInitialGameState } from '@modules/gameState'
import { reducer } from '../../../../state/reducer'
import {
  createSubGameLifecycleController,
  type LifecycleDependencies,
} from '../../_shared/lifecycle'
import { tesseractWordGridConfig } from '../wordGridConfig'

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

function makeTesseractLifecycle() {
  let state = createInitialGameState()
  const dispatch = jest.fn((action) => {
    state = reducer(state, action)
  })
  const signalRpgResume = jest.fn()
  const exit = jest.fn()
  const navigateToDeath = jest.fn()
  const dependencies: LifecycleDependencies = {
    getState: () => state,
    dispatch,
    signalRpgResume,
    exit,
    navigateToDeath,
    saveWaypoint: jest.fn(),
    getProgress: jest.fn(),
    setProgress: jest.fn(),
    clearProgress: jest.fn(),
  }

  return {
    controller: createSubGameLifecycleController(tesseractWordGridConfig, dependencies),
    getState: () => state,
    dispatch,
    signalRpgResume,
    exit,
    navigateToDeath,
  }
}

describe('Tesseract lifecycle instance', () => {
  it('grants the scroll on success entry and does not grant or complete twice', async () => {
    const harness = makeTesseractLifecycle()

    await harness.controller.grantReward()
    expect(
      harness.getState().player.inventory.filter((item) => item.id === 'persius-scroll')
    ).toHaveLength(1)
    expect(harness.getState().subGamesCompleted?.tesseract).not.toBe(true)

    await Promise.all([harness.controller.completeSubGame(), harness.controller.completeSubGame()])

    expect(
      harness.getState().player.inventory.filter((item) => item.id === 'persius-scroll')
    ).toHaveLength(1)
    expect(harness.getState().subGamesCompleted?.tesseract).toBe(true)
    expect(harness.signalRpgResume).toHaveBeenCalledTimes(1)
    expect(harness.exit).toHaveBeenCalledTimes(1)
  })

  it('uses the declared Ancient Evil death outcome for a wrong letter', async () => {
    const harness = makeTesseractLifecycle()
    await harness.controller.failSubGame()

    expect(harness.dispatch).toHaveBeenCalledWith({
      type: 'GAME_OVER',
      payload: {
        message: 'Christos failed to guess the right word.',
        killerName: 'Ancient Evil',
        suppressDeathDialog: true,
      },
    })
    expect(harness.navigateToDeath).toHaveBeenCalledWith('/death')
    expect(harness.signalRpgResume).not.toHaveBeenCalled()
    expect(harness.exit).not.toHaveBeenCalled()
  })

  it('routes completed revisits to the generic success sibling', () => {
    const harness = makeTesseractLifecycle()
    expect(harness.controller.resolveEntryRoute()).toBe('/sub-games/tesseract/main')

    harness.dispatch({
      type: 'SET_SUB_GAME_COMPLETED',
      payload: { subGameName: 'tesseract', completed: true },
    })
    expect(harness.controller.resolveEntryRoute()).toBe('/sub-games/tesseract/success')
  })
})

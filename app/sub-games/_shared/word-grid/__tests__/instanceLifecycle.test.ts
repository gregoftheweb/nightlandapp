import { createInitialGameState } from '@modules/gameState'
import { reducer } from '../../../../../state/reducer'
import { createSubGameLifecycleController, type LifecycleDependencies } from '../../lifecycle'
import { resolveParsedWordGridEncounter } from '../contentCatalog'

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

function makeLifecycle(instanceId: string) {
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
    controller: createSubGameLifecycleController(
      instanceId,
      dependencies,
      (id) => resolveParsedWordGridEncounter(id).definition
    ),
    getState: () => state,
    dispatch,
    signalRpgResume,
    exit,
    navigateToDeath,
  }
}

describe.each([
  {
    instanceId: 'word-tile-crypt-01',
    rewardId: 'persius-scroll',
    failureMessage: 'Christos failed to guess the right word.',
  },
  {
    instanceId: 'word-tile-crypt-02',
    rewardId: 'salamander-letter',
    failureMessage: 'Christos failed to spell SALAMANDER.',
  },
])('$instanceId lifecycle through parsed content', ({ instanceId, rewardId, failureMessage }) => {
  it('enters, grants its reward, succeeds idempotently, and routes revisits to success', async () => {
    const harness = makeLifecycle(instanceId)
    expect(harness.controller.resolveEntryRoute()).toBe(`/sub-games/word-grid/${instanceId}`)

    await harness.controller.grantReward()
    expect(harness.getState().player.inventory.filter((item) => item.id === rewardId)).toHaveLength(
      1
    )

    await Promise.all([harness.controller.completeSubGame(), harness.controller.completeSubGame()])
    expect(harness.getState().subGamesCompleted?.[instanceId]).toBe(true)
    expect(harness.controller.resolveEntryRoute()).toBe(
      `/sub-games/word-grid/${instanceId}/success`
    )
    expect(harness.signalRpgResume).toHaveBeenCalledTimes(1)
    expect(harness.exit).toHaveBeenCalledTimes(1)
  })

  it('fails through the same Ancient Evil death flow', async () => {
    const harness = makeLifecycle(instanceId)
    await harness.controller.failSubGame()

    expect(harness.dispatch).toHaveBeenCalledWith({
      type: 'GAME_OVER',
      payload: {
        message: failureMessage,
        killerName: 'Ancient Evil',
        suppressDeathDialog: true,
      },
    })
    expect(harness.navigateToDeath).toHaveBeenCalledWith('/death')
  })
})

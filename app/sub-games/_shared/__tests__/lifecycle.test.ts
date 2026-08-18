import { createInitialGameState } from '@modules/gameState'
import { reducer } from '../../../../state/reducer'

import {
  createSubGameLifecycleController,
  resolveSubGameEntryRoute,
  type LifecycleDependencies,
  type SubGameLifecycleConfig,
} from '../lifecycle'
import type { SubGameInstanceDefinition } from '@config/subGames'

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

const baseConfig = {
  completion: { event: 'Player confirms success', idempotent: true },
  failure: { exit: 'safe' },
  waypoint: { createsWaypoint: false },
  revisit: 'restart',
  progress: { mode: 'local-only' },
  reward: { kind: 'none' },
  returnToRpg: { signalRpgResume: true, exitSubGame: true },
} satisfies SubGameLifecycleConfig

const makeInstance = (config: SubGameLifecycleConfig): SubGameInstanceDefinition => ({
  instanceId: 'test-encounter',
  shapeId: 'one-off',
  entryRoute: '/sub-games/test-encounter/main',
  lifecycle: config,
  title: 'Test',
  description: 'Test instance',
  introBackgroundImage: 0,
})

function makeHarness(config: SubGameLifecycleConfig) {
  let state = createInitialGameState()
  const signalRpgResume = jest.fn()
  const exit = jest.fn()
  const saveWaypoint = jest.fn().mockResolvedValue('waypoint-id')
  const getProgress = jest.fn().mockResolvedValue(null)
  const setProgress = jest.fn().mockResolvedValue(undefined)
  const clearProgress = jest.fn().mockResolvedValue(undefined)
  const navigateToDeath = jest.fn()
  const dispatch = jest.fn((action) => {
    state = reducer(state, action)
  })

  const dependencies: LifecycleDependencies = {
    getState: () => state,
    dispatch,
    signalRpgResume,
    exit,
    saveWaypoint,
    getProgress,
    setProgress,
    clearProgress,
    navigateToDeath,
  }

  return {
    controller: createSubGameLifecycleController('test-encounter', dependencies, () =>
      makeInstance(config)
    ),
    getState: () => state,
    dispatch,
    signalRpgResume,
    exit,
    saveWaypoint,
    getProgress,
    setProgress,
    clearProgress,
    navigateToDeath,
  }
}

describe('sub-game lifecycle controller', () => {
  it('coalesces repeated completion and never duplicates its reward or waypoint', async () => {
    const config = {
      ...baseConfig,
      waypoint: {
        createsWaypoint: true,
        waypointName: 'test-waypoint',
        snapshot: 'Completion and weapon reward state',
        idempotent: true,
      },
      reward: {
        kind: 'weapon',
        id: 'weapon-lazer-pistol-001',
        grantEvent: 'Player confirms success',
        idempotent: true,
      },
    } satisfies SubGameLifecycleConfig
    const harness = makeHarness(config)

    await Promise.all([harness.controller.grantReward(), harness.controller.grantReward()])
    await Promise.all([harness.controller.completeSubGame(), harness.controller.completeSubGame()])
    await harness.controller.completeSubGame()

    const actions = harness.dispatch.mock.calls.map(([action]) => action)
    expect(actions.filter((action) => action.type === 'ADD_RANGED_WEAPON')).toHaveLength(1)
    expect(
      actions.filter(
        (action) =>
          action.type === 'SET_WAYPOINT_CREATED' && action.payload.waypointName === 'test-waypoint'
      )
    ).toHaveLength(1)
    expect(harness.saveWaypoint).toHaveBeenCalledTimes(1)
    expect(harness.signalRpgResume).toHaveBeenCalledTimes(1)
    expect(harness.exit).toHaveBeenCalledTimes(1)

    const waypointSnapshot = harness.saveWaypoint.mock.calls[0][0]
    expect(waypointSnapshot.subGamesCompleted['test-encounter']).toBe(true)
    expect(waypointSnapshot.player.rangedWeaponInventoryIds).toContain('weapon-lazer-pistol-001')
    expect(harness.getState().waypointSavesCreated?.['test-waypoint']).toBe(true)
  })

  it('safe failure resumes and exits without completion or rewards', async () => {
    const harness = makeHarness(baseConfig)

    await harness.controller.failSubGame()

    expect(harness.getState().subGamesCompleted?.['test-encounter']).not.toBe(true)
    expect(harness.dispatch).not.toHaveBeenCalled()
    expect(harness.signalRpgResume).toHaveBeenCalledTimes(1)
    expect(harness.exit).toHaveBeenCalledWith({ completed: false })
  })

  it('death failure dispatches GAME_OVER without a normal RPG return', async () => {
    const config = {
      ...baseConfig,
      failure: {
        exit: 'death',
        message: 'The test horror prevailed.',
        killerName: 'Test Horror',
        suppressDeathDialog: true,
        deathRoute: '/death',
      },
    } satisfies SubGameLifecycleConfig
    const harness = makeHarness(config)

    await harness.controller.failSubGame()

    expect(harness.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'GAME_OVER' }))
    expect(harness.getState().gameOver).toBe(true)
    expect(harness.signalRpgResume).not.toHaveBeenCalled()
    expect(harness.exit).not.toHaveBeenCalled()
    expect(harness.navigateToDeath).toHaveBeenCalledWith('/death')
  })

  it('uses declared AsyncStorage settings and clears progress on completion', async () => {
    const config = {
      ...baseConfig,
      progress: {
        mode: 'async-storage',
        saveKey: 'test-progress',
        version: 2,
        clearOnCompletion: true,
      },
    } satisfies SubGameLifecycleConfig
    const harness = makeHarness(config)
    harness.getProgress.mockResolvedValueOnce({
      version: 2,
      timestamp: 1,
      data: { step: 3 },
    })

    await expect(harness.controller.loadProgress()).resolves.toEqual({ step: 3 })
    await harness.controller.saveProgress({ step: 4 })
    await harness.controller.completeSubGame()

    expect(harness.getProgress).toHaveBeenCalledWith('test-progress')
    expect(harness.setProgress).toHaveBeenCalledWith('test-progress', { step: 4 }, 2)
    expect(harness.clearProgress).toHaveBeenCalledWith('test-progress')
  })
})

describe('sub-game revisit routing', () => {
  it.each([
    ['restart', '/sub-games/test-encounter/main'],
    ['resume', '/sub-games/test-encounter/main'],
    ['success-screen', '/sub-games/test-encounter/success'],
    ['aftermath-screen', '/sub-games/test-encounter/aftermath'],
    ['unavailable', null],
  ] as const)('resolves %s', (revisit, expected) => {
    const config = { ...baseConfig, revisit } satisfies SubGameLifecycleConfig
    expect(resolveSubGameEntryRoute(makeInstance(config), true)).toBe(expected)
  })

  it('always resolves the declared entry route before completion', () => {
    const config = { ...baseConfig, revisit: 'unavailable' } satisfies SubGameLifecycleConfig
    expect(resolveSubGameEntryRoute(makeInstance(config), false)).toBe(
      '/sub-games/test-encounter/main'
    )
  })
})

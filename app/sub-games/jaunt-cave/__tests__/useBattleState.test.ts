import { act, renderHook } from '@testing-library/react-native'
import { Animated, AppState, type AppStateStatus } from 'react-native'
import { DaemonState, useBattleState } from '../_components/useBattleState'

describe('useBattleState', () => {
  const initialAppState = AppState.currentState
  let appStateListener: ((state: AppStateStatus) => void) | undefined

  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: true })
    jest.spyOn(Animated, 'sequence').mockReturnValue({ start: jest.fn() } as never)
    AppState.currentState = 'active'
    appStateListener = undefined
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateListener = listener
      return { remove: jest.fn() }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    AppState.currentState = initialAppState
    jest.useRealTimers()
  })

  test('preserves one uninterrupted attack-cycle timeline', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1)

    const dispatch = jest.fn()
    const router = { replace: jest.fn() }
    const shakeAnim = {} as Animated.Value
    const { result } = renderHook(() =>
      useBattleState({
        shakeAnim,
        dispatch,
        currentPlayerHP: 100,
        router,
      })
    )

    expect(result.current.daemonState).toBe(DaemonState.RESTING)
    expect(result.current.currentPosition).toBe('center')
    expect(jest.getTimerCount()).toBe(1)

    act(() => jest.advanceTimersByTime(3400))
    expect(result.current.daemonState).toBe(DaemonState.PREP1)

    act(() => jest.advanceTimersByTime(500))
    expect(result.current.daemonState).toBe(DaemonState.PREP2)

    act(() => jest.advanceTimersByTime(200))
    expect(result.current.daemonState).toBe(DaemonState.ATTACKING)
    expect(result.current.currentPosition).toBe('left')
    expect(result.current.attackDirection).toBe('left')

    act(() => jest.advanceTimersByTime(750))
    expect(result.current.daemonState).toBe(DaemonState.LANDED)
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: { updates: { currentHP: 89 } },
    })

    act(() => jest.advanceTimersByTime(800))
    expect(result.current.daemonState).toBe(DaemonState.RESTING)
    expect(result.current.previousState).toBe(DaemonState.LANDED)
    expect(result.current.isCrossfading).toBe(true)

    act(() => jest.advanceTimersByTime(399))
    expect(result.current.isCrossfading).toBe(true)

    act(() => jest.advanceTimersByTime(1))
    expect(result.current.isCrossfading).toBe(false)
    expect(router.replace).not.toHaveBeenCalled()
  })

  test('invalidates the scheduled transition when unmounted mid-sequence', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1)
    const dispatch = jest.fn()
    const router = { replace: jest.fn() }
    const shakeAnim = {} as Animated.Value
    const { result, unmount } = renderHook(() =>
      useBattleState({ shakeAnim, dispatch, currentPlayerHP: 100, router })
    )

    act(() => jest.advanceTimersByTime(3400))
    expect(result.current.daemonState).toBe(DaemonState.PREP1)

    unmount()
    act(() => jest.runAllTimers())

    expect(dispatch).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  test('stops on background and restarts safely from resting on foreground', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1)
    const dispatch = jest.fn()
    const router = { replace: jest.fn() }
    const shakeAnim = {} as Animated.Value
    const { result } = renderHook(() =>
      useBattleState({ shakeAnim, dispatch, currentPlayerHP: 100, router })
    )

    act(() => jest.advanceTimersByTime(3400))
    expect(result.current.daemonState).toBe(DaemonState.PREP1)

    act(() => appStateListener?.('background'))
    act(() => jest.advanceTimersByTime(10000))
    expect(result.current.daemonState).toBe(DaemonState.PREP1)
    expect(dispatch).not.toHaveBeenCalled()

    act(() => appStateListener?.('active'))
    expect(result.current.daemonState).toBe(DaemonState.RESTING)
    act(() => jest.advanceTimersByTime(3399))
    expect(result.current.daemonState).toBe(DaemonState.RESTING)
    act(() => jest.advanceTimersByTime(1))
    expect(result.current.daemonState).toBe(DaemonState.PREP1)
  })

  test('chooses one terminal outcome for simultaneous lethal hits', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1)
    const dispatch = jest.fn()
    const router = { replace: jest.fn() }
    const onPlayerDeath = jest.fn(() => router.replace('/death'))
    const shakeAnim = {} as Animated.Value
    const { result } = renderHook(() =>
      useBattleState({ shakeAnim, dispatch, currentPlayerHP: 1, router, onPlayerDeath })
    )

    act(() => jest.advanceTimersByTime(3400 + 500 + 200))
    expect(result.current.daemonState).toBe(DaemonState.ATTACKING)

    // Registered after the attack transition at the same deadline, modeling a
    // projectile landing on the daemon as its lethal attack resolves.
    setTimeout(() => result.current.applyPlayerDamage(100), 750)
    act(() => jest.advanceTimersByTime(750))

    expect(result.current.daemonHP).toBe(100)

    act(() => jest.advanceTimersByTime(750))
    expect(router.replace).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledWith('/death')
  })

  test('preserves the PREP2 block boundary and shield duration', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1)
    const dispatch = jest.fn()
    const router = { replace: jest.fn() }
    const shakeAnim = {} as Animated.Value
    const { result } = renderHook(() =>
      useBattleState({ shakeAnim, dispatch, currentPlayerHP: 100, router })
    )

    act(() => jest.advanceTimersByTime(3400 + 500))
    expect(result.current.daemonState).toBe(DaemonState.PREP2)
    act(() => jest.advanceTimersByTime(199))
    expect(result.current.activateBlock()).toBe('success')

    act(() => jest.advanceTimersByTime(1))
    expect(result.current.daemonState).toBe(DaemonState.ATTACKING)
    expect(result.current.isBlockActive).toBe(true)
    expect(result.current.activateBlock()).toBe('too_late')

    act(() => jest.advanceTimersByTime(750))
    expect(result.current.daemonState).toBe(DaemonState.LANDED)
    expect(result.current.isBlockActive).toBe(true)
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'UPDATE_PLAYER' }))

    act(() => jest.advanceTimersByTime(149))
    expect(result.current.isBlockActive).toBe(true)
    act(() => jest.advanceTimersByTime(1))
    expect(result.current.isBlockActive).toBe(false)
  })

  test('rapid lethal input during an active transition schedules one victory', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1)
    const router = { replace: jest.fn() }
    const onDaemonDeath = jest.fn(() => router.replace('/sub-games/jaunt-cave/jaunt-cave/victory'))
    const shakeAnim = {} as Animated.Value
    const { result } = renderHook(() =>
      useBattleState({
        shakeAnim,
        dispatch: jest.fn(),
        currentPlayerHP: 100,
        router,
        onDaemonDeath,
      })
    )

    act(() => jest.advanceTimersByTime(3400))
    act(() => {
      result.current.applyPlayerDamage(60)
      result.current.applyPlayerDamage(60)
    })
    expect(result.current.daemonHP).toBe(0)

    act(() => jest.advanceTimersByTime(400))
    expect(router.replace).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledWith('/sub-games/jaunt-cave/jaunt-cave/victory')
  })
})

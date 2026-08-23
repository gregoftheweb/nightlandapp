import { Animated } from 'react-native'
import { act, renderHook } from '@testing-library/react-native'

import {
  getObeliskBackgroundState,
  OBELISK_SHAKE_DURATION_MS,
  useObeliskWinSequence,
} from '../useObeliskWinSequence'

describe('useObeliskWinSequence', () => {
  afterEach(() => jest.restoreAllMocks())

  test('shakes electric for two seconds, then settles back to plain and grants', () => {
    const onSettled = jest.fn()
    let finish: ((result: { finished: boolean }) => void) | undefined
    const timing = jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: jest.fn(),
          stop: jest.fn(),
          reset: jest.fn(),
        }) as unknown as Animated.CompositeAnimation
    )
    jest.spyOn(Animated, 'sequence').mockImplementation(
      () =>
        ({
          start: (callback?: (result: { finished: boolean }) => void) => {
            finish = callback
          },
          stop: jest.fn(),
          reset: jest.fn(),
        }) as Animated.CompositeAnimation
    )
    let solved = false
    const { result, rerender } = renderHook(() => useObeliskWinSequence(solved, onSettled))

    expect(result.current.phase).toBe('playing')
    expect(getObeliskBackgroundState(result.current.phase)).toBe('plain')
    solved = true
    rerender(undefined)
    expect(result.current.phase).toBe('shaking')
    expect(getObeliskBackgroundState(result.current.phase)).toBe('electric')

    expect(timing).toHaveBeenCalledTimes(20)
    expect(
      timing.mock.calls.reduce((duration, call) => duration + (call[1].duration ?? 0), 0)
    ).toBe(OBELISK_SHAKE_DURATION_MS)
    expect(result.current.phase).toBe('shaking')
    expect(onSettled).not.toHaveBeenCalled()

    act(() => finish?.({ finished: true }))
    expect(result.current.phase).toBe('settled')
    expect(getObeliskBackgroundState(result.current.phase)).toBe('plain')
    expect(onSettled).toHaveBeenCalledTimes(1)
  })
})

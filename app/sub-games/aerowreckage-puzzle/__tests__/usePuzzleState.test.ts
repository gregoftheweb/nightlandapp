import { act, renderHook } from '@testing-library/react-native'
import { clearSubGameSave, getSubGameSave, setSubGameSave } from '../../_shared'
import { usePuzzleState } from '../hooks/usePuzzleState'
import { numberToAngle } from '../utils'

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Heavy: 'heavy' },
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
}))

jest.mock('../../_shared', () => ({
  clearSubGameSave: jest.fn(),
  getSubGameSave: jest.fn(),
  setSubGameSave: jest.fn(),
}))

const mockedClearSubGameSave = jest.mocked(clearSubGameSave)
const mockedGetSubGameSave = jest.mocked(getSubGameSave)
const mockedSetSubGameSave = jest.mocked(setSubGameSave)

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('safe dial milestone persistence', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockedClearSubGameSave.mockReset()
    mockedClearSubGameSave.mockResolvedValue(undefined)
    mockedGetSubGameSave.mockReset()
    mockedGetSubGameSave.mockResolvedValue(null)
    mockedSetSubGameSave.mockReset()
    mockedSetSubGameSave.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderLoadedHook = async () => {
    const hook = renderHook(() => usePuzzleState())
    await act(flushPromises)
    return hook
  }

  test('cancels an older delayed snapshot when a tumbler locks', async () => {
    const { result, unmount } = await renderLoadedHook()

    act(() => result.current.updateAngle(numberToAngle(28), 'CCW'))
    act(() => result.current.attemptLock())
    await act(flushPromises)
    await act(async () => jest.advanceTimersByTimeAsync(250))

    expect(mockedSetSubGameSave).toHaveBeenCalledTimes(1)
    expect(mockedSetSubGameSave).toHaveBeenCalledWith(
      'aerowreckage-puzzle',
      expect.objectContaining({ currentStepIndex: 1, stepHistory: [28] })
    )
    unmount()
  })

  test('writes a milestone after an older save already in flight', async () => {
    let finishOlderSave!: () => void
    mockedSetSubGameSave.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishOlderSave = resolve
        })
    )
    const { result, unmount } = await renderLoadedHook()

    act(() => result.current.updateAngle(numberToAngle(1), 'CCW'))
    await act(async () => jest.advanceTimersByTimeAsync(250))
    expect(mockedSetSubGameSave).toHaveBeenCalledTimes(1)

    act(() => result.current.updateAngle(numberToAngle(28), 'CCW'))
    act(() => result.current.attemptLock())
    await act(flushPromises)
    expect(mockedSetSubGameSave).toHaveBeenCalledTimes(1)

    finishOlderSave()
    await act(flushPromises)

    expect(mockedSetSubGameSave).toHaveBeenCalledTimes(2)
    expect(mockedSetSubGameSave).toHaveBeenLastCalledWith(
      'aerowreckage-puzzle',
      expect.objectContaining({ currentStepIndex: 1, stepHistory: [28] })
    )
    unmount()
  })

  test('preserves the CCW 28, CW 15, CCW 7 solution sequence', async () => {
    const { result, unmount } = await renderLoadedHook()

    act(() => result.current.updateAngle(numberToAngle(28), 'CCW'))
    act(() => result.current.attemptLock())
    act(() => result.current.updateAngle(numberToAngle(15), 'CW'))
    act(() => result.current.attemptLock())
    act(() => result.current.updateAngle(numberToAngle(7), 'CCW'))
    act(() => result.current.attemptLock())
    await act(flushPromises)

    expect(result.current.state).toEqual(
      expect.objectContaining({
        currentStepIndex: 3,
        isOpened: true,
        stepHistory: [28, 15, 7],
      })
    )
    unmount()
  })
})

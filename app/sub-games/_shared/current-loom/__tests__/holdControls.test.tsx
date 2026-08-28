import React from 'react'
import { Animated } from 'react-native'
import { act, fireEvent, render } from '@testing-library/react-native'

import { resolveParsedCurrentLoomEncounter } from '../contentCatalog'
import { CURRENT_LOOM_HOLD_TICK_MS } from '../puzzleState'
import { CURRENT_LOOM_COMPLETION_FADE_MS } from '../feedback'
import { CurrentLoomPuzzleScreen } from '../screens'

const mockDispatch = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()
let mockPlayerHP = 30

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}))
jest.mock('@context/GameContext', () => ({
  useGameContext: () => ({
    state: { player: { currentHP: mockPlayerHP, maxHP: 100 }, gameOver: false },
    dispatch: mockDispatch,
  }),
}))
jest.mock('../../BackgroundImage', () => ({
  BackgroundImage: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('../../BottomActionBar', () => ({
  BottomActionBar: ({ children }: { children: React.ReactNode }) => children,
}))

describe('Current-Loom hold controls', () => {
  const safeInitialControl = (view: ReturnType<typeof render>) => {
    const values = Array.from({ length: 5 }, (_, index) =>
      Number(view.getByTestId(`current-loom-value-${index}`).props.children)
    )
    const index = values.findIndex((value, candidate) => {
      const donor = candidate === 0 ? 1 : candidate === 4 ? 3 : candidate - 1
      return value < 9 && values[donor] > 1
    })
    if (index < 0) throw new Error('Generated puzzle must expose at least one safe initial tick')
    return view.getByTestId(`current-loom-hold-${index}`)
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockPlayerHP = 30
    jest.spyOn(Math, 'random').mockReturnValue(0.4)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('starts immediately, repeats at the tunable tick rate, and clears on release/unmount', () => {
    const intervalSpy = jest.spyOn(globalThis, 'setInterval')
    const clearSpy = jest.spyOn(globalThis, 'clearInterval')
    const parsed = resolveParsedCurrentLoomEncounter('current-loom-01')
    const view = render(
      <CurrentLoomPuzzleScreen config={parsed.shapeConfig} definition={parsed.definition} />
    )
    const control = safeInitialControl(view)

    fireEvent(control, 'pressIn')
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), CURRENT_LOOM_HOLD_TICK_MS)
    fireEvent(control, 'pressOut')
    expect(clearSpy).toHaveBeenCalled()

    view.unmount()

    const secondView = render(
      <CurrentLoomPuzzleScreen config={parsed.shapeConfig} definition={parsed.definition} />
    )
    fireEvent(safeInitialControl(secondView), 'pressIn')
    const clearsBeforeUnmount = clearSpy.mock.calls.length
    secondView.unmount()
    expect(clearSpy.mock.calls.length).toBeGreaterThan(clearsBeforeUnmount)
  })

  it('starts a whole-screen buzz on press-in and stops it immediately on release', () => {
    const animations: { start: jest.Mock; stop: jest.Mock }[] = []
    jest.spyOn(Animated, 'loop').mockImplementation(() => {
      const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() }
      animations.push(animation)
      return animation as unknown as Animated.CompositeAnimation
    })
    const parsed = resolveParsedCurrentLoomEncounter('current-loom-01')
    const view = render(
      <CurrentLoomPuzzleScreen config={parsed.shapeConfig} definition={parsed.definition} />
    )
    const loopsBeforeHold = animations.length
    const control = safeInitialControl(view)

    fireEvent(control, 'pressIn')
    expect(view.getByTestId('current-loom-buzz-view')).toBeTruthy()
    expect(animations).toHaveLength(loopsBeforeHold + 1)
    const buzz = animations.at(-1)
    expect(buzz?.start).toHaveBeenCalledTimes(1)

    fireEvent(control, 'pressOut')
    expect(buzz?.stop).toHaveBeenCalledTimes(1)
  })

  it('layers active buzz, dire edge glow, and a red HP bar together at low health', () => {
    mockPlayerHP = 9
    const animations: { start: jest.Mock; stop: jest.Mock }[] = []
    jest.spyOn(Animated, 'loop').mockImplementation(() => {
      const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() }
      animations.push(animation)
      return animation as unknown as Animated.CompositeAnimation
    })
    const parsed = resolveParsedCurrentLoomEncounter('current-loom-01')
    const view = render(
      <CurrentLoomPuzzleScreen config={parsed.shapeConfig} definition={parsed.definition} />
    )
    const loopsBeforeHold = animations.length

    fireEvent(safeInitialControl(view), 'pressIn')

    expect(animations).toHaveLength(loopsBeforeHold + 1)
    expect(animations.at(-1)?.start).toHaveBeenCalledTimes(1)
    expect(view.getByLabelText('Health: dire').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#ff4444' })])
    )
    expect(view.getByLabelText('Current danger: dire')).toBeTruthy()
  })

  it('drains one HP immediately and every 150ms until the held control is released', () => {
    const parsed = resolveParsedCurrentLoomEncounter('current-loom-01')
    const view = render(
      <CurrentLoomPuzzleScreen config={parsed.shapeConfig} definition={parsed.definition} />
    )
    const control = safeInitialControl(view)
    const drainedHP = () =>
      mockDispatch.mock.calls
        .map(([action]) => action)
        .filter((action) => action.type === 'UPDATE_PLAYER')
        .map((action) => action.payload.updates.currentHP)

    fireEvent(control, 'pressIn')
    expect(drainedHP()).toEqual([29])

    act(() => jest.advanceTimersByTime(CURRENT_LOOM_HOLD_TICK_MS - 1))
    expect(drainedHP()).toEqual([29])
    act(() => jest.advanceTimersByTime(1))
    expect(drainedHP()).toEqual([29, 28])

    fireEvent(control, 'pressOut')
    act(() => jest.advanceTimersByTime(CURRENT_LOOM_HOLD_TICK_MS * 2))
    expect(drainedHP()).toEqual([29, 28])
  })

  it('dispatches game over immediately when tick drain reaches zero mid-hold', () => {
    mockPlayerHP = 1
    const parsed = resolveParsedCurrentLoomEncounter('current-loom-01')
    const view = render(
      <CurrentLoomPuzzleScreen config={parsed.shapeConfig} definition={parsed.definition} />
    )

    fireEvent(safeInitialControl(view), 'pressIn')

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: { updates: { currentHP: 0 } },
    })
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GAME_OVER',
        payload: expect.objectContaining({ killerName: 'The Draining Earth Current' }),
      })
    )
    expect(mockReplace).toHaveBeenCalledWith('/death')
  })

  it('stacks the one-HP tick drain with the five-HP boundary penalty', () => {
    const parsed = resolveParsedCurrentLoomEncounter('current-loom-01')
    const view = render(
      <CurrentLoomPuzzleScreen config={parsed.shapeConfig} definition={parsed.definition} />
    )

    // Seeded state is [9, 4, 4, 4, 4], so raising channel zero crosses its boundary.
    fireEvent(view.getByTestId('current-loom-hold-0'), 'pressIn')

    expect(
      mockDispatch.mock.calls
        .map(([action]) => action)
        .filter((action) => action.type === 'UPDATE_PLAYER')
        .map((action) => action.payload.updates.currentHP)
    ).toEqual([29, 24])
  })

  it('holds the solved puzzle under a green fade before opening the success screen', () => {
    let finishCompletion: Animated.EndCallback | undefined
    jest.spyOn(Animated, 'loop').mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    }))
    jest.spyOn(Animated, 'timing').mockImplementation((_value, config) => ({
      start: (callback?: Animated.EndCallback) => {
        if (config.duration === CURRENT_LOOM_COMPLETION_FADE_MS) finishCompletion = callback
      },
      stop: jest.fn(),
      reset: jest.fn(),
    }))
    ;(Math.random as jest.Mock)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
    const parsed = resolveParsedCurrentLoomEncounter('current-loom-01')
    const view = render(
      <CurrentLoomPuzzleScreen config={parsed.shapeConfig} definition={parsed.definition} />
    )

    // [5, 6, 4, 5, 5] becomes the solved [5, 5, 5, 5, 5] in one tick.
    fireEvent(view.getByTestId('current-loom-hold-2'), 'pressIn')

    expect(view.getByTestId('current-loom-completion-glow')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalledWith(parsed.shapeConfig.successRoute)

    act(() => finishCompletion?.({ finished: true }))
    expect(mockReplace).toHaveBeenCalledWith(parsed.shapeConfig.successRoute)
  })
})

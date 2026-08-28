import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'

import { resolveParsedCurrentLoomEncounter } from '../contentCatalog'
import { CURRENT_LOOM_HOLD_TICK_MS } from '../puzzleState'
import { CurrentLoomPuzzleScreen } from '../screens'

const mockDispatch = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}))
jest.mock('@context/GameContext', () => ({
  useGameContext: () => ({
    state: { player: { currentHP: 30 }, gameOver: false },
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
})

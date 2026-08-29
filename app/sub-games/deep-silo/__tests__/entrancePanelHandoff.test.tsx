import React from 'react'
import { act, render } from '@testing-library/react-native'

import DeepSiloEntrancePanelScreen from '../entrance-panel'
import { DeepSiloPanelView } from '../EntranceLeverPanel'

const mockDispatch = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}))

jest.mock('@context/GameContext', () => ({
  useGameState: () => ({ subGamesCompleted: {} }),
  useGameActions: () => ({ dispatch: mockDispatch }),
}))

jest.mock('../entranceState', () => ({
  countCompletedCurrentLooms: () => 5,
  DEEP_SILO_SWITCH_THROWN_FLAG: 'deep-silo:switch-thrown',
  effectiveLoomCount: () => 5,
  incrementDevLoomOverride: jest.fn(),
  isDeepSiloSwitchThrown: () => false,
  setDevSwitchThrown: jest.fn(),
  useDeepSiloDevState: () => ({ loomOverrideCount: 0, switchThrown: false }),
}))

jest.mock('../EntranceLeverPanel', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    DeepSiloPanelView: jest.fn(() => React.createElement(View)),
  }
})

describe('Deep Silo lever completion handoff', () => {
  test('latches the thrown frame before the persistent state update is visible', () => {
    render(<DeepSiloEntrancePanelScreen />)

    const panelMock = DeepSiloPanelView as jest.MockedFunction<typeof DeepSiloPanelView>
    const initialProps = panelMock.mock.calls.at(-1)?.[0]
    expect(initialProps?.switchThrown).toBe(false)

    act(() => initialProps?.onAnimationComplete())

    const completedProps = panelMock.mock.calls.at(-1)?.[0]
    expect(completedProps?.switchThrown).toBe(true)
    expect(completedProps?.completionFlashNonce).toBe(1)
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SUB_GAME_COMPLETED',
      payload: { subGameName: 'deep-silo:switch-thrown', completed: true },
    })
  })
})

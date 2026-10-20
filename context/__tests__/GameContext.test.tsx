import React, { useState } from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Text, TouchableOpacity, View } from 'react-native'
import { GameProvider, useGameActions, useGameState } from '../GameContext'

jest.mock('../../modules/autoSave', () => ({
  hasSaveRelevantChanges: jest.fn(() => true),
  invalidateAutoSaveAndDeleteCurrentGame: jest.fn(() => Promise.resolve()),
  requestAutoSave: jest.fn(),
}))

function HydrationHarness() {
  const state = useGameState()
  const { hydrateGameState } = useGameActions()
  const [hydrationResolved, setHydrationResolved] = useState(false)

  const hydrate = async () => {
    // Reuse the state GameProvider already built on mount rather than paying
    // for a second full procedural getInitialState() generation just to
    // flip one field - this test only exercises the hydration/commit
    // contract, not level generation, and the extra generation pass was
    // real, variable-latency work that made this test's timing CI-load
    // sensitive.
    const loadedState = { ...state, moveCount: 42 }
    await hydrateGameState(loadedState)
    setHydrationResolved(true)
  }

  return (
    <View>
      <Text testID="move-count">{state.moveCount}</Text>
      <Text testID="hydration-status">{hydrationResolved ? 'resolved' : 'pending'}</Text>
      <TouchableOpacity accessibilityLabel="hydrate state" onPress={() => void hydrate()} />
    </View>
  )
}

describe('GameProvider hydration', () => {
  test('resolves hydration only with the loaded state committed to context', async () => {
    const screen = await render(
      <GameProvider>
        <HydrationHarness />
      </GameProvider>
    )

    await fireEvent.press(screen.getByLabelText('hydrate state'))

    await waitFor(() => {
      expect(screen.getByTestId('move-count').props.children).toBe(42)
      expect(screen.getByTestId('hydration-status').props.children).toBe('resolved')
    })
  })
})

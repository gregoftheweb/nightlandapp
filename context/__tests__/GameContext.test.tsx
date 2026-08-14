import React, { useState } from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Text, TouchableOpacity, View } from 'react-native'
import { getInitialState } from '../../modules/gameState'
import { GameProvider, useGameActions, useGameState } from '../GameContext'

jest.mock('../../modules/autoSave', () => ({
  getStateSaveFingerprint: jest.fn(() => 'test-fingerprint'),
  invalidateAutoSaveAndDeleteCurrentGame: jest.fn(() => Promise.resolve()),
  requestAutoSave: jest.fn(),
}))

function HydrationHarness() {
  const state = useGameState()
  const { hydrateGameState } = useGameActions()
  const [hydrationResolved, setHydrationResolved] = useState(false)

  const hydrate = async () => {
    const loadedState = { ...getInitialState('1'), moveCount: 42 }
    await hydrateGameState(loadedState)
    setHydrationResolved(true)
  }

  return (
    <View>
      <Text testID="move-count">{state.moveCount}</Text>
      <Text testID="hydration-status">{hydrationResolved ? 'resolved' : 'pending'}</Text>
      <TouchableOpacity accessibilityLabel="hydrate state" onPress={hydrate} />
    </View>
  )
}

describe('GameProvider hydration', () => {
  test('resolves hydration only with the loaded state committed to context', async () => {
    const screen = render(
      <GameProvider>
        <HydrationHarness />
      </GameProvider>
    )

    fireEvent.press(screen.getByLabelText('hydrate state'))

    await waitFor(() => {
      expect(screen.getByTestId('move-count').props.children).toBe(42)
      expect(screen.getByTestId('hydration-status').props.children).toBe('resolved')
    })
  })
})

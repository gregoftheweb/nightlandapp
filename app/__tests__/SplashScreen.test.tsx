import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import SplashScreen from '../index'
import { useGameActions } from '@context/GameContext'
import { loadCurrentGame } from '@modules/saveGame'
import { fromSnapshot } from '@modules/gameState'

const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace }),
}))

jest.mock('@context/GameContext', () => ({
  useGameActions: jest.fn(),
}))

jest.mock('@modules/saveGame', () => ({
  debugInspectCurrentSave: jest.fn(),
  hasCurrentGame: jest.fn(() => Promise.resolve(true)),
  listWaypointSaves: jest.fn(() => Promise.resolve([])),
  loadCurrentGame: jest.fn(),
  loadWaypoint: jest.fn(),
}))

jest.mock('@modules/gameState', () => ({
  fromSnapshot: jest.fn(),
}))

jest.mock('@modules/autoSave', () => ({
  invalidateAutoSaveAndDeleteCurrentGame: jest.fn(() => Promise.resolve()),
}))

jest.mock('../sub-games/_shared/persistence', () => ({
  clearAllSubGameSaves: jest.fn(() => Promise.resolve()),
}))

const mockedUseGameActions = jest.mocked(useGameActions)
const mockedLoadCurrentGame = jest.mocked(loadCurrentGame)
const mockedFromSnapshot = jest.mocked(fromSnapshot)

describe('SplashScreen hydration navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('navigates only after context confirms the loaded state committed', async () => {
    let confirmCommit!: () => void
    const hydrateGameState = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          confirmCommit = resolve
        })
    )
    mockedUseGameActions.mockReturnValue({
      dispatch: jest.fn(),
      hydrateGameState,
      setOverlay: jest.fn(),
      signalRpgResume: jest.fn(),
    })
    mockedLoadCurrentGame.mockResolvedValue({} as never)
    mockedFromSnapshot.mockReturnValue({ moveCount: 42 } as never)

    const screen = render(<SplashScreen />)
    const currentButton = await screen.findByText('Current')
    fireEvent.press(currentButton)
    fireEvent.press(currentButton)

    await waitFor(() => expect(hydrateGameState).toHaveBeenCalledTimes(1))
    expect(mockedLoadCurrentGame).toHaveBeenCalledTimes(1)
    expect(mockReplace).not.toHaveBeenCalledWith('/game')

    await act(async () => confirmCommit())

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/game'))
  })
})

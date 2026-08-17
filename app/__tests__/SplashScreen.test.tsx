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

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

describe('SplashScreen hydration navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('navigates only after context confirms the loaded state committed', async () => {
    const hydrationCommit = createDeferred<void>()
    const gameNavigation = createDeferred<void>()
    const hydrateGameState = jest.fn(() => hydrationCommit.promise)
    mockReplace.mockImplementation((route) => {
      if (route === '/game') gameNavigation.resolve()
    })
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

    await act(async () => {
      hydrationCommit.resolve()
      await gameNavigation.promise
      // Flush handleContinue's finally block after router.replace returns.
      await Promise.resolve()
    })

    expect(mockReplace).toHaveBeenCalledWith('/game')
  })
})

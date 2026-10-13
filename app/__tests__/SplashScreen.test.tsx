import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import SplashScreen from '../index'
import { useGameActions } from '@context/GameContext'
import { loadCurrentGame } from '@modules/saveGame'
import { fromSnapshot, IncompatibleGameboardSaveError } from '@modules/gameState'

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
  IncompatibleGameboardSaveError: class extends Error {},
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
    const hydrateGameState = jest.fn(() => hydrationCommit.promise)
    mockedUseGameActions.mockReturnValue({
      dispatch: jest.fn(),
      hydrateGameState,
      setOverlay: jest.fn(),
      signalRpgResume: jest.fn(),
    })
    mockedLoadCurrentGame.mockResolvedValue({} as never)
    mockedFromSnapshot.mockReturnValue({ moveCount: 42 } as never)

    const screen = await render(<SplashScreen />)
    const currentButton = await screen.findByText('Current')
    // fireEvent resolves with the handler's promise, which stays pending until
    // hydration commits, so hold it rather than awaiting it here.
    const firstPress = fireEvent.press(currentButton)
    await waitFor(() => expect(hydrateGameState).toHaveBeenCalledTimes(1))
    await fireEvent.press(currentButton)

    expect(mockedLoadCurrentGame).toHaveBeenCalledTimes(1)
    expect(mockReplace).not.toHaveBeenCalledWith('/game')

    await act(async () => {
      hydrationCommit.resolve()
      await firstPress
    })

    expect(mockReplace).toHaveBeenCalledWith('/game')
  })
  test('explains that an old-map save needs a new expedition without hydrating it', async () => {
    const hydrateGameState = jest.fn()
    mockedUseGameActions.mockReturnValue({
      dispatch: jest.fn(),
      hydrateGameState,
      setOverlay: jest.fn(),
      signalRpgResume: jest.fn(),
    })
    mockedLoadCurrentGame.mockResolvedValue({} as never)
    mockedFromSnapshot.mockImplementation(() => {
      throw new IncompatibleGameboardSaveError()
    })
    const screen = await render(<SplashScreen />)
    await fireEvent.press(await screen.findByText('Current'))
    expect(
      await screen.findByText(
        'This save uses an older game layout. Begin a new expedition to use the updated map.'
      )
    ).toBeTruthy()
    expect(hydrateGameState).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalledWith('/game')
  })
})

import { getInitialState } from '../gameState'
import {
  cancelAutoSave,
  invalidateAutoSaveAndDeleteCurrentGame,
  requestAutoSave,
} from '../autoSave'
import { deleteCurrentGame, saveCurrentGame } from '../saveGame'

jest.mock('../saveGame', () => ({
  deleteCurrentGame: jest.fn(),
  saveCurrentGame: jest.fn(),
}))

const mockedDeleteCurrentGame = jest.mocked(deleteCurrentGame)
const mockedSaveCurrentGame = jest.mocked(saveCurrentGame)

const stateAtMove = (moveCount: number) => ({
  ...getInitialState('1'),
  moveCount,
})

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('autosave throttling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockedSaveCurrentGame.mockReset()
    mockedSaveCurrentGame.mockResolvedValue(undefined)
    mockedDeleteCurrentGame.mockReset()
    mockedDeleteCurrentGame.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cancelAutoSave()
    jest.useRealTimers()
  })

  test('saves the latest state requested during a throttle window', async () => {
    requestAutoSave(stateAtMove(1))
    requestAutoSave(stateAtMove(2))
    requestAutoSave(stateAtMove(3))

    await jest.advanceTimersByTimeAsync(2000)

    expect(mockedSaveCurrentGame).toHaveBeenCalledTimes(1)
    expect(mockedSaveCurrentGame).toHaveBeenCalledWith(expect.objectContaining({ moveCount: 3 }))
  })

  test('drains the latest state requested while a save is in flight', async () => {
    let finishFirstSave!: () => void
    mockedSaveCurrentGame.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishFirstSave = resolve
        })
    )

    requestAutoSave(stateAtMove(1))
    await jest.advanceTimersByTimeAsync(2000)
    expect(mockedSaveCurrentGame).toHaveBeenCalledWith(expect.objectContaining({ moveCount: 1 }))

    requestAutoSave(stateAtMove(2))
    requestAutoSave(stateAtMove(3))
    finishFirstSave()
    await flushPromises()

    await jest.advanceTimersByTimeAsync(2000)

    expect(mockedSaveCurrentGame).toHaveBeenCalledTimes(2)
    expect(mockedSaveCurrentGame).toHaveBeenLastCalledWith(
      expect.objectContaining({ moveCount: 3 })
    )
  })

  test('cancels a queued save before deleting the current game', async () => {
    requestAutoSave(stateAtMove(1))

    await invalidateAutoSaveAndDeleteCurrentGame()
    await jest.advanceTimersByTimeAsync(2000)

    expect(mockedSaveCurrentGame).not.toHaveBeenCalled()
    expect(mockedDeleteCurrentGame).toHaveBeenCalledTimes(1)
  })

  test('waits for an in-flight save before deleting the current game', async () => {
    const operations: string[] = []
    let finishSave!: () => void
    mockedSaveCurrentGame.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          operations.push('save started')
          finishSave = resolve
        })
    )
    mockedDeleteCurrentGame.mockImplementationOnce(async () => {
      operations.push('save deleted')
    })

    requestAutoSave(stateAtMove(1))
    await jest.advanceTimersByTimeAsync(2000)

    const deletion = invalidateAutoSaveAndDeleteCurrentGame()
    await flushPromises()
    expect(mockedDeleteCurrentGame).not.toHaveBeenCalled()

    finishSave()
    await deletion

    expect(operations).toEqual(['save started', 'save deleted'])
  })
})

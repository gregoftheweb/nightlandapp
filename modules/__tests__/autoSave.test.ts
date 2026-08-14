import { getInitialState } from '../gameState'
import { cancelAutoSave, requestAutoSave } from '../autoSave'
import { saveCurrentGame } from '../saveGame'

jest.mock('../saveGame', () => ({
  saveCurrentGame: jest.fn(),
}))

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
})

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'

import {
  GAMEBOARD_IMAGE_ASSETS,
  GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS,
  GameBoardImagePreloader,
} from '../GameBoardImagePreloader'

describe('GameBoardImagePreloader', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test('waits for every registered gameboard image to load', async () => {
    const onReady = jest.fn()
    const screen = await render(<GameBoardImagePreloader onReady={onReady} />)

    expect(GAMEBOARD_IMAGE_ASSETS.length).toBeGreaterThanOrEqual(22)
    expect(new Set(GAMEBOARD_IMAGE_ASSETS.map(({ id }) => id)).size).toBe(
      GAMEBOARD_IMAGE_ASSETS.length
    )

    for (const { id } of GAMEBOARD_IMAGE_ASSETS.slice(0, -1)) {
      await fireEvent(
        screen.getByTestId(`gameboard-preload-${id}`, { includeHiddenElements: true }),
        'load'
      )
    }
    expect(onReady).not.toHaveBeenCalled()

    await fireEvent(
      screen.getByTestId(`gameboard-preload-${GAMEBOARD_IMAGE_ASSETS.at(-1)!.id}`, {
        includeHiddenElements: true,
      }),
      'load'
    )
    expect(onReady).toHaveBeenCalledWith({
      reason: 'loaded',
      loadedCount: GAMEBOARD_IMAGE_ASSETS.length,
      failedIds: [],
    })
  })

  test('a failed image settles individually instead of permanently blocking startup', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const onReady = jest.fn()
    const screen = await render(<GameBoardImagePreloader onReady={onReady} />)
    const failedId = GAMEBOARD_IMAGE_ASSETS[0].id

    await fireEvent(
      screen.getByTestId(`gameboard-preload-${failedId}`, { includeHiddenElements: true }),
      'error'
    )
    for (const { id } of GAMEBOARD_IMAGE_ASSETS.slice(1)) {
      await fireEvent(
        screen.getByTestId(`gameboard-preload-${id}`, { includeHiddenElements: true }),
        'load'
      )
    }

    expect(onReady).toHaveBeenCalledWith({
      reason: 'failed',
      loadedCount: GAMEBOARD_IMAGE_ASSETS.length - 1,
      failedIds: [failedId],
    })
  })

  test('the global timeout releases startup when native image callbacks stall', async () => {
    jest.useFakeTimers()
    const onReady = jest.fn()
    const screen = await render(<GameBoardImagePreloader onReady={onReady} />)

    await fireEvent(
      screen.getByTestId(`gameboard-preload-${GAMEBOARD_IMAGE_ASSETS[0].id}`, {
        includeHiddenElements: true,
      }),
      'load'
    )
    await act(() => jest.advanceTimersByTime(GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS - 1))
    expect(onReady).not.toHaveBeenCalled()

    await act(() => jest.advanceTimersByTime(1))
    expect(onReady).toHaveBeenCalledWith({ reason: 'timeout', loadedCount: 1, failedIds: [] })
  })

  test('unmount clears the timeout and prevents a later handoff callback', async () => {
    jest.useFakeTimers()
    const onReady = jest.fn()
    const screen = await render(<GameBoardImagePreloader onReady={onReady} />)

    await await screen.unmount()
    await act(() => jest.advanceTimersByTime(GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS))

    expect(onReady).not.toHaveBeenCalled()
  })
})

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

  test('covers 21 distinct gameboard image files and waits for every onLoad', () => {
    const onReady = jest.fn()
    const screen = render(<GameBoardImagePreloader onReady={onReady} />)

    expect(GAMEBOARD_IMAGE_ASSETS).toHaveLength(21)
    expect(new Set(GAMEBOARD_IMAGE_ASSETS.map(({ id }) => id)).size).toBe(21)

    GAMEBOARD_IMAGE_ASSETS.slice(0, -1).forEach(({ id }) => {
      fireEvent(
        screen.getByTestId(`gameboard-preload-${id}`, { includeHiddenElements: true }),
        'load'
      )
    })
    expect(onReady).not.toHaveBeenCalled()

    fireEvent(
      screen.getByTestId(`gameboard-preload-${GAMEBOARD_IMAGE_ASSETS.at(-1)!.id}`, {
        includeHiddenElements: true,
      }),
      'load'
    )
    expect(onReady).toHaveBeenCalledWith({ reason: 'loaded', loadedCount: 21, failedIds: [] })
  })

  test('a failed image settles individually instead of permanently blocking startup', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const onReady = jest.fn()
    const screen = render(<GameBoardImagePreloader onReady={onReady} />)
    const failedId = GAMEBOARD_IMAGE_ASSETS[0].id

    fireEvent(
      screen.getByTestId(`gameboard-preload-${failedId}`, { includeHiddenElements: true }),
      'error'
    )
    GAMEBOARD_IMAGE_ASSETS.slice(1).forEach(({ id }) => {
      fireEvent(
        screen.getByTestId(`gameboard-preload-${id}`, { includeHiddenElements: true }),
        'load'
      )
    })

    expect(onReady).toHaveBeenCalledWith({
      reason: 'failed',
      loadedCount: 20,
      failedIds: [failedId],
    })
  })

  test('the global timeout releases startup when native image callbacks stall', () => {
    jest.useFakeTimers()
    const onReady = jest.fn()
    const screen = render(<GameBoardImagePreloader onReady={onReady} />)

    fireEvent(
      screen.getByTestId(`gameboard-preload-${GAMEBOARD_IMAGE_ASSETS[0].id}`, {
        includeHiddenElements: true,
      }),
      'load'
    )
    act(() => jest.advanceTimersByTime(GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS - 1))
    expect(onReady).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(1))
    expect(onReady).toHaveBeenCalledWith({ reason: 'timeout', loadedCount: 1, failedIds: [] })
  })

  test('unmount clears the timeout and prevents a later handoff callback', () => {
    jest.useFakeTimers()
    const onReady = jest.fn()
    const screen = render(<GameBoardImagePreloader onReady={onReady} />)

    screen.unmount()
    act(() => jest.advanceTimersByTime(GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS))

    expect(onReady).not.toHaveBeenCalled()
  })
})

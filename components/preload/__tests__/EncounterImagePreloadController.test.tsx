import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'

import {
  EncounterImagePreloadController,
  ENCOUNTER_IMAGE_PRELOAD_TIMEOUT_MS,
  requestEncounterImagePreload,
  resetEncounterImagePreloadControllerForTests,
} from '../EncounterImagePreloadController'

const assets = [
  { id: 'one', source: 1, width: 100, height: 200 },
  { id: 'two', source: 2, width: 300, height: 400 },
]

describe('EncounterImagePreloadController', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    resetEncounterImagePreloadControllerForTests()
  })
  afterEach(() => jest.useRealTimers())

  test('mounts real-size hidden images, tracks load/error, resolves, and cleans up', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(<EncounterImagePreloadController />)
    let resultPromise!: ReturnType<typeof requestEncounterImagePreload>
    act(() => {
      resultPromise = requestEncounterImagePreload(assets)
    })
    const first = screen.getByTestId('encounter-preload-one', { includeHiddenElements: true })
    const second = screen.getByTestId('encounter-preload-two', { includeHiddenElements: true })
    expect(StyleSheet.flatten(first.props.style)).toEqual(
      expect.objectContaining({ width: 100, height: 200 })
    )
    fireEvent(first, 'load')
    fireEvent(second, 'error')
    await expect(resultPromise).resolves.toEqual({
      reason: 'failed',
      loadedCount: 1,
      failedIds: ['two'],
    })
    expect(
      screen.queryByTestId('encounter-preload-one', { includeHiddenElements: true })
    ).toBeNull()
    warn.mockRestore()
  })

  test('times out, resolves, and unmounts slow images', async () => {
    render(<EncounterImagePreloadController />)
    let resultPromise!: ReturnType<typeof requestEncounterImagePreload>
    act(() => {
      resultPromise = requestEncounterImagePreload(assets)
    })
    act(() => jest.advanceTimersByTime(ENCOUNTER_IMAGE_PRELOAD_TIMEOUT_MS))
    await expect(resultPromise).resolves.toEqual({
      reason: 'timeout',
      loadedCount: 0,
      failedIds: [],
    })
    expect(
      screen.queryByTestId('encounter-preload-one', { includeHiddenElements: true })
    ).toBeNull()
  })
})

import React from 'react'
import { act, render } from '@testing-library/react-native'

import Layout from '../_layout'
import type { GameBoardImagePreloadResult } from '../../components/startup/GameBoardImagePreloader'

let mockFontsLoaded = false
let mockCompleteImages: ((result: GameBoardImagePreloadResult) => void) | undefined
const mockHideSplash = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-font', () => ({ useFonts: () => [mockFontsLoaded] }))
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: () => mockHideSplash(),
}))
jest.mock('../../components/startup/GameBoardImagePreloader', () => ({
  GameBoardImagePreloader: ({
    onReady,
  }: {
    onReady: (result: GameBoardImagePreloadResult) => void
  }) => {
    const ReactModule = require('react') as typeof import('react')
    mockCompleteImages = onReady
    return ReactModule.createElement('View', { testID: 'mock-gameboard-image-preloader' })
  },
}))
jest.mock('../../modules/audioManager', () => ({
  audioManager: {
    initializeAudio: jest.fn().mockResolvedValue(undefined),
    loadBackgroundMusic: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('../../modules/settingsManager', () => ({
  settingsManager: { initialize: jest.fn().mockResolvedValue(undefined) },
}))
jest.mock('../../context/GameContext', () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('expo-router', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react')
  function Stack({ children }: { children: React.ReactNode }) {
    return ReactModule.createElement(ReactModule.Fragment, null, children)
  }
  Stack.Screen = function StackScreen() {
    return null
  }
  return { Stack }
})

describe('Layout startup readiness', () => {
  beforeEach(() => {
    mockFontsLoaded = false
    mockCompleteImages = undefined
    mockHideSplash.mockClear()
  })

  test('holds the splash until both fonts and decoded gameboard images are ready', async () => {
    const screen = render(<Layout />)
    expect(screen.getByText('Nightland')).toBeTruthy()
    expect(mockHideSplash).not.toHaveBeenCalled()

    await act(async () => {
      mockCompleteImages?.({ reason: 'loaded', loadedCount: 21, failedIds: [] })
    })
    expect(mockHideSplash).not.toHaveBeenCalled()

    mockFontsLoaded = true
    await act(async () => {
      screen.rerender(<Layout />)
      await Promise.resolve()
    })

    expect(screen.queryByText('Nightland')).toBeNull()
    expect(screen.queryByTestId('mock-gameboard-image-preloader')).toBeNull()
    expect(mockHideSplash).toHaveBeenCalledTimes(1)
  })
})

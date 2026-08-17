import React from 'react'
import { act, render } from '@testing-library/react-native'

import Layout, { waitForAudioCleanup } from '../_layout'

const mockInitializeAudio = jest.fn().mockResolvedValue(undefined)
const mockLoadBackgroundMusic = jest.fn().mockResolvedValue(undefined)
const mockCleanup = jest.fn<Promise<void>, []>()

jest.mock('../../modules/audioManager', () => ({
  audioManager: {
    initializeAudio: () => mockInitializeAudio(),
    loadBackgroundMusic: () => mockLoadBackgroundMusic(),
    cleanup: () => mockCleanup(),
  },
}))

jest.mock('../../modules/settingsManager', () => ({
  settingsManager: { initialize: jest.fn().mockResolvedValue(undefined) },
}))

jest.mock('../../context/GameContext', () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('expo-font', () => ({ useFonts: () => [true] }))
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
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

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('Layout audio cleanup', () => {
  it('tracks native cleanup through completion when the root unmounts', async () => {
    const cleanup = deferred()
    mockCleanup.mockReturnValueOnce(cleanup.promise)
    const view = render(<Layout />)

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    view.unmount()
    expect(mockCleanup).toHaveBeenCalledTimes(1)

    let completed = false
    void waitForAudioCleanup().then(() => {
      completed = true
    })
    await Promise.resolve()
    expect(completed).toBe(false)

    await act(async () => {
      cleanup.resolve()
      await waitForAudioCleanup()
    })
    expect(completed).toBe(true)
  })
})

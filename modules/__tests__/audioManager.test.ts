import { AppState, type AppStateStatus } from 'react-native'

import { AudioManager } from '../audioManager'

type StatusListener = (status: ReturnType<typeof loadedStatus>) => void

const mockCreateAsync = jest.fn()
const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: (...args: unknown[]) => mockSetAudioModeAsync(...args),
    Sound: {
      createAsync: (...args: unknown[]) => mockCreateAsync(...args),
    },
  },
  InterruptionModeAndroid: { DuckOthers: 1 },
  InterruptionModeIOS: { DuckOthers: 1 },
}))

function loadedStatus(isPlaying: boolean) {
  return {
    isLoaded: true as const,
    isPlaying,
    androidImplementation: 'SimpleExoPlayer',
    uri: 'ambient-background.mp3',
    progressUpdateIntervalMillis: 500,
    durationMillis: 1000,
    positionMillis: 0,
    playableDurationMillis: 1000,
    shouldPlay: isPlaying,
    isBuffering: false,
    rate: 1,
    shouldCorrectPitch: false,
    volume: 1,
    audioPan: 0,
    isMuted: false,
    isLooping: true,
    didJustFinish: false,
  }
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function makeSound(initiallyPlaying = false) {
  let listener: StatusListener | null = null
  let status = loadedStatus(initiallyPlaying)

  const sound = {
    setOnPlaybackStatusUpdate: jest.fn((nextListener: StatusListener | null) => {
      listener = nextListener
    }),
    getStatusAsync: jest.fn(async () => status),
    playAsync: jest.fn(async () => {
      status = loadedStatus(true)
      listener?.(status)
      return status
    }),
    pauseAsync: jest.fn(async () => {
      status = loadedStatus(false)
      listener?.(status)
      return status
    }),
    stopAsync: jest.fn(async () => {
      status = loadedStatus(false)
      listener?.(status)
      return status
    }),
    setVolumeAsync: jest.fn(async () => status),
    unloadAsync: jest.fn(async () => loadedStatus(false)),
    interrupt() {
      status = loadedStatus(false)
      listener?.(status)
    },
    setNativePlaying(isPlaying: boolean) {
      status = loadedStatus(isPlaying)
    },
  }

  return sound
}

describe('AudioManager lifecycle', () => {
  const originalAppState = AppState.currentState
  let appStateListener: ((state: AppStateStatus) => void) | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    AppState.currentState = 'active'
    appStateListener = undefined
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateListener = listener
      return { remove: jest.fn() }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    AppState.currentState = originalAppState
  })

  it('resumes requested music after backgrounding and returning active', async () => {
    const sound = makeSound()
    mockCreateAsync.mockResolvedValue({ sound, status: loadedStatus(false) })
    const manager = new AudioManager()

    await manager.initializeAudio()
    await manager.loadBackgroundMusic()
    await manager.playBackgroundMusic()
    expect(manager.getIsPlaying()).toBe(true)

    appStateListener?.('background')
    sound.setNativePlaying(false)
    sound.interrupt()
    expect(sound.playAsync).toHaveBeenCalledTimes(1)

    appStateListener?.('active')
    await Promise.resolve()
    await Promise.resolve()

    expect(sound.getStatusAsync).toHaveBeenCalledTimes(1)
    expect(sound.playAsync).toHaveBeenCalledTimes(2)
    expect(manager.getIsPlaying()).toBe(true)
  })

  it('resumes when native playback reports an interruption while active', async () => {
    const sound = makeSound()
    mockCreateAsync.mockResolvedValue({ sound, status: loadedStatus(false) })
    const manager = new AudioManager()

    await manager.initializeAudio()
    await manager.loadBackgroundMusic()
    await manager.playBackgroundMusic()
    sound.interrupt()
    await Promise.resolve()
    await Promise.resolve()

    expect(sound.playAsync).toHaveBeenCalledTimes(2)
    expect(manager.getIsPlaying()).toBe(true)
  })

  it('does not let an older unload completion clobber a newer load', async () => {
    const oldSound = makeSound()
    const newSound = makeSound()
    const oldUnload = deferred<ReturnType<typeof loadedStatus>>()
    oldSound.unloadAsync.mockReturnValueOnce(oldUnload.promise)
    mockCreateAsync
      .mockResolvedValueOnce({ sound: oldSound, status: loadedStatus(false) })
      .mockResolvedValueOnce({ sound: newSound, status: loadedStatus(false) })
    const manager = new AudioManager()

    await manager.initializeAudio()
    await manager.loadBackgroundMusic()
    const olderLoad = manager.loadBackgroundMusic()
    const newerLoad = manager.loadBackgroundMusic()
    await newerLoad

    oldUnload.resolve(loadedStatus(false))
    await olderLoad
    await manager.playBackgroundMusic()

    expect(newSound.playAsync).toHaveBeenCalledTimes(1)
    expect(manager.getIsPlaying()).toBe(true)
  })

  it('keeps cleanup pending until native unload completes', async () => {
    const sound = makeSound()
    const unload = deferred<ReturnType<typeof loadedStatus>>()
    sound.unloadAsync.mockReturnValueOnce(unload.promise)
    mockCreateAsync.mockResolvedValue({ sound, status: loadedStatus(false) })
    const manager = new AudioManager()
    await manager.initializeAudio()
    await manager.loadBackgroundMusic()

    let completed = false
    const cleanup = manager.cleanup().then(() => {
      completed = true
    })
    await Promise.resolve()
    expect(completed).toBe(false)

    unload.resolve(loadedStatus(false))
    await cleanup
    expect(completed).toBe(true)
    expect(manager.getIsPlaying()).toBe(false)
  })
})

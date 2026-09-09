import { AppState, type AppStateStatus } from 'react-native'

import { AudioManager } from '../audioManager'

type Status = ReturnType<typeof loadedStatus>
type StatusListener = (status: Status) => void

const mockCreateAudioPlayer = jest.fn()
const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-audio', () => ({
  createAudioPlayer: (...args: unknown[]) => mockCreateAudioPlayer(...args),
  setAudioModeAsync: (...args: unknown[]) => mockSetAudioModeAsync(...args),
}))

function loadedStatus(playing: boolean) {
  return {
    id: 'background-music',
    currentTime: 0,
    playbackState: playing ? 'playing' : 'readyToPlay',
    timeControlStatus: playing ? 'playing' : 'paused',
    reasonForWaitingToPlay: '',
    mute: false,
    duration: 1,
    playing,
    loop: true,
    didJustFinish: false,
    isBuffering: false,
    isLoaded: true,
    playbackRate: 1,
    shouldCorrectPitch: true,
    isLive: false,
    currentOffsetFromLive: null,
    error: null,
  }
}

function makePlayer(initiallyPlaying = false) {
  let listener: StatusListener | null = null
  let status = loadedStatus(initiallyPlaying)

  const player = {
    loop: false,
    volume: 1,
    get currentStatus() {
      return status
    },
    addListener: jest.fn((_event: string, nextListener: StatusListener) => {
      listener = nextListener
      return { remove: jest.fn(() => (listener = null)) }
    }),
    play: jest.fn(() => {
      status = loadedStatus(true)
      listener?.(status)
    }),
    pause: jest.fn(() => {
      status = loadedStatus(false)
      listener?.(status)
    }),
    seekTo: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn(),
    interrupt() {
      status = loadedStatus(false)
      listener?.(status)
    },
    setNativePlaying(playing: boolean) {
      status = loadedStatus(playing)
    },
  }

  return player
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

  it('configures and loads SDK 57 audio', async () => {
    const player = makePlayer()
    mockCreateAudioPlayer.mockReturnValue(player)
    const manager = new AudioManager()

    await manager.initializeAudio()
    await manager.loadBackgroundMusic()

    expect(mockSetAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentMode: true, interruptionMode: 'duckOthers' })
    )
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1)
    expect(player.loop).toBe(true)
  })

  it('resumes requested music after backgrounding and returning active', async () => {
    const player = makePlayer()
    mockCreateAudioPlayer.mockReturnValue(player)
    const manager = new AudioManager()

    await manager.initializeAudio()
    await manager.loadBackgroundMusic()
    await manager.playBackgroundMusic()
    expect(manager.getIsPlaying()).toBe(true)

    appStateListener?.('background')
    player.setNativePlaying(false)
    appStateListener?.('active')
    await Promise.resolve()

    expect(player.play).toHaveBeenCalledTimes(2)
    expect(manager.getIsPlaying()).toBe(true)
  })

  it('resumes when native playback reports an interruption while active', async () => {
    const player = makePlayer()
    mockCreateAudioPlayer.mockReturnValue(player)
    const manager = new AudioManager()

    await manager.initializeAudio()
    await manager.loadBackgroundMusic()
    await manager.playBackgroundMusic()
    player.interrupt()
    await Promise.resolve()

    expect(player.play).toHaveBeenCalledTimes(2)
    expect(manager.getIsPlaying()).toBe(true)
  })

  it('releases native audio during cleanup', async () => {
    const player = makePlayer()
    mockCreateAudioPlayer.mockReturnValue(player)
    const manager = new AudioManager()
    await manager.initializeAudio()
    await manager.loadBackgroundMusic()

    await manager.cleanup()

    expect(player.remove).toHaveBeenCalledTimes(1)
    expect(manager.getIsPlaying()).toBe(false)
  })
})

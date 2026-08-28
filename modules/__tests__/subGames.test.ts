import { router } from 'expo-router'
import { act } from '@testing-library/react-native'

import { requestEncounterImagePreload } from '@components/preload/EncounterImagePreloadController'
import { enterSubGame, exitSubGame, resetSubGameEntryStateForTests } from '../subGames'

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}))
jest.mock('@components/preload/EncounterImagePreloadController', () => ({
  requestEncounterImagePreload: jest.fn(),
}))

const requestPreload = requestEncounterImagePreload as jest.MockedFunction<
  typeof requestEncounterImagePreload
>
const loaded = { reason: 'loaded' as const, loadedCount: 1, failedIds: [] }

function deferredPreload() {
  let resolve!: (value: typeof loaded) => void
  const promise = new Promise<typeof loaded>((resolver) => {
    resolve = resolver
  })
  requestPreload.mockReturnValueOnce(promise)
  return resolve
}

describe('sub-game navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetSubGameEntryStateForTests()
  })

  it.each(['word-tile-crypt-01', 'word-tile-crypt-02'])(
    'uses the adapter route for word-grid instance %s',
    async (instanceId) => {
      const resolve = deferredPreload()
      enterSubGame(instanceId)
      expect(router.replace).not.toHaveBeenCalled()
      await act(async () => resolve(loaded))
      expect(router.replace).toHaveBeenCalledWith(`/sub-games/word-grid/${instanceId}`)
    }
  )

  it.each(['current-loom-01', 'current-loom-02'])(
    'uses the adapter route for Current-Loom instance %s',
    async (instanceId) => {
      const resolve = deferredPreload()
      enterSubGame(instanceId)
      expect(router.replace).not.toHaveBeenCalled()
      await act(async () => resolve(loaded))
      expect(router.replace).toHaveBeenCalledWith(`/sub-games/current-loom/${instanceId}`)
    }
  )

  it('guarantees all six Jaunt Cave daemon sprites settle before encounter entry', async () => {
    const resolve = deferredPreload()
    enterSubGame('jaunt-cave')
    expect(
      requestPreload.mock.calls[0][0].filter(({ id }) => id.startsWith('jaunt-daemon-'))
    ).toHaveLength(6)
    expect(router.replace).not.toHaveBeenCalled()
    await act(async () => resolve(loaded))
    expect(router.replace).toHaveBeenCalledWith('/sub-games/jaunt-cave/jaunt-cave')
  })

  it('ignores repeat presses while the first preload is in flight', async () => {
    const resolve = deferredPreload()
    enterSubGame('deep-silo')
    enterSubGame('hermit-hollow')
    expect(requestPreload).toHaveBeenCalledTimes(1)
    await act(async () => resolve(loaded))
    expect(router.replace).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledWith('/sub-games/deep-silo/screen1')
  })

  it('prevents a stale completion from navigating after entry is cancelled', async () => {
    const resolve = deferredPreload()
    enterSubGame('rune-obelisk')
    exitSubGame()
    expect(router.replace).toHaveBeenCalledWith('/game')
    await act(async () => resolve(loaded))
    expect(router.replace).toHaveBeenCalledTimes(1)
  })

  it('continues navigation after the timeout fallback', async () => {
    requestPreload.mockResolvedValueOnce({ reason: 'timeout', loadedCount: 0, failedIds: [] })
    enterSubGame('hermit-hollow')
    await act(async () => undefined)
    expect(router.replace).toHaveBeenCalledWith('/sub-games/hermit-hollow/main')
  })

  it('pre-decodes electric obelisk art before puzzle entry can become possible', async () => {
    const resolve = deferredPreload()
    enterSubGame('rune-obelisk')
    expect(requestPreload.mock.calls[0][0].map(({ id }) => id)).toContain('obelisk-electric')
    expect(router.replace).not.toHaveBeenCalled()
    await act(async () => resolve(loaded))
    expect(router.replace).toHaveBeenCalledWith('/sub-games/rune-obelisk/entrance')
  })
})

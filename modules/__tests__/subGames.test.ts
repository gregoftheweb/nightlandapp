import { router } from 'expo-router'

import { enterSubGame } from '../subGames'

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}))

describe('sub-game navigation', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each(['word-tile-crypt-01', 'word-tile-crypt-02'])(
    'uses the adapter route for word-grid instance %s',
    (instanceId) => {
      enterSubGame(instanceId)
      expect(router.replace).toHaveBeenCalledWith(`/sub-games/word-grid/${instanceId}`)
    }
  )

  it('keeps legacy registry navigation for non-word-grid shapes', () => {
    enterSubGame('jaunt-cave')
    expect(router.replace).toHaveBeenCalledWith('/sub-games/jaunt-cave/main')
  })
})

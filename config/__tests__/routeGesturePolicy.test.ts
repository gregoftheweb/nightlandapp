import { IOS_BACK_GESTURE_ROUTES, isIOSBackGestureEnabled } from '../routeGesturePolicy'

describe('iOS route gesture policy', () => {
  it.each(IOS_BACK_GESTURE_ROUTES)('allows the explicit back-safe route %s', (routeName) => {
    expect(isIOSBackGestureEnabled(routeName)).toBe(true)
  })

  it.each([
    'index',
    'princess/index',
    'game/index',
    'death/index',
    'sub-games/aerowreckage-puzzle/safe',
    'sub-games/aerowreckage-puzzle/success',
    'sub-games/deep-silo/switch-animation',
    'sub-games/hermit-hollow/main',
    'sub-games/jaunt-cave/screen2',
    'sub-games/word-grid/[instanceId]/puzzle',
    'sub-games/word-grid/[instanceId]/failure',
    'sub-games/word-grid/[instanceId]/success',
    'sub-games/word-grid/[instanceId]/aftermath',
  ])('protects the one-way, timed, battle, or transactional route %s', (routeName) => {
    expect(isIOSBackGestureEnabled(routeName)).toBe(false)
  })

  it('protects newly added routes until they are explicitly reviewed', () => {
    expect(isIOSBackGestureEnabled('sub-games/future-game/new-screen')).toBe(false)
  })
})

/**
 * iOS edge-swipe is enabled only when it is equivalent to the screen's explicit
 * Back action. Routes omitted from this allowlist are protected by default so a
 * new timed, transactional, or one-way screen cannot accidentally become swipable.
 */
export const IOS_BACK_GESTURE_ROUTES = [
  'sub-games/aerowreckage-puzzle/cockpit',
  'sub-games/aerowreckage-puzzle/cockpit-closeup',
  'sub-games/aerowreckage-puzzle/rear-entry',
  'sub-games/deep-silo/screen2',
  'sub-games/deep-silo/screen3',
  'sub-games/deep-silo/screen4',
  'sub-games/deep-silo/screen5',
  'sub-games/deep-silo/screen6',
  'sub-games/deep-silo/screen7',
  'sub-games/deep-silo/screen8',
] as const

const IOS_BACK_GESTURE_ROUTE_SET = new Set<string>(IOS_BACK_GESTURE_ROUTES)

export function isIOSBackGestureEnabled(routeName: string): boolean {
  return IOS_BACK_GESTURE_ROUTE_SET.has(routeName)
}

import type { SubGameLifecycleConfig } from '../_shared'

export const lifecycleConfig = {
  id: '_subgame-template',
  shape: 'one-off',
  entryRoute: '/sub-games/_subgame-template/main',
  completion: {
    event: 'Player confirms Return to the Night Land on the success screen',
    idempotent: true,
  },
  failure: { exit: 'safe' },
  waypoint: { createsWaypoint: false },
  revisit: 'success-screen',
  progress: { mode: 'local-only' },
  reward: { kind: 'none' },
  returnToRpg: { signalRpgResume: true, exitSubGame: true },
} satisfies SubGameLifecycleConfig

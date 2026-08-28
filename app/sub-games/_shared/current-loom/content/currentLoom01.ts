import type { CurrentLoomEncounterContent } from '../content'

export const currentLoom01Content = {
  instanceId: 'current-loom-01',
  shapeId: 'current-loom',
  metadata: {
    title: 'Current-Loom of the Buried Choir',
    description:
      'Five stone conduits bind a captive Earth Current. Their charge must be held in perfect accord.',
    entrance: {
      shortName: 'currentLoom',
      category: 'building',
      assetId: 'current-loom-entrance',
      footprint: { width: 5, height: 5 },
      initialActive: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Approach the loom',
      requiresPlayerOnObject: true,
    },
  },
  content: { channelLabels: ['Root', 'Stone', 'Iron', 'Ember', 'Sky'] },
  lifecycle: {
    completion: { event: 'success-confirmed', idempotent: true },
    failure: { exit: 'safe' },
    waypoint: { createsWaypoint: false },
    revisit: 'success-screen',
    progress: { mode: 'local-only' },
    reward: { kind: 'none' },
    returnToRpg: { signalRpgResume: true, exitSubGame: true },
  },
  presentation: {
    intro: {
      assetId: 'current-loom-intro',
      text: 'Five currents strain against one another beneath the stone. Balance may quiet them.',
      leaveLabel: 'Leave the currents bound',
      startLabel: 'Lay hands upon the loom',
    },
    puzzle: {
      assetId: 'current-loom-board',
      instructionText: 'Hold a conduit to raise it. Its neighboring currents surrender the cost.',
      leaveLabel: 'Release the loom',
      holdLabel: 'Hold to raise',
    },
    hazard: {
      assetId: 'current-loom-hazard',
      text: 'The current strikes back! Christos suffers 5 damage.',
    },
    success: {
      assetId: 'current-loom-success',
      firstVisitText: 'The five currents stand equal. The loom falls into a deep and perfect hum.',
      revisitText: 'The Current-Loom remains balanced and silent.',
      returnLabel: 'Return to the Night Land',
    },
  },
} satisfies CurrentLoomEncounterContent

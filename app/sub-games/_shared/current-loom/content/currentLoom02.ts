import type { CurrentLoomEncounterContent } from '../content'

export const currentLoom02Content = {
  instanceId: 'current-loom-02',
  shapeId: 'current-loom',
  metadata: {
    title: 'Current-Loom of the Ashen Reach',
    description: 'An abandoned regulator still draws five threads of power from the black earth.',
    entrance: {
      shortName: 'currentLoom',
      category: 'building',
      assetId: 'current-loom-entrance',
      footprint: { width: 5, height: 5 },
      initialActive: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Inspect the regulator',
      requiresPlayerOnObject: true,
    },
  },
  content: { channelLabels: ['Depth', 'Ore', 'Flame', 'Storm', 'Crown'] },
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
      text: 'The Ashen Reach trembles around five unequal pillars of cold radiance.',
      leaveLabel: 'Pass the regulator by',
      startLabel: 'Take hold of the currents',
    },
    puzzle: {
      assetId: 'current-loom-board',
      instructionText: 'Hold a conduit to raise it. Every gain must be taken from its neighbors.',
      leaveLabel: 'Abandon the regulator',
      holdLabel: 'Hold to raise',
    },
    hazard: {
      assetId: 'current-loom-hazard',
      text: 'The regulator arcs through Christos! He suffers 5 damage.',
    },
    success: {
      assetId: 'current-loom-success',
      firstVisitText:
        'All five pillars settle at one strength. The earth beneath them grows still.',
      revisitText: 'The Ashen Reach regulator remains in equilibrium.',
      returnLabel: 'Return to the Night Land',
    },
  },
} satisfies CurrentLoomEncounterContent

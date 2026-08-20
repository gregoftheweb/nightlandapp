import type { WordGridEncounterContent } from '../content'

const PERSIUS_SCROLL_TEXT = `Christos,

Return to the Redoubt. Do not follow me. Do not hinder me!

I can free mankind from this horror of the black night and all the dark evils.

Do not stop me in my quest.

I go now in search of the Tesseract, the device of the ancient science-wizards.

I must.

— Persius`

export const wordTileCrypt01Content = {
  instanceId: 'word-tile-crypt-01',
  shapeId: 'word-grid',
  metadata: {
    title: 'Tesseract',
    description:
      'An ancient circle of black stone, steeped in a will that is not its own. Those who seek to command its power gain forbidden knowledge… or vanish without even the mercy of death.',
    entrance: {
      shortName: 'tesseract',
      category: 'building',
      assetId: 'tesseract-entrance',
      footprint: { width: 6, height: 6 },
      initialActive: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Investigate',
      requiresPlayerOnObject: true,
    },
  },
  content: {
    assetId: 'word-grid-board-blank',
    gridRect: { xPct: 0.095, yPct: 0.11, widthPct: 0.805, heightPct: 0.76 },
    rows: 5,
    columns: 5,
    gapPct: 0.005,
    letters: [
      ['Z', 'T', 'V', 'A', 'N'],
      ['L', 'G', 'R', 'E', 'Y'],
      ['W', 'P', 'S', 'T', 'H'],
      ['D', 'I', 'T', 'O', 'M'],
      ['E', 'C', 'H', 'R', 'S'],
    ],
    targetSequence: 'TESSERACT',
  },
  lifecycle: {
    completion: { event: 'success-confirmed', idempotent: true },
    failure: {
      exit: 'death',
      message: 'Christos failed to guess the right word.',
      killerName: 'Ancient Evil',
      suppressDeathDialog: true,
      deathRoute: '/death',
    },
    waypoint: { createsWaypoint: false },
    revisit: 'success-screen',
    progress: { mode: 'local-only' },
    reward: {
      kind: 'item',
      id: 'persius-scroll',
      grantEvent: 'success-screen-entered',
      idempotent: true,
    },
    returnToRpg: { signalRpgResume: true, exitSubGame: true },
  },
  presentation: {
    intro: {
      assetId: 'tesseract-intro',
      leaveLabel: 'Leave without exploring.',
      startLabel: 'Explore the stone ruin.',
    },
    puzzle: {
      leaveLabel: 'Leave the stone courtyard',
      tapFeedback: {
        selectionFadeMs: 2000,
        selectedBorderWidth: 3,
        selectedBorderColor: '#20e878',
        inactiveOverlayColor: 'rgba(0, 0, 0, 0.5)',
        circleSize: 36,
        circleColor: 'rgba(32, 232, 120, 0.55)',
      },
    },
    failure: {
      assetId: 'tesseract-failure',
      text: "Christos fails to guess the right word.\n\nA Great Power, a malevolent force of ancient evil rises from the earth to consume Christos' soul in black fire.",
      actionLabel: "Christos' doom awaits.",
      foregroundFit: 'cover',
    },
    success: {
      assetId: 'tesseract-success',
      firstVisitText:
        'Christos successfully spelled TESSERACT.\n\nA scroll appears at his feet. It is a message from Persius.',
      revisitText:
        'The stone ruins are silent. The tesseract puzzle has already been solved.\n\nThe scroll from Persius is in your inventory.',
      readRewardLabel: 'read the scroll',
      returnLabel: 'return to the Night Land',
      rewardModalTitle: 'Message from Persius',
      rewardModalText: PERSIUS_SCROLL_TEXT,
      rewardModalCloseLabel: 'Close',
    },
  },
} satisfies WordGridEncounterContent

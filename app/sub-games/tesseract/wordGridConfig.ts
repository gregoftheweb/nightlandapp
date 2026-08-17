import type { WordGridConfig } from '../_shared/word-grid'

const PERSIUS_SCROLL_TEXT = `Christos,

Return to the Redoubt. Do not follow me. Do not hinder me!

I can free mankind from this horror of the black night and all the dark evils.

Do not stop me in my quest.

I go now in search of the Tesseract, the device of the ancient science-wizards.

I must.

— Persius`

export const tesseractWordGridConfig = {
  id: 'tesseract',
  shape: 'word-grid',
  entryRoute: '/sub-games/tesseract/main',
  completion: {
    event: 'Player presses return to the Night Land on the success screen',
    idempotent: true,
  },
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
    grantEvent: 'First entry to the success screen',
    idempotent: true,
  },
  returnToRpg: { signalRpgResume: true, exitSubGame: true },
  boardAsset: require('@assets/images/backgrounds/subgames/tesseract-puzzle-board.webp'),
  intrinsicSize: { width: 1024, height: 972 },
  gridRect: { left: 0.095, top: 0.11, right: 0.9, bottom: 0.87 },
  rows: 5,
  columns: 5,
  gap: 0.005,
  letters: [
    ['Z', 'T', 'V', 'A', 'N'],
    ['L', 'G', 'R', 'E', 'Y'],
    ['W', 'P', 'S', 'T', 'H'],
    ['D', '<', 'T', 'O', 'M'],
    ['E', 'C', 'H', 'R', 'S'],
  ],
  targetSequence: ['T', 'E', 'S', 'S', 'E', 'R', 'A', 'C', 'T'],
  puzzleRoute: '/sub-games/tesseract/screen2',
  tapFeedback: {
    selectionFadeMs: 2000,
    selectedBorderWidth: 3,
    selectedBorderColor: '#00ff00',
    inactiveOverlayColor: 'rgba(0, 0, 0, 0.5)',
    circleSize: 36,
    circleColor: 'rgba(0, 255, 0, 0.5)',
  },
  wrongInputOutcome: { route: '/sub-games/tesseract/screen3', delayMs: 500 },
  successOutcome: { route: '/sub-games/tesseract/screen4', delayMs: 500 },
  presentation: {
    intro: {
      backgroundAsset: require('@assets/images/backgrounds/subgames/tesseract/tesseract-screen1.webp'),
      leaveLabel: 'Leave without exploring.',
      startLabel: 'Explore the stone ruin.',
    },
    puzzle: { leaveLabel: 'Leave the stone courtyard' },
    failure: {
      backgroundAsset: require('@assets/images/backgrounds/subgames/tesseract/tesseract-screen3.webp'),
      text: "Christos fails to guess the right word.\n\nA Great Power, a malevolent force of ancient evil rises from the earth to consume Christos' soul in black fire.",
      actionLabel: "Christos' doom awaits.",
      foregroundFit: 'cover',
    },
    success: {
      backgroundAsset: require('@assets/images/backgrounds/subgames/tesseract/tesseract-screen4.webp'),
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
} satisfies WordGridConfig

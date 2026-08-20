import type { WordGridEncounterContent } from '../content'
import { SALAMANDER_LETTER_TEXT } from '@config/objects'

export const wordTileCrypt02Content = {
  instanceId: 'word-tile-crypt-02',
  shapeId: 'word-grid',
  metadata: {
    title: "The Salamander's Cipher",
    description:
      'A weathered ring of science-stone hums beneath the darkness. Its letters shift around the sigil of a fire-born maker whose warning has waited through uncounted years.',
    entrance: {
      shortName: 'tesseract',
      category: 'building',
      assetId: 'tesseract-entrance',
      footprint: { width: 6, height: 6 },
      initialActive: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Examine the cipher',
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
      ['Q', 'A', 'V', 'N', 'F'],
      ['M', 'X', 'E', 'B', 'A'],
      ['U', 'L', 'C', 'Y', 'R'],
      ['A', 'H', 'D', 'J', 'P'],
      ['G', 'S', 'O', 'A', 'K'],
    ],
    targetSequence: 'SALAMANDER',
  },
  lifecycle: {
    completion: { event: 'success-confirmed', idempotent: true },
    failure: {
      exit: 'death',
      message: 'Christos failed to spell SALAMANDER.',
      killerName: 'Ancient Evil',
      suppressDeathDialog: true,
      deathRoute: '/death',
    },
    waypoint: { createsWaypoint: false },
    revisit: 'success-screen',
    progress: { mode: 'local-only' },
    reward: {
      kind: 'item',
      id: 'salamander-letter',
      grantEvent: 'success-screen-entered',
      idempotent: true,
    },
    returnToRpg: { signalRpgResume: true, exitSubGame: true },
  },
  presentation: {
    intro: {
      assetId: 'tesseract-intro',
      leaveLabel: 'Leave the silent ring.',
      startLabel: 'Touch the shifting letters.',
    },
    puzzle: {
      leaveLabel: 'Withdraw from the cipher',
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
      text: 'Christos fails to spell SALAMANDER.\n\nThe buried intelligence wakes beneath the stones, and an ancient evil consumes his soul in black fire.',
      actionLabel: "Christos' doom awaits.",
      foregroundFit: 'cover',
    },
    success: {
      assetId: 'tesseract-success',
      firstVisitText:
        'Christos successfully spelled SALAMANDER.\n\nA sealed letter rises from a hollow beneath the stones, bearing the mark of the Science-Wizard who wrought the golden orb.',
      revisitText:
        "The cipher's ember-light has gone still. The Salamander's letter is already in your keeping.",
      readRewardLabel: "read the Salamander's letter",
      returnLabel: 'return to the Night Land',
      rewardModalTitle: "The Salamander's Letter",
      rewardModalText: SALAMANDER_LETTER_TEXT,
      rewardModalCloseLabel: 'Close',
    },
  },
} satisfies WordGridEncounterContent

import type { WordGridEncounterContent } from '../content'

export const VALID_WORD_GRID_CONTENT: WordGridEncounterContent = {
  instanceId: 'fixture-grid-01',
  shapeId: 'word-grid',
  metadata: {
    title: 'Fixture Grid',
    description: 'A valid word-grid fixture.',
    entranceAssetId: 'entrance',
    entranceFootprint: { width: 4, height: 4 },
    ctaLabel: 'Investigate',
  },
  content: {
    assetId: 'board',
    gridRect: { xPct: 0.1, yPct: 0.1, widthPct: 0.8, heightPct: 0.8 },
    rows: 2,
    columns: 3,
    gapPct: 0.01,
    letters: [
      ['N', 'I', 'G'],
      ['H', 'T', 'X'],
    ],
    targetSequence: 'NIGHT',
  },
  lifecycle: {
    completion: { event: 'success-confirmed', idempotent: true },
    failure: {
      exit: 'death',
      message: 'The fixture prevailed.',
      killerName: 'Fixture Horror',
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
    intro: { assetId: 'intro', leaveLabel: 'Leave', startLabel: 'Begin' },
    puzzle: {
      leaveLabel: 'Retreat',
      tapFeedback: {
        selectionFadeMs: 500,
        selectedBorderWidth: 2,
        selectedBorderColor: '#0f0',
        inactiveOverlayColor: 'rgba(0,0,0,0.5)',
        circleSize: 36,
        circleColor: '#0f0',
      },
    },
    failure: {
      assetId: 'failure',
      text: 'Failure',
      actionLabel: 'Accept doom',
      foregroundFit: 'cover',
    },
    success: {
      assetId: 'success',
      firstVisitText: 'First success',
      revisitText: 'Return success',
      readRewardLabel: 'Read',
      returnLabel: 'Return',
      rewardModalTitle: 'Reward',
      rewardModalText: 'A message.',
      rewardModalCloseLabel: 'Close',
    },
  },
}

export function cloneContent(): Record<string, any> {
  return JSON.parse(JSON.stringify(VALID_WORD_GRID_CONTENT))
}

const mutate =
  (change: (content: Record<string, any>) => void): (() => unknown) =>
  () => {
    const content = cloneContent()
    change(content)
    return content
  }

export const invalidContentFixtures: Record<string, { expectedCode: string; make: () => unknown }> =
  {
    mismatchedRows: {
      expectedCode: 'invalid-grid-dimensions',
      make: mutate((entry) => (entry.content.rows = 3)),
    },
    mismatchedColumns: {
      expectedCode: 'invalid-grid-dimensions',
      make: mutate((entry) => (entry.content.columns = 4)),
    },
    invalidCell: {
      expectedCode: 'invalid-grid-letter',
      make: mutate((entry) => (entry.content.letters[0][0] = '<')),
    },
    invalidGridRect: {
      expectedCode: 'invalid-grid-rect',
      make: mutate((entry) => (entry.content.gridRect.widthPct = 2)),
    },
    emptyTarget: {
      expectedCode: 'empty-target-sequence',
      make: mutate((entry) => (entry.content.targetSequence = '')),
    },
    invalidTargetCharacters: {
      expectedCode: 'invalid-target-sequence',
      make: mutate((entry) => (entry.content.targetSequence = 'Night!')),
    },
    insufficientDistinctLetters: {
      expectedCode: 'unsolvable-target',
      make: mutate((entry) => (entry.content.targetSequence = 'NII')),
    },
    unknownBoardAsset: {
      expectedCode: 'unknown-asset-id',
      make: mutate((entry) => (entry.content.assetId = 'missing')),
    },
    unknownEntranceAsset: {
      expectedCode: 'unknown-asset-id',
      make: mutate((entry) => (entry.metadata.entranceAssetId = 'missing')),
    },
    unknownPresentationAsset: {
      expectedCode: 'unknown-asset-id',
      make: mutate((entry) => (entry.presentation.success.assetId = 'missing')),
    },
    invalidEntranceFootprint: {
      expectedCode: 'invalid-entrance-footprint',
      make: mutate((entry) => (entry.metadata.entranceFootprint.width = 0)),
    },
    missingLifecycleField: {
      expectedCode: 'missing-lifecycle-field',
      make: mutate((entry) => delete entry.lifecycle.failure),
    },
    wrongCompletionTrigger: {
      expectedCode: 'invalid-completion-trigger',
      make: mutate((entry) => (entry.lifecycle.completion.event = 'screen-mounted')),
    },
    wrongSaveKey: {
      expectedCode: 'invalid-save-key',
      make: mutate((entry) => {
        entry.lifecycle.progress = {
          mode: 'async-storage',
          saveKey: 'copied-key',
          version: 1,
          clearOnCompletion: true,
        }
      }),
    },
    unknownReward: {
      expectedCode: 'unknown-reward-id',
      make: mutate((entry) => (entry.lifecycle.reward.id = 'missing-item')),
    },
    unsupportedRewardKind: {
      expectedCode: 'unsupported-reward-kind',
      make: mutate((entry) => (entry.lifecycle.reward.kind = 'currency')),
    },
    invalidRows: {
      expectedCode: 'invalid-grid-size',
      make: mutate((entry) => (entry.content.rows = 0)),
    },
    invalidColumns: {
      expectedCode: 'invalid-grid-size',
      make: mutate((entry) => (entry.content.columns = 1.5)),
    },
    invalidGap: {
      expectedCode: 'invalid-gap',
      make: mutate((entry) => (entry.content.gapPct = -1)),
    },
    emptyTitle: {
      expectedCode: 'invalid-metadata-title',
      make: mutate((entry) => (entry.metadata.title = ' ')),
    },
    emptyDescription: {
      expectedCode: 'invalid-metadata-description',
      make: mutate((entry) => (entry.metadata.description = '')),
    },
    invalidShape: {
      expectedCode: 'unknown-shape-id',
      make: mutate((entry) => (entry.shapeId = 'dialogue')),
    },
    invalidInstanceId: {
      expectedCode: 'invalid-instance-id',
      make: mutate((entry) => (entry.instanceId = 'Bad ID')),
    },
    missingPresentationField: {
      expectedCode: 'missing-presentation-field',
      make: mutate((entry) => delete entry.presentation.failure),
    },
  }

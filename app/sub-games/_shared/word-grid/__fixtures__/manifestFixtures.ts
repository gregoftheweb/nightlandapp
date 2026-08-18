import type { EncounterManifest, WordGridManifestEntry } from '../manifestTypes'

export const VALID_WORD_GRID_ENTRY: WordGridManifestEntry = {
  instanceId: 'fixture-grid-01',
  shapeId: 'word-grid',
  placementPolicy: 'generated',
  metadata: {
    title: 'Fixture Grid',
    description: 'A valid word-grid fixture.',
    entranceAssetId: 'entrance',
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

export const VALID_WORD_GRID_MANIFEST: EncounterManifest = {
  manifestId: 'fixture-word-grids',
  version: 1,
  instances: [VALID_WORD_GRID_ENTRY],
}

export function cloneManifest(): Record<string, any> {
  return JSON.parse(JSON.stringify(VALID_WORD_GRID_MANIFEST))
}

export const invalidManifestFixtures: Record<
  string,
  { expectedCode: string; make: () => unknown }
> = {
  mismatchedRows: {
    expectedCode: 'invalid-grid-dimensions',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.rows = 3
      return manifest
    },
  },
  mismatchedColumns: {
    expectedCode: 'invalid-grid-dimensions',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.columns = 4
      return manifest
    },
  },
  invalidCell: {
    expectedCode: 'invalid-grid-letter',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.letters[0][0] = '<'
      return manifest
    },
  },
  invalidGridRect: {
    expectedCode: 'invalid-grid-rect',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.gridRect.widthPct = 2
      return manifest
    },
  },
  emptyTarget: {
    expectedCode: 'empty-target-sequence',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.targetSequence = ''
      return manifest
    },
  },
  invalidTargetCharacters: {
    expectedCode: 'invalid-target-sequence',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.targetSequence = 'Night!'
      return manifest
    },
  },
  insufficientDistinctLetters: {
    expectedCode: 'unsolvable-target',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.targetSequence = 'NII'
      return manifest
    },
  },
  unknownBoardAsset: {
    expectedCode: 'unknown-asset-id',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.assetId = 'missing'
      return manifest
    },
  },
  unknownEntranceAsset: {
    expectedCode: 'unknown-asset-id',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].metadata.entranceAssetId = 'missing'
      return manifest
    },
  },
  unknownPresentationAsset: {
    expectedCode: 'unknown-asset-id',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].presentation.success.assetId = 'missing'
      return manifest
    },
  },
  missingLifecycleField: {
    expectedCode: 'missing-lifecycle-field',
    make: () => {
      const manifest = cloneManifest()
      delete manifest.instances[0].lifecycle.failure
      return manifest
    },
  },
  wrongCompletionTrigger: {
    expectedCode: 'invalid-completion-trigger',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].lifecycle.completion.event = 'screen-mounted'
      return manifest
    },
  },
  wrongSaveKey: {
    expectedCode: 'invalid-save-key',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].lifecycle.progress = {
        mode: 'async-storage',
        saveKey: 'copied-key',
        version: 1,
        clearOnCompletion: true,
      }
      return manifest
    },
  },
  unknownReward: {
    expectedCode: 'unknown-reward-id',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].lifecycle.reward.id = 'missing-item'
      return manifest
    },
  },
  unsupportedRewardKind: {
    expectedCode: 'unsupported-reward-kind',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].lifecycle.reward.kind = 'currency'
      return manifest
    },
  },
  duplicateInstanceId: {
    expectedCode: 'duplicate-instance-id',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances.push(JSON.parse(JSON.stringify(manifest.instances[0])))
      return manifest
    },
  },
  hardcodedCollision: {
    expectedCode: 'hardcoded-instance-collision',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].instanceId = 'jaunt-cave'
      return manifest
    },
  },
  invalidPlacementPolicy: {
    expectedCode: 'invalid-placement-policy',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].placementPolicy = 'sometimes'
      return manifest
    },
  },
  missingFixedPlacement: {
    expectedCode: 'missing-fixed-placement',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].placementPolicy = 'fixed'
      return manifest
    },
  },
  generatedHasFixedPlacement: {
    expectedCode: 'generated-instance-has-fixed-placement',
    make: cloneManifest,
  },
  emptyManifest: {
    expectedCode: 'empty-manifest',
    make: () => ({ manifestId: 'empty', version: 1, instances: [] }),
  },
  invalidVersion: {
    expectedCode: 'invalid-manifest-version',
    make: () => ({ ...cloneManifest(), version: 0 }),
  },
  invalidRows: {
    expectedCode: 'invalid-grid-size',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.rows = 0
      return manifest
    },
  },
  invalidColumns: {
    expectedCode: 'invalid-grid-size',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.columns = 1.5
      return manifest
    },
  },
  invalidGap: {
    expectedCode: 'invalid-gap',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].content.gapPct = -1
      return manifest
    },
  },
  emptyTitle: {
    expectedCode: 'invalid-metadata-title',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].metadata.title = ' '
      return manifest
    },
  },
  emptyDescription: {
    expectedCode: 'invalid-metadata-description',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].metadata.description = ''
      return manifest
    },
  },
  invalidShape: {
    expectedCode: 'unknown-shape-id',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].shapeId = 'dialogue'
      return manifest
    },
  },
  invalidInstanceId: {
    expectedCode: 'invalid-instance-id',
    make: () => {
      const manifest = cloneManifest()
      manifest.instances[0].instanceId = 'Bad ID'
      return manifest
    },
  },
  missingPresentationField: {
    expectedCode: 'missing-presentation-field',
    make: () => {
      const manifest = cloneManifest()
      delete manifest.instances[0].presentation.failure
      return manifest
    },
  },
}

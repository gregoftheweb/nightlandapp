import type { ImageSourcePropType } from 'react-native'

import type { EncounterPlacementPolicy } from '@config/types/encounters'
import type { SubGameLifecycleConfig } from '@config/types/subGames'

export interface EncounterManifest {
  manifestId: string
  version: number
  instances: WordGridManifestEntry[]
}

export type WordGridCompletionTrigger = 'success-confirmed'
export type WordGridRewardTrigger = 'success-screen-entered' | 'success-confirmed'

export interface WordGridLifecycleConfig extends Omit<
  SubGameLifecycleConfig,
  'completion' | 'reward'
> {
  completion: { event: WordGridCompletionTrigger; idempotent: true }
  reward:
    | { kind: 'none' }
    | {
        kind: 'item' | 'weapon' | 'effect' | 'ability'
        id: string
        grantEvent: WordGridRewardTrigger
        idempotent: true
      }
}

export interface WordGridManifestContent {
  assetId: string
  gridRect: { xPct: number; yPct: number; widthPct: number; heightPct: number }
  rows: number
  columns: number
  gapPct: number
  letters: string[][]
  targetSequence: string
}

export interface WordGridPresentationManifest {
  intro: { assetId: string; leaveLabel: string; startLabel: string }
  puzzle: {
    leaveLabel: string
    tapFeedback: {
      selectionFadeMs: number
      selectedBorderWidth: number
      selectedBorderColor: string
      inactiveOverlayColor: string
      circleSize: number
      circleColor: string
    }
  }
  failure: {
    assetId: string
    text: string
    actionLabel: string
    foregroundFit: 'full-width' | 'cover'
  }
  success: {
    assetId: string
    firstVisitText: string
    revisitText: string
    readRewardLabel: string
    returnLabel: string
    rewardModalTitle: string
    rewardModalText: string
    rewardModalCloseLabel: string
  }
}

export interface WordGridManifestEntry {
  instanceId: string
  shapeId: 'word-grid'
  placementPolicy: EncounterPlacementPolicy
  metadata: {
    title: string
    description: string
    entranceAssetId: string
    ctaLabel: string
  }
  content: WordGridManifestContent
  lifecycle: WordGridLifecycleConfig
  presentation: WordGridPresentationManifest
}

export interface WordGridAssetDefinition {
  image: ImageSourcePropType
  intrinsicSize: { width: number; height: number }
}

export interface WordGridAssetRegistration extends WordGridAssetDefinition {
  assetId: string
}

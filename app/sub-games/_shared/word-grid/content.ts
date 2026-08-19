import type { ImageSourcePropType } from 'react-native'

import type { EncounterEntranceContent } from '@config/types/encounters'
import type { SubGameLifecycleConfig } from '@config/types/subGames'

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

export interface WordGridContentDetails {
  assetId: string
  gridRect: { xPct: number; yPct: number; widthPct: number; heightPct: number }
  rows: number
  columns: number
  gapPct: number
  letters: string[][]
  /** Explicit display/input cells that can never appear in targetSequence. */
  nonTargetSymbols?: string[]
  targetSequence: string
}

export interface WordGridPresentationContent {
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

export interface WordGridEncounterContent {
  instanceId: string
  shapeId: 'word-grid'
  metadata: {
    title: string
    description: string
    entrance: EncounterEntranceContent
  }
  content: WordGridContentDetails
  lifecycle: WordGridLifecycleConfig
  presentation: WordGridPresentationContent
}

export interface WordGridAssetDefinition {
  image: ImageSourcePropType
  intrinsicSize: { width: number; height: number }
}

export interface WordGridAssetRegistration extends WordGridAssetDefinition {
  assetId: string
}

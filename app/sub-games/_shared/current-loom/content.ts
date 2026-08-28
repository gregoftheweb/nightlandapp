import type { ImageSourcePropType } from 'react-native'

import type { EncounterEntranceContent } from '@config/types/encounters'
import type { SubGameLifecycleConfig } from '@config/types/subGames'

export type CurrentLoomCompletionTrigger = 'success-confirmed'
export type CurrentLoomRewardTrigger = 'success-screen-entered' | 'success-confirmed'

export interface CurrentLoomLifecycleConfig extends Omit<
  SubGameLifecycleConfig,
  'completion' | 'reward'
> {
  completion: { event: CurrentLoomCompletionTrigger; idempotent: true }
  reward:
    | { kind: 'none' }
    | {
        kind: 'item' | 'weapon' | 'effect' | 'ability'
        id: string
        grantEvent: CurrentLoomRewardTrigger
        idempotent: true
      }
}

export interface CurrentLoomContentDetails {
  channelLabels: readonly [string, string, string, string, string]
}

export interface CurrentLoomPresentationContent {
  intro: { assetId: string; text: string; leaveLabel: string; startLabel: string }
  puzzle: {
    assetId: string
    instructionText: string
    leaveLabel: string
    holdLabel: string
  }
  hazard: { assetId: string; text: string }
  success: { assetId: string; firstVisitText: string; revisitText: string; returnLabel: string }
}

export interface CurrentLoomEncounterContent {
  instanceId: string
  shapeId: 'current-loom'
  metadata: { title: string; description: string; entrance: EncounterEntranceContent }
  content: CurrentLoomContentDetails
  lifecycle: CurrentLoomLifecycleConfig
  presentation: CurrentLoomPresentationContent
}

export interface CurrentLoomAssetDefinition {
  image: ImageSourcePropType
  intrinsicSize: { width: number; height: number }
}

export interface CurrentLoomAssetRegistration extends CurrentLoomAssetDefinition {
  assetId: string
}

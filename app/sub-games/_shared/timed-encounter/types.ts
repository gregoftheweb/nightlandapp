import type { ImageSourcePropType } from 'react-native'
import type { EncounterEntranceContent } from '@config/types/encounters'
import type { SubGameLifecycleConfig } from '@config/types/subGames'

export interface JauntCaveEncounterContent {
  instanceId: string
  shapeId: 'timed-encounter'
  metadata: { title: string; description: string; entrance: EncounterEntranceContent }
  daemon: { name: string; deathMessage: string; killerName: string }
  narrative: {
    rejectLabel: string
    enterLabel: string
    rockfallText: string
    rockfallContinueLabel: string
    victoryTitle: string
    victoryText: string
    rewardText: string
    revisitVictoryText: string
    revisitRewardText: string
    returnLabel: string
    defeatTitle: string
    defeatText: string
    defeatActionLabel: string
    aftermathText: string
  }
  presentation: {
    introAssetId: string
    battleAssetId: string
    victoryAssetId: string
    defeatAssetId: string
    aftermathAssetId: string
    daemonSpriteAssetIds: {
      resting: string
      prep1: string
      prep2: string
      landed: string
      attackLeft: string
      attackRight: string
    }
    prep1FizzleColor: string
    prep2FizzleColor: string
    vulnerableGlowColor: string
  }
  lifecycle: SubGameLifecycleConfig
}

export interface TimedEncounterConfig {
  instanceId: string
  title: string
  description: string
  daemon: JauntCaveEncounterContent['daemon']
  narrative: JauntCaveEncounterContent['narrative']
  presentation: {
    introBackground: ImageSourcePropType
    battleBackground: ImageSourcePropType
    victoryBackground: ImageSourcePropType
    defeatBackground: ImageSourcePropType
    aftermathBackground: ImageSourcePropType
    daemonSprites: Record<
      keyof JauntCaveEncounterContent['presentation']['daemonSpriteAssetIds'],
      ImageSourcePropType
    >
    prep1FizzleColor: string
    prep2FizzleColor: string
    vulnerableGlowColor: string
  }
}

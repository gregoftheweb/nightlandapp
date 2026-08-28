import type { ImageSourcePropType } from 'react-native'

export interface CurrentLoomConfig {
  instanceId: string
  channelLabels: readonly [string, string, string, string, string]
  puzzleRoute: string
  successRoute: string
  presentation: {
    intro: {
      backgroundAsset: ImageSourcePropType
      text: string
      leaveLabel: string
      startLabel: string
    }
    puzzle: {
      boardAsset: ImageSourcePropType
      instructionText: string
      leaveLabel: string
      holdLabel: string
    }
    hazard: { overlayAsset: ImageSourcePropType; text: string }
    success: {
      backgroundAsset: ImageSourcePropType
      firstVisitText: string
      revisitText: string
      returnLabel: string
    }
  }
}

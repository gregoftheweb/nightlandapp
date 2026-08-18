import type { ImageSourcePropType } from 'react-native'

export interface GridRect {
  left: number
  top: number
  right: number
  bottom: number
}

export interface WordGridTile {
  id: string
  row: number
  col: number
  letter: string
  left: number
  top: number
  right: number
  bottom: number
  leftPx?: number
  topPx?: number
  rightPx?: number
  bottomPx?: number
  widthPx?: number
  heightPx?: number
}

export interface WordGridPresentation {
  intro: {
    backgroundAsset: ImageSourcePropType
    leaveLabel: string
    startLabel: string
  }
  puzzle: {
    leaveLabel: string
  }
  failure: {
    backgroundAsset: ImageSourcePropType
    text: string
    actionLabel: string
    foregroundFit: 'full-width' | 'cover'
  }
  success: {
    backgroundAsset: ImageSourcePropType
    firstVisitText: string
    revisitText: string
    readRewardLabel: string
    returnLabel: string
    rewardModalTitle: string
    rewardModalText: string
    rewardModalCloseLabel: string
  }
}

export interface WordGridConfig {
  instanceId: string
  boardAsset: ImageSourcePropType
  intrinsicSize: { width: number; height: number }
  gridRect: GridRect
  rows: number
  columns: number
  gap: number
  letters: readonly (readonly string[])[]
  targetSequence: readonly string[]
  puzzleRoute: string
  tapFeedback: {
    selectionFadeMs: number
    selectedBorderWidth: number
    selectedBorderColor: string
    inactiveOverlayColor: string
    circleSize: number
    circleColor: string
  }
  wrongInputOutcome: {
    route: string
    delayMs: number
  }
  successOutcome: {
    route: string
    delayMs: number
  }
  presentation: WordGridPresentation
}

import { Image, type ImageSourcePropType } from 'react-native'

import { getSubGameDefinition } from '@config/subGames'
import type { ImagePreloadAsset } from '@config/types/imagePreload'
import { RAW_TIMED_ENCOUNTER_CONTENT } from '@/app/sub-games/_shared/timed-encounter/contentCatalog'
import { TIMED_ENCOUNTER_ASSETS } from '@/app/sub-games/_shared/timed-encounter/assetCatalog'
import type { JauntCaveEncounterContent } from '@/app/sub-games/_shared/timed-encounter/types'
import { RAW_WORD_GRID_CONTENT } from '@/app/sub-games/_shared/word-grid/contentCatalog'
import { WORD_GRID_ASSETS } from '@/app/sub-games/_shared/word-grid/assetCatalog'
import type { WordGridEncounterContent } from '@/app/sub-games/_shared/word-grid/content'

function dimensionsFor(source: ImageSourcePropType): { width: number; height: number } {
  const resolved = Image.resolveAssetSource(source)
  return {
    width: resolved?.width && resolved.width > 0 ? resolved.width : 1,
    height: resolved?.height && resolved.height > 0 ? resolved.height : 1,
  }
}

function timedEncounterAssetIds(content: JauntCaveEncounterContent): string[] {
  return [
    content.metadata.entrance.assetId,
    content.presentation.introAssetId,
    content.presentation.battleAssetId,
    content.presentation.victoryAssetId,
    content.presentation.defeatAssetId,
    content.presentation.aftermathAssetId,
    ...Object.values(content.presentation.daemonSpriteAssetIds),
  ]
}

function wordGridAssetIds(content: WordGridEncounterContent): string[] {
  return [
    content.content.assetId,
    content.metadata.entrance.assetId,
    content.presentation.intro.assetId,
    content.presentation.failure.assetId,
    content.presentation.success.assetId,
  ]
}

export function resolveSubGameImageAssets(instanceId: string): readonly ImagePreloadAsset[] {
  const timedContent = RAW_TIMED_ENCOUNTER_CONTENT[instanceId] as
    JauntCaveEncounterContent | undefined
  if (timedContent?.shapeId === 'timed-encounter') {
    return timedEncounterAssetIds(timedContent).map((id) => {
      const source = TIMED_ENCOUNTER_ASSETS[id]
      return { id, source, ...dimensionsFor(source) }
    })
  }

  const wordGridContent = RAW_WORD_GRID_CONTENT[instanceId] as WordGridEncounterContent | undefined
  if (wordGridContent?.shapeId === 'word-grid') {
    return wordGridAssetIds(wordGridContent).map((id) => {
      const definition = WORD_GRID_ASSETS[id]
      return { id, source: definition.image, ...definition.intrinsicSize }
    })
  }

  return getSubGameDefinition(instanceId).preloadAssets ?? []
}

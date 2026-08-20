import { buildParsedCatalog, buildRawCatalog } from '@config/contentCatalog'

import { VALID_WORD_GRID_CONTENT } from './__fixtures__/manifestFixtures'
import { createWordGridAssetCatalog, WORD_GRID_ASSETS } from './assetCatalog'
import { wordTileCrypt01Content } from './content/wordTileCrypt01'
import { wordTileCrypt02Content } from './content/wordTileCrypt02'
import { createWordGridShapeAdapter } from './manifestAdapter'

const fixtureAssetsResult = createWordGridAssetCatalog(
  ['board', 'entrance', 'intro', 'failure', 'success'].map((assetId, index) => ({
    assetId,
    image: index + 1,
    intrinsicSize: { width: 100, height: 80 },
  }))
)

if (!fixtureAssetsResult.success) {
  throw new Error('The temporary word-grid fixture asset catalog is invalid')
}

export const RAW_WORD_GRID_CONTENT = buildRawCatalog([
  {
    instanceId: VALID_WORD_GRID_CONTENT.instanceId,
    content: VALID_WORD_GRID_CONTENT,
  },
  {
    instanceId: wordTileCrypt01Content.instanceId,
    content: wordTileCrypt01Content,
  },
  {
    instanceId: wordTileCrypt02Content.instanceId,
    content: wordTileCrypt02Content,
  },
])

export const WORD_GRID_SHAPE_ADAPTER = createWordGridShapeAdapter({
  assets: Object.freeze({ ...WORD_GRID_ASSETS, ...fixtureAssetsResult.value }),
})

export const parsedWordGridContentResult = buildParsedCatalog(
  RAW_WORD_GRID_CONTENT,
  WORD_GRID_SHAPE_ADAPTER
)

export function resolveParsedWordGridEncounter(instanceId: string) {
  if (!parsedWordGridContentResult.success) {
    throw new Error('Parsed word-grid catalog is invalid')
  }
  const parsed = parsedWordGridContentResult.value[instanceId]
  if (!parsed) throw new Error(`Unknown word-grid encounter '${instanceId}'`)
  return parsed
}

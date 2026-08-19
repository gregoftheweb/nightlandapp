import { buildParsedCatalog, buildRawCatalog } from '@config/contentCatalog'

import { VALID_WORD_GRID_CONTENT } from './__fixtures__/manifestFixtures'
import { createWordGridAssetCatalog, WORD_GRID_ASSETS } from './assetCatalog'
import { tesseractCrypt01Content } from './content/tesseractCrypt01'
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

const RAW_WORD_GRID_CONTENT = buildRawCatalog([
  {
    instanceId: VALID_WORD_GRID_CONTENT.instanceId,
    content: VALID_WORD_GRID_CONTENT,
  },
  {
    instanceId: tesseractCrypt01Content.instanceId,
    content: tesseractCrypt01Content,
  },
])

export const parsedWordGridContentResult = buildParsedCatalog(
  RAW_WORD_GRID_CONTENT,
  createWordGridShapeAdapter({
    assets: Object.freeze({ ...WORD_GRID_ASSETS, ...fixtureAssetsResult.value }),
  })
)

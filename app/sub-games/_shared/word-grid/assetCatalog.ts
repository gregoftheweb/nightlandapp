import type { ValidationResult } from '@config/types/encounters'

import type { WordGridAssetDefinition, WordGridAssetRegistration } from './content'

export type WordGridAssetCatalog = Readonly<Record<string, WordGridAssetDefinition>>

export function createWordGridAssetCatalog(
  registrations: readonly WordGridAssetRegistration[]
): ValidationResult<WordGridAssetCatalog> {
  const catalog: Record<string, WordGridAssetDefinition> = {}
  const errors: { code: string; path: string; message: string }[] = []

  registrations.forEach(({ assetId, ...definition }, index) => {
    if (!assetId.trim()) {
      errors.push({
        code: 'invalid-asset-id',
        path: `assets[${index}].assetId`,
        message: 'Word-grid assetId must be a non-empty string',
      })
      return
    }
    if (catalog[assetId]) {
      errors.push({
        code: 'duplicate-asset-id',
        path: `assets[${index}].assetId`,
        message: `Duplicate word-grid assetId '${assetId}'`,
      })
      return
    }
    if (
      !Number.isFinite(definition.intrinsicSize.width) ||
      !Number.isFinite(definition.intrinsicSize.height) ||
      definition.intrinsicSize.width <= 0 ||
      definition.intrinsicSize.height <= 0
    ) {
      errors.push({
        code: 'invalid-asset-dimensions',
        path: `assets[${index}].intrinsicSize`,
        message: `Word-grid asset '${assetId}' must have positive intrinsic dimensions`,
      })
      return
    }
    catalog[assetId] = definition
  })

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, value: Object.freeze(catalog) }
}

const realAssetsResult = createWordGridAssetCatalog([
  {
    assetId: 'tesseract-board',
    image: require('@assets/images/backgrounds/subgames/tesseract-puzzle-board.webp'),
    // Preserve the calibrated coordinate space used by the current runtime config.
    intrinsicSize: { width: 1024, height: 972 },
  },
  {
    assetId: 'tesseract-entrance',
    image: require('@assets/images/sprites/buildings/tesseract-puzzle1.webp'),
    intrinsicSize: { width: 256, height: 384 },
  },
  {
    assetId: 'tesseract-intro',
    image: require('@assets/images/backgrounds/subgames/tesseract/tesseract-screen1.webp'),
    intrinsicSize: { width: 256, height: 384 },
  },
  {
    assetId: 'tesseract-failure',
    image: require('@assets/images/backgrounds/subgames/tesseract/tesseract-screen3.webp'),
    intrinsicSize: { width: 256, height: 384 },
  },
  {
    assetId: 'tesseract-success',
    image: require('@assets/images/backgrounds/subgames/tesseract/tesseract-screen4.webp'),
    intrinsicSize: { width: 256, height: 384 },
  },
])

if (!realAssetsResult.success) throw new Error('The bundled word-grid asset catalog is invalid')

export const WORD_GRID_ASSETS: WordGridAssetCatalog = realAssetsResult.value

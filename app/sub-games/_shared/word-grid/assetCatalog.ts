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

/** Real assets are intentionally added when Tesseract migrates to the manifest. */
export const WORD_GRID_ASSETS: WordGridAssetCatalog = Object.freeze({})

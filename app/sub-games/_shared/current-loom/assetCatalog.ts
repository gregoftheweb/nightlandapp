import type { ValidationResult } from '@config/types/encounters'

import type { CurrentLoomAssetDefinition, CurrentLoomAssetRegistration } from './content'

export type CurrentLoomAssetCatalog = Readonly<Record<string, CurrentLoomAssetDefinition>>

export function createCurrentLoomAssetCatalog(
  registrations: readonly CurrentLoomAssetRegistration[]
): ValidationResult<CurrentLoomAssetCatalog> {
  const catalog: Record<string, CurrentLoomAssetDefinition> = {}
  const errors: { code: string; path: string; message: string }[] = []

  registrations.forEach(({ assetId, ...definition }, index) => {
    if (!assetId.trim()) {
      errors.push({
        code: 'invalid-asset-id',
        path: `assets[${index}].assetId`,
        message: 'Current-Loom assetId must be a non-empty string',
      })
      return
    }
    if (catalog[assetId]) {
      errors.push({
        code: 'duplicate-asset-id',
        path: `assets[${index}].assetId`,
        message: `Duplicate Current-Loom assetId '${assetId}'`,
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
        message: `Current-Loom asset '${assetId}' must have positive intrinsic dimensions`,
      })
      return
    }
    catalog[assetId] = definition
  })

  return errors.length
    ? { success: false, errors }
    : { success: true, value: Object.freeze(catalog) }
}

// Four shared images are final; only the Current-Loom hazard still uses placeholder art.
const realAssetsResult = createCurrentLoomAssetCatalog([
  {
    assetId: 'current-loom-entrance',
    image: require('@assets/images/sprites/buildings/current-loom-entrance.webp'),
    intrinsicSize: { width: 400, height: 218 },
  },
  {
    assetId: 'current-loom-board',
    image: require('@assets/images/backgrounds/subgames/current-loom/current-loom-board.webp'),
    intrinsicSize: { width: 848, height: 1264 },
  },
  {
    assetId: 'current-loom-intro',
    image: require('@assets/images/backgrounds/subgames/current-loom/current-loom-doorway.webp'),
    intrinsicSize: { width: 848, height: 1264 },
  },
  {
    assetId: 'current-loom-hazard',
    image: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen6-spark.webp'),
    intrinsicSize: { width: 1024, height: 1535 },
  },
  {
    assetId: 'current-loom-success',
    image: require('@assets/images/backgrounds/subgames/current-loom/current-loom-success.webp'),
    intrinsicSize: { width: 848, height: 1264 },
  },
])

if (!realAssetsResult.success) throw new Error('The bundled Current-Loom asset catalog is invalid')

export const CURRENT_LOOM_ASSETS = realAssetsResult.value

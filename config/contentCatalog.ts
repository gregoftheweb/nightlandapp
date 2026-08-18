import type {
  EncounterShapeAdapter,
  ParsedEncounter,
  ValidationError,
  ValidationResult,
} from './types/encounters'

export type RawContentCatalog<TRaw> = Record<string, TRaw>

export type ParsedContentCatalog<TShapeConfig> = Readonly<
  Record<string, ParsedEncounter<TShapeConfig>>
>

export interface ContentRegistration<T> {
  instanceId: string
  content: T
}

export function buildRawCatalog<T>(
  registrations: readonly ContentRegistration<T>[]
): RawContentCatalog<T> {
  const catalog: RawContentCatalog<T> = {}

  for (const registration of registrations) {
    if (Object.prototype.hasOwnProperty.call(catalog, registration.instanceId)) {
      throw new Error(`Duplicate content registration for instanceId '${registration.instanceId}'`)
    }
    catalog[registration.instanceId] = registration.content
  }

  return Object.freeze(catalog)
}

function declaredInstanceId(entry: unknown): unknown {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return undefined
  return (entry as Record<string, unknown>).instanceId
}

export function buildParsedCatalog<TRaw, TShapeConfig>(
  raw: RawContentCatalog<TRaw>,
  adapter: EncounterShapeAdapter<TRaw, TShapeConfig>
): ValidationResult<ParsedContentCatalog<TShapeConfig>> {
  const errors: ValidationError[] = []
  const parsed: Record<string, ParsedEncounter<TShapeConfig>> = {}

  for (const [catalogKey, entry] of Object.entries(raw)) {
    const instanceId = declaredInstanceId(entry)
    if (catalogKey !== instanceId) {
      errors.push({
        code: 'catalog-key-instance-id-mismatch',
        path: `${catalogKey}.instanceId`,
        message: `Catalog key '${catalogKey}' must equal content instanceId '${String(instanceId)}'`,
      })
    }

    const result = adapter.parse(entry)
    if (result.success) {
      parsed[catalogKey] = result.value
    } else {
      errors.push(
        ...result.errors.map((error) => ({
          ...error,
          path: error.path ? `${catalogKey}.${error.path}` : catalogKey,
        }))
      )
    }
  }

  if (errors.length > 0) return { success: false, errors }
  return { success: true, value: Object.freeze(parsed) }
}

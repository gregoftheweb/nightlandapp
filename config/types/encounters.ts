import type { SubGameInstanceDefinition } from '../subGames'

export type RewardKind = 'item' | 'weapon' | 'effect' | 'ability'

export interface EncounterInstanceRoutes {
  entry: string
  success?: string
  aftermath?: string
}

export interface ParsedEncounter<TShapeConfig> {
  definition: SubGameInstanceDefinition
  shapeConfig: TShapeConfig
}

export interface ValidationError {
  code: string
  path: string
  message: string
}

export type ValidationResult<T> =
  { success: true; value: T } | { success: false; errors: ValidationError[] }

export interface EncounterShapeAdapter<TRawEntry, TShapeConfig> {
  shapeId: string
  parse(entry: TRawEntry): ValidationResult<ParsedEncounter<TShapeConfig>>
  routes(instanceId: string): EncounterInstanceRoutes
  validateRewardId(id: string, kind: RewardKind): boolean
}

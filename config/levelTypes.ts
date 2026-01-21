// config/levelTypes.ts
/**
 * Level-specific type definitions for improved type safety and documentation.
 *
 * This module provides:
 * - Strict level ID types to prevent typos
 * - Enum-like types for biomes, weather, music, lighting
 * - Spawn table IDs for reusable encounter groups
 */

import { Level } from './types'

/**
 * Strict level identifier type.
 * Update this union when adding new levels.
 */
export type LevelId = '1' | '2'

/**
 * Biome/theme preset identifiers.
 * Each biome bundles ambient light, weather, and music settings.
 */
export type BiomeId = 'dark_wastes' | 'watching_grounds' | 'cursed_forest' | 'ancient_ruins'

/**
 * Weather effect types.
 * null represents clear/no weather.
 */
export type WeatherEffect = 'clear' | 'mist' | 'ash_fall' | 'blood_rain' | null

/**
 * Lighting preset names for semantic clarity.
 */
export type LightingPreset = 'pitch_black' | 'very_dim' | 'dim' | 'moderate' | 'bright'

/**
 * Background music track identifiers.
 */
export type MusicTrackId = 'nightland_ambient' | 'watching_grounds' | 'combat_theme' | 'boss_theme'

/**
 * Spawn table identifiers for reusable monster encounter groups.
 * Spawn tables normalize common spawn configurations across levels.
 */
export type SpawnTableId =
  | 'wasteland_common'
  | 'wasteland_rare'
  | 'wasteland_boss'
  | 'grounds_common'
  | 'grounds_rare'

/**
 * Level configuration with stronger typing.
 * Extends base Level type with stricter ID and effect types.
 */
export interface LevelConfig extends Omit<Level, 'id' | 'weatherEffect' | 'backgroundMusic'> {
  id: LevelId
  biome?: BiomeId
  weatherEffect: WeatherEffect
  backgroundMusic: MusicTrackId
  lighting?: LightingPreset
}

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
  'wasteland_common' | 'wasteland_rare' | 'wasteland_boss' | 'grounds_common' | 'grounds_rare'

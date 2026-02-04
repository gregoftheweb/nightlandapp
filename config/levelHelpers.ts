// config/levelHelpers.ts
/**
 * Helper functions for level creation and validation.
 *
 * This module provides:
 * - Factory function for creating levels with smart defaults
 * - Spawn table loading utilities
 * - Runtime validation for level configurations
 */

import { Level, Position, LevelMonsterInstance, MonsterSpawnConfigV2 } from './types'
import { LevelId, BiomeId, SpawnTableId } from './levelTypes'
import { BIOME_PRESETS, SPAWN_TABLES, LEVEL_DEFAULTS } from './levelPresets'

/**
 * Create a level with smart defaults and optional biome preset.
 *
 * This factory function:
 * - Applies LEVEL_DEFAULTS for common properties
 * - Optionally applies biome preset settings
 * - Ensures required fields are present
 *
 * @param config Partial level configuration with required core fields
 * @returns Complete level configuration
 *
 * @example
 * ```typescript
 * const level = createLevel({
 *   id: "1",
 *   name: "Dark Wastes",
 *   boardSize: { width: 400, height: 400 },
 *   playerSpawn: { row: 200, col: 200 },
 *   biome: "dark_wastes",  // Auto-applies light, weather, music
 *   items: [...],
 *   monsters: loadSpawnTable("wasteland_common"),
 *   objects: [...],
 * });
 * ```
 */
export function createLevel(
  config: Partial<Level> & {
    id: LevelId
    name: string
    boardSize: { width: number; height: number }
    playerSpawn: Position
    biome?: BiomeId
  }
): Level {
  const biome = config.biome ? BIOME_PRESETS[config.biome] : undefined

  return {
    // Apply defaults first
    ...LEVEL_DEFAULTS,

    // Then apply provided config
    ...config,

    // Override with biome preset if specified
    ...(biome && {
      ambientLight: config.ambientLight ?? biome.ambientLight,
      weatherEffect: config.weatherEffect ?? biome.weatherEffect,
      backgroundMusic: config.backgroundMusic ?? biome.defaultMusic,
    }),

    // Ensure arrays exist (don't override if provided)
    items: config.items || [],
    monsters: config.monsters || [],
    objects: config.objects || [],
    nonCollisionObjects: config.nonCollisionObjects,
    greatPowers: config.greatPowers || [],
    completionConditions: config.completionConditions,
    spawnZones: config.spawnZones,
  } as Level
}

/**
 * Load monster instances from a predefined spawn table.
 *
 * This helper creates monster instances using the spawn configurations
 * defined in SPAWN_TABLES, promoting reuse and easier balancing.
 *
 * @param tableId Spawn table identifier
 * @param createMonsterFn Factory function for creating monster instances
 * @returns Array of configured monster instances
 *
 * @example
 * ```typescript
 * monsters: loadSpawnTable("wasteland_common", createMonsterInstance)
 * ```
 */
export function loadSpawnTable(
  tableId: SpawnTableId,
  createMonsterFn: (
    monsterShortName: string,
    spawnRate: number,
    maxInstances: number,
    position?: Position
  ) => LevelMonsterInstance
): LevelMonsterInstance[] {
  const configs = SPAWN_TABLES[tableId]
  return configs.map((cfg) =>
    createMonsterFn(cfg.monsterShortName, cfg.spawnRate, cfg.maxInstances)
  )
}

/**
 * Load V2 monster spawn configurations from a predefined spawn table.
 *
 * This helper creates MonsterSpawnConfigV2 entries using the spawn configurations
 * defined in SPAWN_TABLES, mapping monsterShortName to templateId.
 *
 * @param tableId Spawn table identifier
 * @returns Array of MonsterSpawnConfigV2 configurations
 *
 * @example
 * ```typescript
 * monsterSpawnConfigsV2: loadSpawnTableV2("wasteland_common")
 * ```
 */
export function loadSpawnTableV2(tableId: SpawnTableId): MonsterSpawnConfigV2[] {
  const configs = SPAWN_TABLES[tableId]
  return configs.map((cfg) => ({
    templateId: cfg.monsterShortName,
    spawnRate: cfg.spawnRate,
    maxInstances: cfg.maxInstances,
  }))
}

/**
 * Validate level configuration at build/load time.
 *
 * Performs sanity checks on level data:
 * - Player spawn is within board bounds
 * - Objects are within board bounds
 * - (Future) Check for position overlaps
 * - (Future) Validate template IDs exist
 *
 * Throws error if validation fails.
 *
 * @param level Level configuration to validate
 * @throws Error if validation fails
 */
export function validateLevel(level: Level): void {
  const { boardSize, playerSpawn, id } = level

  // Validate player spawn position
  if (playerSpawn.row < 0 || playerSpawn.row >= boardSize.height) {
    throw new Error(
      `Level ${id}: playerSpawn.row (${playerSpawn.row}) out of bounds [0, ${boardSize.height})`
    )
  }
  if (playerSpawn.col < 0 || playerSpawn.col >= boardSize.width) {
    throw new Error(
      `Level ${id}: playerSpawn.col (${playerSpawn.col}) out of bounds [0, ${boardSize.width})`
    )
  }

  // Validate objects are within bounds
  for (const obj of level.objects) {
    if (!obj.position) continue // Skip if position is undefined
    if (obj.position.row < 0 || obj.position.row >= boardSize.height) {
      throw new Error(`Level ${id}: Object ${obj.id} row position out of bounds`)
    }
    if (obj.position.col < 0 || obj.position.col >= boardSize.width) {
      throw new Error(`Level ${id}: Object ${obj.id} col position out of bounds`)
    }
  }

  // Future validations could include:
  // - Check for position overlaps between objects
  // - Validate that all template IDs reference existing templates
  // - Ensure completion conditions are achievable
  // - Verify spawn zones don't overlap with impassable objects
}

/**
 * Type-safe level retrieval.
 *
 * @param levels Level registry
 * @param id Level identifier
 * @returns Level configuration
 * @throws Error if level not found
 */
export function getLevel(levels: Record<LevelId, Level>, id: LevelId): Level {
  const level = levels[id]
  if (!level) {
    throw new Error(`Level ${id} not found in registry`)
  }
  return level
}

// config/levelHelpers.ts
/**
 * Helper functions for level creation and validation.
 *
 * This module provides:
 * - Factory function for creating levels with smart defaults
 * - Spawn table loading utilities
 * - Runtime validation for level configurations
 */

import {
  Level,
  Position,
  MonsterSpawnConfig,
  LevelObjectInstance,
  Item,
  NonCollisionObject,
  GreatPower,
  GreatPowerInstance,
} from './types'
import { LevelId, BiomeId, SpawnTableId } from './levelTypes'
import { BIOME_PRESETS, SPAWN_TABLES, LEVEL_DEFAULTS } from './levelPresets'
import {
  getBuildingTemplate,
  getWeaponTemplate,
  getConsumableTemplate,
  getCollectibleTemplate,
  getNonCollisionTemplate,
} from './objects'
import { getGreatPowerTemplate } from './monsters'
import { getSubGameDefinition, SubGameId } from './subGames'

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
 *   monsterSpawnConfigs: loadSpawnTable("wasteland_common"),
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
    objects: config.objects || [],
    nonCollisionObjects: config.nonCollisionObjects,
    greatPowers: config.greatPowers || [],
    completionConditions: config.completionConditions,
    spawnZones: config.spawnZones,
  } as Level
}

/**
 * Load monster spawn configurations from a predefined spawn table.
 *
 * This helper creates MonsterSpawnConfig entries using the spawn configurations
 * defined in SPAWN_TABLES, mapping monsterShortName to templateId.
 *
 * @param tableId Spawn table identifier
 * @returns Array of MonsterSpawnConfig configurations
 *
 * @example
 * ```typescript
 * monsterSpawnConfigs: loadSpawnTable("wasteland_common")
 * ```
 */
export function loadSpawnTable(tableId: SpawnTableId): MonsterSpawnConfig[] {
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
 * Returns the level to allow chaining/inline use.
 *
 * @param level Level configuration to validate
 * @returns The validated level (passthrough)
 * @throws Error if validation fails
 *
 * @example
 * ```typescript
 * export const level1: Level = validateLevel({
 *   id: "1",
 *   // ... level config
 * });
 * ```
 */
export function validateLevel(level: Level): Level {
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

  return level
}

/**
 * Create an object instance from a building template.
 *
 * This helper creates LevelObjectInstance entries with proper ID generation
 * and template property merging.
 *
 * @param templateShortName Building template short name
 * @param position Position on the board
 * @param overrides Optional property overrides
 * @returns Complete LevelObjectInstance
 *
 * @example
 * ```typescript
 * createObjectInstance('redoubt', { row: 390, col: 198 })
 * ```
 */
export function createObjectInstance(
  templateShortName: string,
  position: Position,
  overrides: Partial<LevelObjectInstance> = {}
): LevelObjectInstance {
  const template = getBuildingTemplate(templateShortName)
  if (!template) {
    throw new Error(`Building template ${templateShortName} not found`)
  }

  return {
    id: `${template.shortName}_${position.row}_${position.col}`,
    templateId: templateShortName,
    position,
    active: true,
    shortName: template.shortName,
    category: template.category,
    name: template.name,
    description: template.description,
    image: template.image,
    size: template.size || {
      width: template.width || 1,
      height: template.height || 1,
    },
    zIndex: template.zIndex,
    effects: template.effects,
    subGame: template.subGame,
    ...overrides,
  }
}

/**
 * Create a sub-game entrance instance from the sub-game registry.
 *
 * This helper creates LevelObjectInstance entries for sub-game entrances,
 * pulling entrance definitions from the sub-game registry and merging them
 * with the sub-game's title/description.
 *
 * @param subGameId Sub-game identifier (e.g., 'hermit-hollow')
 * @param position Position on the board
 * @param overrides Optional property overrides
 * @returns Complete LevelObjectInstance for the sub-game entrance
 *
 * @example
 * ```typescript
 * createSubGameEntranceInstance('hermit-hollow', { row: 385, col: 201 })
 * createSubGameEntranceInstance('tesseract', { row: 391, col: 186 })
 * ```
 */
export function createSubGameEntranceInstance(
  subGameId: SubGameId,
  position: Position,
  overrides: Partial<LevelObjectInstance> = {}
): LevelObjectInstance {
  const subGame = getSubGameDefinition(subGameId)
  if (!subGame.entrance) {
    throw new Error(`Sub-game ${subGameId} does not have an entrance definition`)
  }

  const entrance = subGame.entrance

  return {
    id: `${entrance.shortName}_${position.row}_${position.col}`,
    templateId: subGameId, // Use subGameId as templateId for easy lookup
    position,
    active: entrance.active,
    shortName: entrance.shortName,
    category: entrance.category,
    name: subGame.title, // Use title from sub-game definition
    description: subGame.description, // Use description from sub-game definition
    image: entrance.image,
    size: {
      width: entrance.width,
      height: entrance.height,
    },
    zIndex: entrance.zIndex,
    effects: entrance.effects,
    subGame: {
      subGameName: subGameId,
      ctaLabel: entrance.ctaLabel,
      requiresPlayerOnObject: entrance.requiresPlayerOnObject,
      subGameId: subGameId,
    },
    ...overrides,
  }
}

/**
 * Create an item instance from a template.
 *
 * This helper creates Item entries from weapon, consumable, or collectible templates
 * with proper type detection and property mapping.
 *
 * @param templateShortName Item template short name
 * @param position Position on the board
 * @param overrides Optional property overrides
 * @returns Complete Item
 *
 * @example
 * ```typescript
 * createItemInstance('healthPotion', { row: 395, col: 195 })
 * createItemInstance('ironSword', { row: 380, col: 200 })
 * ```
 */
export function createItemInstance(
  templateShortName: string,
  position: Position,
  overrides: Partial<Item> = {}
): Item {
  // Try weapon first, then consumable, then collectible
  let template = getWeaponTemplate(templateShortName)
  let itemType: 'weapon' | 'consumable' | 'collectible' = 'weapon'

  if (!template) {
    template = getConsumableTemplate(templateShortName)
    itemType = 'consumable'
  }

  if (!template) {
    template = getCollectibleTemplate(templateShortName)
    itemType = 'collectible'
  }

  if (!template) {
    throw new Error(`Item template ${templateShortName} not found`)
  }

  const baseItem: Item = {
    shortName: template.shortName,
    category: template.category,
    name: template.name,
    description: template.description,
    image: template.image,
    position,
    size: template.size || { width: 1, height: 1 },
    active: true,
    type: itemType,
    collectible: true,
    id: `${template.shortName}_${position.row}_${position.col}`,
    effects: template.effects,
  }

  // Add specific properties based on type
  if (itemType === 'weapon') {
    baseItem.weaponId = template.shortName
    baseItem.damage = template.damage
    baseItem.hitBonus = template.hitBonus
  } else if (itemType === 'consumable' && template.effects) {
    const healEffect = template.effects.find((e) => e.type === 'heal')
    if (healEffect) {
      baseItem.healAmount = healEffect.value
    }
  }

  return {
    ...baseItem,
    ...overrides,
  }
}

/**
 * Create a non-collision object instance from a template.
 *
 * This helper creates NonCollisionObject entries for decorative elements
 * like footsteps and environmental features.
 *
 * @param templateName NonCollision template name
 * @param position Position on the board
 * @param rotation Rotation angle in degrees
 * @param overrides Optional property overrides
 * @returns Complete NonCollisionObject
 *
 * @example
 * ```typescript
 * createNonCollisionObject('footsteps', { row: 391, col: 195 }, 290)
 * ```
 */
export function createNonCollisionObject(
  templateName: string,
  position: Position,
  rotation: number,
  overrides: Partial<NonCollisionObject> = {}
): NonCollisionObject {
  const template = getNonCollisionTemplate(templateName)
  if (!template) {
    throw new Error(`NonCollisionObject template ${templateName} not found`)
  }

  return {
    id: `${template.shortName}_${position.row}_${position.col}_${rotation}`,
    position,
    rotation,
    ...template,
    ...overrides,
  }
}

/**
 * Create a GreatPower instance for level configuration.
 *
 * This is a CONFIGURATION helper only - it creates the GreatPower object
 * for level definitions but does NOT perform runtime hydration.
 *
 * Note: This helper currently calls hydrateGreatPower to merge template
 * and instance data. In a pure config system, this hydration should happen
 * at runtime, not during config creation.
 *
 * @param shortName GreatPower template short name
 * @param position Position on the board
 * @param overrides Optional property overrides
 * @returns GreatPower configuration object
 *
 * @example
 * ```typescript
 * createGreatPowerInstance('watcher_se', { row: 380, col: 180 }, {
 *   currentHP: 1000,
 *   maxHP: 1000,
 * })
 * ```
 */
export function createGreatPowerInstance(
  shortName: string,
  position: Position,
  overrides: Partial<GreatPower> = {}
): GreatPower {
  const template = getGreatPowerTemplate(shortName)
  if (!template) {
    throw new Error(`GreatPower template ${shortName} not found`)
  }

  // For now, we still need to import and use hydration to maintain compatibility
  // TODO: Move hydration to runtime and make this a pure config builder
  const { hydrateGreatPower } = require('@modules/hydration')

  // Determine initial HP - support both legacy hp and currentHP in overrides
  const initialHP = overrides.currentHP ?? (overrides as any).hp ?? template.maxHP

  // Create instance with defaults
  const instance: GreatPowerInstance = {
    id: `${shortName}_${position.row}_${position.col}`,
    templateId: shortName,
    position,
    currentHP: initialHP,
    awakened: overrides.awakened ?? false,
  }

  // Hydrate to merge template + instance
  const hydrated = hydrateGreatPower(template, instance)

  // Extract overrides that should not be reapplied (currentHP and awakened come from the pipeline)
  const { currentHP, awakened, ...otherOverrides } = overrides

  // Return final GreatPower with template/instance values and remaining overrides
  return {
    ...hydrated,
    ...otherOverrides,
    id: instance.id,
    position: instance.position,
    currentHP: hydrated.currentHP,
    awakened: hydrated.awakened,
  }
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

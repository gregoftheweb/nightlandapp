//config/levels.ts
/**
 * Level configurations for the Nightland game.
 *
 * This module defines all game levels with their entities, objectives, and settings.
 * Uses helper functions and type-safe IDs for improved maintainability.
 */

import {
  REDOUBT_POSITION,
  PLAYER_START_POSITION,
  NORTHERN_TRAIL_DESTINATION,
  EXPEDITION_TRAIL_LENGTH,
  WATCHER_POSITIONS,
} from './worldLayout'
import { Level } from './types'
import { NIGHTLAND_TERRAIN } from './terrain'
import { LevelId } from './levelTypes'
import {
  loadSpawnTable,
  validateLevel,
  createObjectInstance,
  createItemInstance,
  createNonCollisionObject,
  createGreatPowerInstance,
} from './levelHelpers'

/**
 * Level registry with type-safe IDs.
 * All levels are validated on module load to catch configuration errors early.
 */
export const levels: Record<LevelId, Level> = {
  '1': validateLevel({
    // 1. id / name / description
    id: '1',
    name: 'The Dark Outer Wastes',
    description:
      'The only lands known by the Monstruwacans, all else is beyond they skill and ken.',

    // 2. boardSize
    boardSize: { width: 400, height: 400 },

    // 3. playerSpawn
    playerSpawn: PLAYER_START_POSITION,
    terrainRegions: NIGHTLAND_TERRAIN,
    trail: { destination: NORTHERN_TRAIL_DESTINATION, targetLength: EXPEDITION_TRAIL_LENGTH },

    // 4. environment (music, lighting, weather)
    ambientLight: 0.2,
    weatherEffect: null,
    backgroundMusic: 'nightland_ambient',

    // 5. progression (requiredLevel, rewards, etc.)
    turnsPerHitPoint: 5, // Christos heals 1 HP every 5 turns

    // 6. objects / items / nonCollisionObjects
    // ITEMS - Created from templates with specific positions
    items: [
      createItemInstance('healthPotion', { row: 203, col: 195 }),
      createItemInstance('ironSword', { row: 188, col: 200 }),
      createItemInstance('maguffinRock', { row: 198, col: 210 }),
    ],

    // OBJECTS - Buildings and structures (including pools)
    objects: [
      createObjectInstance('redoubt', REDOUBT_POSITION),
      createObjectInstance('healingPool', { row: 375, col: 20 }),
      createObjectInstance('poisonPool', { row: 250, col: 250 }),
      createObjectInstance('cursedTotem', { row: 385, col: 220 }),
    ],

    nonCollisionObjects: [
      createNonCollisionObject('river', { row: 340, col: 195 }, 0, {
        canTap: false,
        width: 22,
        height: 15,
        collisionMask: [
          { row: 0, col: 2, width: 1, height: 2 },
          { row: 2, col: 3, width: 2, height: 1 },
          { row: 3, col: 4, width: 1, height: 1 },
          { row: 2, col: 5, width: 6, height: 1 },
          { row: 1, col: 7, width: 2, height: 1 },
          { row: 3, col: 10, width: 1, height: 1 },
          { row: 4, col: 10, width: 3, height: 1 },
          { row: 5, col: 12, width: 3, height: 1 },
          { row: 6, col: 13, width: 2, height: 1 },
          { row: 7, col: 14, width: 3, height: 1 },
          { row: 8, col: 16, width: 3, height: 1 },
          { row: 9, col: 17, width: 2, height: 2 },
          { row: 11, col: 18, width: 1, height: 4 },
        ],
        collisionEffects: [
          {
            type: 'heal',
            value: 5,
            description: "The ancient river's waters restore your vitality.",
          },
          {
            type: 'hide',
          },
        ],
      }),
    ],

    // 7. greatPowers
    greatPowers: [
      createGreatPowerInstance('watcher_nw', WATCHER_POSITIONS.watcher_nw),
      createGreatPowerInstance('watcher_ne', WATCHER_POSITIONS.watcher_ne),
      createGreatPowerInstance('watcher_sw', WATCHER_POSITIONS.watcher_sw),
      createGreatPowerInstance('watcher_s', WATCHER_POSITIONS.watcher_s),
      {
        ...createGreatPowerInstance('watcher_se', WATCHER_POSITIONS.watcher_se, {
          currentHP: 1000,
          maxHP: 1000,
          attack: 50,
          ac: 25,
        }),
        // Preserve the existing Watcher's identity when moving its authored anchor.
        id: 'watcher_se_370_199',
      },
    ],

    // 8. spawn configs (monsterSpawnConfigs)
    monsterSpawnConfigs: loadSpawnTable('wasteland_common'),

    // 9. completionConditions
    completionConditions: [
      {
        type: 'reach_position',
        position: NORTHERN_TRAIL_DESTINATION,
        description: 'Follow the trail to the House of Silence approach',
      },
      {
        type: 'collect_item',
        itemId: 'ironSword',
        description: 'Find the iron sword',
      },
    ],
  }),

  '2': validateLevel({
    // 1. id / name / description
    id: '2',
    name: 'The Watching Grounds',
    description: 'Venture deeper into the Nightland where ancient eyes follow your every move.',

    // 2. boardSize
    boardSize: { width: 600, height: 500 },

    // 3. playerSpawn
    playerSpawn: { row: 490, col: 50 }, // Fixed: was 590, out of bounds for height 500

    // 4. environment (music, lighting, weather)
    ambientLight: 0.15,
    weatherEffect: 'mist',
    backgroundMusic: 'watching_grounds',

    // 5. progression (requiredLevel, rewards, etc.)
    requiredLevel: 2,
    recommendedLevel: 3,
    experienceReward: 250,
    turnsPerHitPoint: 5, // Christos heals 1 HP every 5 turns

    // 6. objects / items / nonCollisionObjects
    items: [],

    objects: [createObjectInstance('poisonPool', { row: 150, col: 150 })],

    // 7. greatPowers
    greatPowers: [],

    // 8. spawn configs (monsterSpawnConfigs)
    monsterSpawnConfigs: loadSpawnTable('grounds_common'),

    // 9. completionConditions
    completionConditions: [
      {
        type: 'defeat_all_monsters',
        description: 'Defeat all monsters in the area',
      },
      {
        type: 'reach_position',
        position: { row: 50, col: 550 },
        description: 'Reach the eastern exit',
      },
    ],
  }),
}

/**
 * Type-safe level retrieval function.
 * Prefer this over direct access to get compile-time ID validation.
 *
 * @param id Level identifier
 * @returns Level configuration
 *
 * @example
 * ```typescript
 * const level = getLevel("1");  // Type-safe
 * // const bad = getLevel("99"); // TypeScript error
 * ```
 */
export function getLevel(id: LevelId): Level {
  const level = levels[id]
  if (!level) {
    throw new Error(`Level ${id} not found in registry`)
  }
  return level
}

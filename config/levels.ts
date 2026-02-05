//config/levels.ts
/**
 * Level configurations for the Nightland game.
 *
 * This module defines all game levels with their entities, objectives, and settings.
 * Uses helper functions and type-safe IDs for improved maintainability.
 */

import {
  Level,
  Position,
  LevelObjectInstance,
  GreatPower,
  Item,
  NonCollisionObject,
  GreatPowerInstance,
} from './types'
import {
  getBuildingTemplate,
  getWeaponTemplate,
  getConsumableTemplate,
  getCollectibleTemplate,
  getNonCollisionTemplate,
} from './objects'
import { getGreatPowerTemplate } from './monsters'
import { LevelId } from './levelTypes'
import { loadSpawnTableV2, validateLevel } from './levelHelpers'
import { hydrateGreatPowerV2 } from '@/modules/hydration'

// Helper function to create object instances from building templates
const createObjectInstance = (
  templateShortName: string,
  position: Position,
  overrides: Partial<LevelObjectInstance> = {}
): LevelObjectInstance => {
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

// Helper function to create item instances from templates
export const createItemInstance = (
  templateShortName: string,
  position: Position,
  overrides: Partial<Item> = {}
): Item => {
  // Try weapon first, then consumable
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
  console.log('adding images:', baseItem.image)
  return {
    ...baseItem,
    ...overrides,
  }
}

const createNonCollisionObject = (
  templateName: string,
  position: Position,
  rotation: number,
  overrides: Partial<NonCollisionObject> = {}
): NonCollisionObject => {
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

// Helper function to create GreatPower instances for levels using V2 Template → Instance → Hydrated pipeline
const createGreatPowerForLevel = (
  shortName: string,
  position: Position,
  overrides: Partial<GreatPower> = {}
): GreatPower => {
  const template = getGreatPowerTemplate(shortName)
  if (!template) {
    throw new Error(`GreatPower template ${shortName} not found`)
  }

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
  const hydrated = hydrateGreatPowerV2(template, instance)

  // Extract overrides that should not be reapplied (currentHP and awakened come from the pipeline)
  const { currentHP, awakened, ...otherOverrides } = overrides
  
  // Return final GreatPower with template/instance values and remaining overrides
  // Order matters: otherOverrides can customize attack, ac, maxHP, etc. but
  // id, position, currentHP, and awakened are explicitly set from the pipeline
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
 * Level registry with type-safe IDs.
 * All levels are validated on module load to catch configuration errors early.
 */
export const levels: Record<LevelId, Level> = {
  '1': {
    id: '1',
    name: 'The Dark Outer Wastes',
    description:
      'The only lands known by the Monstruwacans, all else is beyond they skill and ken.',
    boardSize: { width: 400, height: 400 },
    playerSpawn: { row: 395, col: 200 },
    ambientLight: 0.2,
    weatherEffect: null,
    backgroundMusic: 'nightland_ambient',
    turnsPerHitPoint: 5, // Christos heals 1 HP every 5 turns

    // ITEMS - Created from templates with specific positions
    items: [
      createItemInstance('healthPotion', { row: 395, col: 195 }),
      createItemInstance('ironSword', { row: 380, col: 200 }),
      createItemInstance('maguffinRock', { row: 390, col: 210 }),
    ],

    // MONSTERS - Use V2 spawn table for spawn configurations
    monsterSpawnConfigsV2: loadSpawnTableV2('wasteland_common'),

    // OBJECTS - Buildings and structures (including pools)
    objects: [
      createObjectInstance('redoubt', { row: 390, col: 198 }),
      createObjectInstance('healingPool', { row: 375, col: 20 }),
      createObjectInstance('poisonPool', { row: 250, col: 250 }),
      createObjectInstance('cursedTotem', { row: 385, col: 220 }),
      createObjectInstance('hermit', { row: 385, col: 201 }),
      createObjectInstance('aeroWreckage', { row: 383, col: 192 }), //{ row: 364, col: 60 }),
      createObjectInstance('tesseract', { row: 391, col: 186 }), //{ row: 345, col: 20 })
    ],
    nonCollisionObjects: [
      // Start
      // Existing footsteps (moving west)
      createNonCollisionObject('footsteps', { row: 391, col: 195 }, 290),
      createNonCollisionObject('footsteps', { row: 385, col: 175 }, 280),
      createNonCollisionObject('footsteps', { row: 380, col: 155 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 135 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 115 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 95 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 75 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 55 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 35 }, 270),

      // First S-curve - continuing west then curving north and east
      createNonCollisionObject('footsteps', { row: 375, col: 25 }, 315), // curve NW
      createNonCollisionObject('footsteps', { row: 368, col: 20 }, 350), // heading north
      createNonCollisionObject('footsteps', { row: 360, col: 20 }, 0), // north
      createNonCollisionObject('footsteps', { row: 350, col: 22 }, 10), // curve NE
      createNonCollisionObject('footsteps', { row: 340, col: 30 }, 30), // heading NE
      createNonCollisionObject('footsteps', { row: 330, col: 45 }, 45), // continue NE
      createNonCollisionObject('footsteps', { row: 320, col: 65 }, 60), // more east
      createNonCollisionObject('footsteps', { row: 310, col: 90 }, 75), // heading east
      createNonCollisionObject('footsteps', { row: 305, col: 115 }, 85), // mostly east

      // Second S-curve - curving north then west
      createNonCollisionObject('footsteps', { row: 298, col: 140 }, 60), // curve NE
      createNonCollisionObject('footsteps', { row: 290, col: 160 }, 45), // heading NE
      createNonCollisionObject('footsteps', { row: 280, col: 175 }, 20), // more north
      createNonCollisionObject('footsteps', { row: 270, col: 185 }, 10), // mostly north
      createNonCollisionObject('footsteps', { row: 260, col: 190 }, 0), // straight north
      createNonCollisionObject('footsteps', { row: 250, col: 193 }, 350), // curve NW
      createNonCollisionObject('footsteps', { row: 240, col: 192 }, 330), // heading NW
      createNonCollisionObject('footsteps', { row: 230, col: 185 }, 315), // more west
      createNonCollisionObject('footsteps', { row: 220, col: 175 }, 300), // heading west
      createNonCollisionObject('footsteps', { row: 210, col: 160 }, 290), // mostly west

      // Final curve - heading back toward center-north
      createNonCollisionObject('footsteps', { row: 200, col: 150 }, 315), // curve NW
      createNonCollisionObject('footsteps', { row: 190, col: 145 }, 340), // heading north
      createNonCollisionObject('footsteps', { row: 180, col: 145 }, 0), // north
      createNonCollisionObject('footsteps', { row: 170, col: 148 }, 15), // curve NE
      createNonCollisionObject('footsteps', { row: 160, col: 155 }, 30), // heading NE
      createNonCollisionObject('footsteps', { row: 150, col: 165 }, 45), // more east
      createNonCollisionObject('footsteps', { row: 140, col: 175 }, 50), // continue NE
      createNonCollisionObject('footsteps', { row: 130, col: 182 }, 30), // more north
      createNonCollisionObject('footsteps', { row: 120, col: 187 }, 20), // heading north
      createNonCollisionObject('footsteps', { row: 110, col: 190 }, 10), // mostly north
      createNonCollisionObject('footsteps', { row: 100, col: 192 }, 5), // almost straight
      createNonCollisionObject('footsteps', { row: 90, col: 193 }, 5), // north
      createNonCollisionObject('footsteps', { row: 80, col: 194 }, 5), // north
      createNonCollisionObject('footsteps', { row: 70, col: 195 }, 5), // north
      createNonCollisionObject('footsteps', { row: 60, col: 196 }, 5), // north
      createNonCollisionObject('footsteps', { row: 50, col: 197 }, 5), // north
      createNonCollisionObject('footsteps', { row: 40, col: 198 }, 5), // north
      createNonCollisionObject('footsteps', { row: 30, col: 199 }, 5), // north
      createNonCollisionObject('footsteps', { row: 20, col: 200 }, 0), // final approach
      createNonCollisionObject('footsteps', { row: 10, col: 200 }, 0), // destination

      // Arriving near pool

      createNonCollisionObject('river', { row: 370, col: 195 }, 0, {
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

    // GREAT POWERS - Boss-level entities
    greatPowers: [
      createGreatPowerForLevel(
        'watcher_se',
        { row: 380, col: 180 },
        {
          currentHP: 1000,
          maxHP: 1000,
          attack: 50,
          ac: 25,
        }
      ),
    ],

    completionConditions: [
      {
        type: 'reach_position',
        position: { row: 10, col: 200 },
        description: 'Reach the northern border',
      },
      {
        type: 'collect_item',
        itemId: 'ironSword',
        description: 'Find the iron sword',
      },
    ],
  },

  '2': {
    id: '2',
    name: 'The Watching Grounds',
    description: 'Venture deeper into the Nightland where ancient eyes follow your every move.',
    boardSize: { width: 600, height: 500 },
    playerSpawn: { row: 490, col: 50 }, // Fixed: was 590, out of bounds for height 500
    requiredLevel: 2,
    recommendedLevel: 3,
    experienceReward: 250,
    ambientLight: 0.15,
    weatherEffect: 'mist',
    backgroundMusic: 'watching_grounds',
    turnsPerHitPoint: 5, // Christos heals 1 HP every 5 turns

    items: [],

    // MONSTERS - Use V2 spawn table for spawn configurations
    monsterSpawnConfigsV2: loadSpawnTableV2('grounds_common'),

    // OBJECTS - Buildings including pools
    objects: [createObjectInstance('poisonPool', { row: 150, col: 150 })],

    greatPowers: [],

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
  },
}

// Validate all levels at module load to catch configuration errors early
// Using forEach with array spread to avoid ES2017 Object.values requirement
;[levels['1'], levels['2']].forEach(validateLevel)

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

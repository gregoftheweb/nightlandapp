/**
 * Hydration module - Merges templates with instances to produce runtime entities
 * 
 * This module provides helper functions to combine static template definitions
 * with runtime instance data, producing "hydrated" entities ready for use in gameplay.
 */

import {
  GameObjectTemplate,
  MonsterTemplate,
  ObjectInstance,
  MonsterInstance,
  HydratedObject,
  HydratedMonster,
  Monster,
} from '@/config/types'

/**
 * Hydrate an object by merging a template with an instance
 * Instance-specific properties (position, rotation, zIndex, etc.) override template defaults
 * 
 * @param template - Static template definition
 * @param instance - Runtime instance data with position and overrides
 * @returns HydratedObject ready for runtime use
 */
export function hydrateObject(
  template: GameObjectTemplate,
  instance: ObjectInstance
): HydratedObject {
  return {
    // Spread template first (base definition)
    ...template,
    // Then instance properties (overrides)
    id: instance.id,
    templateId: instance.templateId,
    position: instance.position,
    active: true, // Default runtime state
    // Instance overrides take precedence
    rotation: instance.rotation ?? template.rotation,
    zIndex: instance.zIndex ?? template.zIndex,
    interactable: instance.interactable,
    interactionType: instance.interactionType,
    locked: instance.locked,
    keyRequired: instance.keyRequired,
  }
}

/**
 * Hydrate a monster by merging a template with an instance
 * Instance-specific properties (position, currentHP, spawned, etc.) override template defaults
 * 
 * @param template - Static monster template definition
 * @param instance - Runtime instance data with position and state
 * @returns HydratedMonster ready for runtime use
 */
export function hydrateMonster(
  template: MonsterTemplate,
  instance: MonsterInstance
): HydratedMonster {
  return {
    // Spread template first (base definition)
    ...template,
    // Then instance properties (state and overrides)
    id: instance.id,
    templateId: instance.templateId,
    position: instance.position,
    currentHP: instance.currentHP,
    spawned: instance.spawned,
    spawnZoneId: instance.spawnZoneId,
    // Instance overrides take precedence
    zIndex: instance.zIndex ?? template.zIndex,
  }
}

/**
 * Batch hydrate multiple objects
 * Useful for hydrating all objects in a level
 * 
 * @param templates - Map of template shortName -> template
 * @param instances - Array of object instances
 * @returns Array of hydrated objects
 */
export function hydrateObjects(
  templates: Map<string, GameObjectTemplate>,
  instances: ObjectInstance[]
): HydratedObject[] {
  return instances.map((instance) => {
    const template = templates.get(instance.templateId)
    if (!template) {
      throw new Error(`Template not found: ${instance.templateId}`)
    }
    return hydrateObject(template, instance)
  })
}

/**
 * Batch hydrate multiple monsters
 * Useful for hydrating all monsters in a level
 * 
 * @param templates - Map of template shortName -> template
 * @param instances - Array of monster instances
 * @returns Array of hydrated monsters
 */
export function hydrateMonsters(
  templates: Map<string, MonsterTemplate>,
  instances: MonsterInstance[]
): HydratedMonster[] {
  return instances.map((instance) => {
    const template = templates.get(instance.templateId)
    if (!template) {
      throw new Error(`Template not found: ${instance.templateId}`)
    }
    return hydrateMonster(template, instance)
  })
}

/**
 * Convert a HydratedMonster to Monster format for GameState compatibility
 * Maps currentHP to hp for backward compatibility with existing code
 * 
 * Note: The returned Monster has both 'hp' (current) and 'currentHP' (from hydrated)
 * because of the spread. This redundancy maintains compatibility with code expecting
 * monster.hp to be the current HP value.
 * 
 * @param hydrated - HydratedMonster from hydration
 * @returns Monster in legacy format
 */
export function hydratedMonsterToMonster(hydrated: HydratedMonster): Monster {
  return {
    // Core template properties
    shortName: hydrated.shortName,
    category: hydrated.category,
    name: hydrated.name,
    description: hydrated.description,
    image: hydrated.image,
    maxHP: hydrated.maxHP,
    attack: hydrated.attack,
    ac: hydrated.ac,
    initiative: hydrated.initiative,
    moveRate: hydrated.moveRate,
    soulKey: hydrated.soulKey,
    width: hydrated.width,
    height: hydrated.height,
    size: hydrated.size,
    effects: hydrated.effects,
    damage: hydrated.damage,
    hitBonus: hydrated.hitBonus,
    weaponType: hydrated.weaponType,
    range: hydrated.range,
    zIndex: hydrated.zIndex,
    // Runtime instance properties
    id: hydrated.id,
    position: hydrated.position,
    active: hydrated.active ?? true,
    hp: hydrated.currentHP, // Map currentHP to hp for compatibility
    uiSlot: hydrated.uiSlot,
    inCombatSlot: hydrated.inCombatSlot,
  }
}

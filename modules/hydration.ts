/**
 * Hydration module - Merges templates with instances to produce runtime entities
 * 
 * This module provides helper functions to combine static template definitions
 * with runtime instance data, producing "hydrated" entities ready for use in gameplay.
 */

import {
  GameObjectTemplate,
  ObjectInstance,
  HydratedObject,
  MonsterTemplate,
  MonsterInstance,
  Monster,
  GreatPowerTemplate,
  GreatPowerInstance,
  GreatPower,
  Position,
  Effect,
  WeaponType,
} from '@config/types'

import type { ImageSourcePropType } from 'react-native'

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

// ===== V2 Hydration Functions =====

/**
 * Hydrate a monster by merging a template with an instance
 * Instance-specific properties (position, currentHP, spawned, etc.) override template defaults
 * 
 * @param template - Static monster template definition
 * @param instance - Runtime instance data with position and state
 * @returns Monster ready for runtime use
 */
export function hydrateMonsterV2(
  template: MonsterTemplate,
  instance: MonsterInstance
): Monster {
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
    uiSlot: instance.uiSlot,
    inCombatSlot: instance.inCombatSlot,
    // Instance overrides take precedence
    zIndex: instance.zIndex ?? template.zIndex,
  }
}

/**
 * Hydrate a great power by merging a template with an instance
 * Instance-specific properties (position, currentHP, awakened) override template defaults
 * 
 * @param template - Static great power template definition
 * @param instance - Runtime instance data with position and state
 * @returns GreatPower ready for runtime use
 */
export function hydrateGreatPowerV2(
  template: GreatPowerTemplate,
  instance: GreatPowerInstance
): GreatPower {
  return {
    // Spread template first (base definition)
    ...template,
    // Then instance properties (state and overrides)
    id: instance.id,
    templateId: instance.templateId,
    position: instance.position,
    currentHP: instance.currentHP,
    awakened: instance.awakened,
    // Instance overrides take precedence
    zIndex: instance.zIndex ?? template.zIndex,
  }
}

/**
 * Batch hydrate multiple monsters
 * Useful for hydrating all monsters in a level
 * 
 * @param templates - Map of template shortName -> template
 * @param instances - Array of monster instances
 * @returns Array of hydrated monsters
 */
export function hydrateMonstersV2(
  templates: Map<string, MonsterTemplate>,
  instances: MonsterInstance[]
): Monster[] {
  return instances.map((instance) => {
    const template = templates.get(instance.templateId)
    if (!template) {
      throw new Error(`Template not found: ${instance.templateId}`)
    }
    return hydrateMonsterV2(template, instance)
  })
}

/**
 * Batch hydrate multiple great powers
 * Useful for hydrating all great powers in a level
 * 
 * @param templates - Map of template shortName -> template
 * @param instances - Array of great power instances
 * @returns Array of hydrated great powers
 */
export function hydrateGreatPowersV2(
  templates: Map<string, GreatPowerTemplate>,
  instances: GreatPowerInstance[]
): GreatPower[] {
  return instances.map((instance) => {
    const template = templates.get(instance.templateId)
    if (!template) {
      throw new Error(`Template not found: ${instance.templateId}`)
    }
    return hydrateGreatPowerV2(template, instance)
  })
}

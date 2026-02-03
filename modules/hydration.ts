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

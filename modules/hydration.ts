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
  Monster,
  MonsterTemplateV2,
  MonsterInstanceV2,
  HydratedMonsterV2,
  GreatPowerTemplateV2,
  GreatPowerInstanceV2,
  HydratedGreatPowerV2,
  Position,
  SoulKey,
  Effect,
  WeaponType,
} from '@/config/types'

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
 * Hydrate a monster using V2 types by merging a template with an instance
 * Instance-specific properties (position, currentHP, spawned, etc.) override template defaults
 * 
 * @param template - Static monster template definition (V2)
 * @param instance - Runtime instance data with position and state (V2)
 * @returns HydratedMonsterV2 ready for runtime use
 */
export function hydrateMonsterV2(
  template: MonsterTemplateV2,
  instance: MonsterInstanceV2
): HydratedMonsterV2 {
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
 * Hydrate a great power using V2 types by merging a template with an instance
 * Instance-specific properties (position, currentHP, awakened) override template defaults
 * 
 * @param template - Static great power template definition (V2)
 * @param instance - Runtime instance data with position and state (V2)
 * @returns HydratedGreatPowerV2 ready for runtime use
 */
export function hydrateGreatPowerV2(
  template: GreatPowerTemplateV2,
  instance: GreatPowerInstanceV2
): HydratedGreatPowerV2 {
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
 * Batch hydrate multiple monsters using V2 types
 * Useful for hydrating all monsters in a level
 * 
 * @param templates - Map of template shortName -> template (V2)
 * @param instances - Array of monster instances (V2)
 * @returns Array of hydrated monsters (V2)
 */
export function hydrateMonstersV2(
  templates: Map<string, MonsterTemplateV2>,
  instances: MonsterInstanceV2[]
): HydratedMonsterV2[] {
  return instances.map((instance) => {
    const template = templates.get(instance.templateId)
    if (!template) {
      throw new Error(`Template not found: ${instance.templateId}`)
    }
    return hydrateMonsterV2(template, instance)
  })
}

/**
 * Batch hydrate multiple great powers using V2 types
 * Useful for hydrating all great powers in a level
 * 
 * @param templates - Map of template shortName -> template (V2)
 * @param instances - Array of great power instances (V2)
 * @returns Array of hydrated great powers (V2)
 */
export function hydrateGreatPowersV2(
  templates: Map<string, GreatPowerTemplateV2>,
  instances: GreatPowerInstanceV2[]
): HydratedGreatPowerV2[] {
  return instances.map((instance) => {
    const template = templates.get(instance.templateId)
    if (!template) {
      throw new Error(`Template not found: ${instance.templateId}`)
    }
    return hydrateGreatPowerV2(template, instance)
  })
}

/**
 * Convert a HydratedMonsterV2 to Monster format for GameState compatibility
 * Maps currentHP to hp for backward compatibility with existing code
 * 
 * Normalization Guard: If currentHP is null/undefined, defaults to maxHP
 * This ensures runtime monsters always have valid hp values for combat.
 * 
 * @param hydrated - HydratedMonsterV2 from V2 hydration
 * @returns Monster in legacy format with guaranteed hp value
 */
export function hydratedMonsterV2ToMonster(hydrated: HydratedMonsterV2): Monster {
  // Normalization: ensure hp is never null/undefined
  const currentHP = hydrated.currentHP ?? hydrated.maxHP
  
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
    active: true, // Default runtime state
    hp: currentHP, // Normalized currentHP -> hp for compatibility
    uiSlot: hydrated.uiSlot,
    inCombatSlot: hydrated.inCombatSlot,
  }
}

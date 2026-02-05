// ===== HP Type Aliases =====
// Explicit type aliases for HP to standardize semantics across the codebase
export type MaxHP = number // Maximum hit points (template/design-time value)
export type CurrentHP = number // Current hit points at runtime (for V2 instances)

// ===== HP Helper Interfaces =====
// Helper interfaces for composing HP-related fields
export interface HasMaxHP {
  maxHP: MaxHP
}

export interface HasCurrentHP {
  currentHP: CurrentHP
}

export interface Position {
  row: number
  col: number
}

export interface Area {
  topLeft: Position
  bottomRight: Position
}

export type WeaponType = 'melee' | 'ranged'

export type InteractionType = 'door' | 'chest' | 'npc' | 'portal'

export type EffectTarget = 'self' | 'enemy' | 'ally' | 'area' | 'all'

/**
 * EntityKind - Discriminant for different entity types in the game
 * Used to identify what kind of thing an entity is at the type level
 */
export type EntityKind = 'object' | 'monster' | 'greatPower' | 'item' | 'nonCollision'

/**
 * Category union types - Provide type safety for known categories while allowing unknown values
 * Using union with string to avoid breaking existing code that may use custom categories
 */
export type ObjectCategory = 'building' | 'pool' | 'npc' | 'decoration' | 'portal' | 'door' | 'chest' | 'weapon' | 'consumable' | 'collectible' | string
export type MonsterCategory = 'regular' | 'elite' | 'boss' | string
export type GreatPowerCategory = 'greatPower' | 'boss' | string
export type ItemCategory = 'weapon' | 'consumable' | 'key' | 'collectible' | 'building' | string

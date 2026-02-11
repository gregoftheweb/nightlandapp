import { ImageSourcePropType } from 'react-native'
import { MaxHP, CurrentHP, Position, WeaponType, MonsterCategory, GreatPowerCategory } from './primitives'
import { EntityTemplate } from './entitiesBase'
import { Item } from './itemsAndObjects'
import { Effect } from './effects'

// ===== Template vs Instance Architecture for Monsters and Great Powers =====
// These types provide cleaner separation between static definitions and runtime state

/**
 * MonsterTemplate - Static definition of a monster type
 * Extends EntityTemplate with monster-specific combat and behavior fields
 * Contains only template/definition data, no runtime state or position
 */
export interface MonsterTemplate extends EntityTemplate<'monster', MonsterCategory> {
  maxHP: MaxHP
  attack: number
  ac: number
  initiative?: number
  moveRate: number
  spawnRate?: number
  maxInstances?: number
  width?: number
  height?: number
  effects?: Effect[]
  damage?: number
  hitBonus?: number
  weaponType?: WeaponType
  range?: number
}

/**
 * MonsterInstance - Runtime instance of a monster with position and state
 * Contains only runtime data and instance-specific overrides
 */
export interface MonsterInstance {
  id: string
  templateId: string // Reference to MonsterTemplate.shortName
  position: Position
  currentHP: CurrentHP
  spawned?: boolean
  spawnZoneId?: string
  uiSlot?: number
  inCombatSlot?: boolean
  // Instance-specific overrides
  zIndex?: number
}

/**
 * Monster - Merged shape of monster template + instance for runtime use (hydrated monster)
 * Contains all template data plus instance-specific state
 */
export interface Monster extends MonsterTemplate {
  id: string
  templateId: string
  position: Position
  currentHP: CurrentHP
  spawned?: boolean
  spawnZoneId?: string
  uiSlot?: number
  inCombatSlot?: boolean
}

/**
 * GreatPowerTemplate - Static definition of a Great Power
 * Extends EntityTemplate with great power-specific fields
 * Contains only template/definition data, no runtime state or position
 */
export interface GreatPowerTemplate extends EntityTemplate<'greatPower', GreatPowerCategory> {
  maxHP: MaxHP
  attack: number
  ac: number
  awakenCondition: string
  width?: number
  height?: number
  effects?: Effect[]
  damage?: number
  hitBonus?: number
  weaponType?: WeaponType
  range?: number
}

/**
 * GreatPowerInstance - Runtime instance of a Great Power with position and state
 * Contains only runtime data and instance-specific overrides
 */
export interface GreatPowerInstance {
  id: string
  templateId: string // Reference to GreatPowerTemplate.shortName
  position: Position
  currentHP: CurrentHP
  awakened: boolean
  // Instance-specific overrides
  zIndex?: number
}

/**
 * GreatPower - Merged shape of great power template + instance for runtime use (hydrated great power)
 * Contains all template data plus instance-specific state
 */
export interface GreatPower extends GreatPowerTemplate {
  id: string
  templateId: string
  position: Position
  currentHP: CurrentHP
  awakened: boolean
}

// ===== Runtime Type Aliases =====
// Migration complete: RuntimeMonster and RuntimeGreatPower aliases removed.
// All code now uses Monster and GreatPower directly as the canonical runtime types.

export interface Player {
  name: string
  shortName: string
  id: string
  description: string
  lastComment: string
  image: ImageSourcePropType
  position: Position
  currentHP: CurrentHP
  maxHP: MaxHP
  ac?: number
  initiative: number
  attack: number
  isHidden: boolean
  hideTurns: number
  inventory: Item[]
  maxInventorySize: number
  weapons: { id: string; equipped: boolean }[]
  maxWeaponsSize: number
  meleeWeaponId: string // Fixed melee weapon (always "weapon-discos-001")
  equippedRangedWeaponId: string | null // Currently equipped ranged weapon
  rangedWeaponInventoryIds: string[] // Available ranged weapons
  moveSpeed: number
  level?: number
  experience?: number
  zIndex?: number
  // Hide ability state (granted by Hermit in hermit-hollow)
  hideUnlocked: boolean // Whether the hide ability has been unlocked
  hideChargeTurns: number // Current charge (0-10 turns)
  hideActive: boolean // Whether hide is currently active
  hideRechargeProgressTurns: number // Progress toward next charge (0-2)
  // Jaunt ability state (granted by defeating Jaunt Daemon in jaunt-cave)
  canJaunt: boolean // Whether the jaunt ability has been unlocked
}

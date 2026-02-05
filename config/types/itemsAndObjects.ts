import { ImageSourcePropType } from 'react-native'
import { Position, WeaponType, InteractionType, ObjectCategory } from './primitives'
import { EntityBase, EntityTemplate } from './entitiesBase'
import { Effect } from './effects'
import { SubGameLaunch } from './subGames'

/**
 * GameObject - Object/item-ish interface for interactive objects
 * Extends EntityBase with object-specific fields
 * No longer a "god interface" - scoped to objects/items only
 */
export interface GameObject extends EntityBase {
  damage?: number
  hitBonus?: number
  type?: string
  weaponType?: WeaponType // For weapons: melee or ranged
  range?: number
  width?: number
  height?: number
  effects?: Effect[]
  collisionMask?: {
    row: number
    col: number
    width: number
    height: number
  }[]
  lastTrigger?: number
  maxInstances?: number
  projectileColor?: string // Hex color for ranged weapon projectile
  projectileLengthPx?: number // Optional length of projectile in pixels
  projectileThicknessPx?: number // Optional thickness of projectile in pixels
  projectileGlow?: boolean // Optional glow effect for projectile
  subGame?: SubGameLaunch // Optional sub-game launch config
  collectible?: boolean
  usable?: boolean
  consumeOnUse?: boolean
}

/**
 * Item - Runtime item entity
 * Extends EntityBase with item-specific fields
 */
export interface Item extends EntityBase {
  type: 'weapon' | 'consumable' | 'key' | 'collectible' | 'building'
  collectible: boolean
  id?: string
  weaponId?: string
  healAmount?: number
  damage?: number
  splash?: {
    image: string
    text: string
  }
  usable?: boolean
  consumeOnUse?: boolean
  maxUses?: number
  currentUses?: number
  // Additional fields for compatibility
  effects?: Effect[]
  weaponType?: WeaponType
  range?: number
  hitBonus?: number
  width?: number
  height?: number
  projectileColor?: string
  projectileLengthPx?: number
  projectileThicknessPx?: number
  projectileGlow?: boolean
}

/**
 * LevelObjectInstance - Runtime object instance
 * Extends EntityBase with object instance-specific fields
 */
export interface LevelObjectInstance extends EntityBase {
  id: string
  templateId?: string | number
  interactable?: boolean
  interactionType?: InteractionType
  locked?: boolean
  keyRequired?: string
  // Additional fields for compatibility from GameObject
  effects?: Effect[]
  collisionMask?: {
    row: number
    col: number
    width: number
    height: number
  }[]
  lastTrigger?: number
  width?: number
  height?: number
  damage?: number
  hitBonus?: number
  weaponType?: WeaponType
  range?: number
  projectileColor?: string
  projectileLengthPx?: number
  projectileThicknessPx?: number
  projectileGlow?: boolean
  subGame?: SubGameLaunch
  collectible?: boolean
  usable?: boolean
  consumeOnUse?: boolean
  maxInstances?: number
  type?: string
}

/**
 * GameObjectTemplate - Static definition of a game object (building, decoration, etc.)
 * Extends EntityTemplate with object-specific fields
 * Excludes runtime fields like position, active, lastTrigger
 */
export interface GameObjectTemplate extends EntityTemplate<'object', ObjectCategory> {
  damage?: number
  hitBonus?: number
  type?: string
  weaponType?: WeaponType
  range?: number
  width?: number
  height?: number
  effects?: Effect[]
  collisionMask?: {
    row: number
    col: number
    width: number
    height: number
  }[]
  maxInstances?: number
  rotation?: number // Default rotation for template
  projectileColor?: string
  projectileLengthPx?: number
  projectileThicknessPx?: number
  projectileGlow?: boolean
  subGame?: SubGameLaunch
  collectible?: boolean
  usable?: boolean
  consumeOnUse?: boolean
}

/**
 * ObjectInstance - Runtime instance of a game object with position and overrides
 */
export interface ObjectInstance {
  id: string
  templateId: string // Reference to the template shortName
  position: Position
  rotation?: number // Instance-specific rotation override
  zIndex?: number // Instance-specific z-index override
  interactable?: boolean
  interactionType?: InteractionType
  locked?: boolean
  keyRequired?: string
}

/**
 * HydratedObject - Merged shape of template + instance for runtime use
 * Contains all template data plus instance-specific overrides
 */
export interface HydratedObject extends GameObjectTemplate {
  id: string
  templateId: string
  position: Position
  active: boolean
  lastTrigger?: number
  // Instance overrides take precedence
  rotation?: number
  zIndex?: number
  interactable?: boolean
  interactionType?: InteractionType
  locked?: boolean
  keyRequired?: string
}

/**
 * NonCollisionObject - Runtime non-collision object entity
 * Extends EntityBase with non-collision object-specific fields
 */
export interface NonCollisionObject extends EntityBase {
  id: string
  position: Position
  rotation: number // 0-360 degrees
  width: number
  height: number
  image: ImageSourcePropType
  zIndex: number
  type: 'footstep' | 'river' | 'decoration' // Add more types as needed
  canTap: boolean
  collisionMask?: {
    row: number
    col: number
    width?: number
    height?: number
  }[]
  collisionEffects?: Effect[]
  active: boolean
}

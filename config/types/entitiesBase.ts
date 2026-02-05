import { ImageSourcePropType } from 'react-native'
import { EntityKind, Position } from './primitives'

/**
 * EntityBase - Common runtime base for all game entities
 * Shared fields across Item, LevelObjectInstance, etc.
 */
export interface EntityBase {
  id?: string // Optional for legacy compatibility
  kind?: EntityKind // Optional for backward compatibility
  shortName: string
  category: string
  name: string
  description?: string
  image?: ImageSourcePropType
  position?: Position
  active?: boolean
  size?: { width: number; height: number }
  zIndex?: number
  rotation?: number
}

/**
 * EntityTemplate - Base type for all static entity templates
 * Contains shared fields common to all game entities (monsters, objects, great powers)
 * Templates represent immutable design-time data only - no runtime state
 * 
 * @template TKind - The entity kind discriminant
 * @template TCategory - The category type (string or specific union)
 */
export interface EntityTemplate<TKind extends EntityKind = EntityKind, TCategory extends string = string> {
  kind: TKind // Entity kind discriminant
  shortName: string // Unique identifier, acts as template ID
  category: TCategory // Entity category (e.g., 'regular', 'greatPower', 'building')
  name: string // Display name
  description?: string // Optional description
  image?: ImageSourcePropType // Visual representation
  size?: { width: number; height: number } // Size in grid units
  zIndex?: number // Rendering layer priority
}

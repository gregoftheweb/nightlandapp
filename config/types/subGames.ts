import { ImageSourcePropType } from 'react-native'
import { Effect } from './effects'
import { ObjectCategory } from './primitives'

export interface SubGameLaunch {
  subGameName: string // maps to /sub-games/<subGameName>
  ctaLabel: string // label for InfoBox button
  requiresPlayerOnObject?: boolean // default true
  subGameId?: string // Optional: sub-game identifier for registry lookup
}

export interface SubGameResult<TData = unknown> {
  completed: boolean
  data?: TData // Optional result data from sub-game
}

/**
 * Sub-game entrance physical definition
 * Describes the overworld object that serves as the entrance to a sub-game
 * Used to render and interact with the entrance in the overworld
 */
export interface SubGameEntranceDefinition {
  /** Readable identifier used in instances */
  shortName: string
  /** Object category (typically 'building') */
  category: ObjectCategory
  /** Width in grid cells */
  width: number
  /** Height in grid cells */
  height: number
  /** Image asset for the entrance */
  image: ImageSourcePropType
  /** Whether the entrance is active/interactable */
  active: boolean
  /** Z-index for rendering order */
  zIndex: number
  /** Optional effects when interacting with entrance */
  effects?: Effect[]
  /** CTA label for the interaction button */
  ctaLabel: string
  /** Whether player must be on the object to interact */
  requiresPlayerOnObject: boolean
}

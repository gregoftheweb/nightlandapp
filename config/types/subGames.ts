import { ImageSourcePropType } from 'react-native'
import { Effect } from './effects'
import { ObjectCategory } from './primitives'

export interface SubGameLaunch {
  ctaLabel: string // label for InfoBox button
  requiresPlayerOnObject?: boolean // default true
  instanceId: string // Stable placed-encounter identifier in the sub-game registry
}

export type SubGameShapeId = 'dialogue' | 'word-grid' | 'one-off'

export type SubGameFailurePolicy =
  | { exit: 'safe' }
  | {
      exit: 'death'
      message: string
      killerName: string
      suppressDeathDialog: boolean
      deathRoute: string
    }

export type SubGameRevisitPolicy =
  'restart' | 'resume' | 'success-screen' | 'aftermath-screen' | 'unavailable'

export type SubGameProgressConfig =
  | { mode: 'local-only' }
  | { mode: 'async-storage'; saveKey: string; version: number; clearOnCompletion: boolean }

export type SubGameRewardConfig =
  | { kind: 'none' }
  | {
      kind: 'weapon-upgrade'
      weaponId: string
      damageMultiplier: number
      hitBonusAdd: number
      grantEvent: string
      idempotent: true
    }
  | {
      kind: 'item' | 'weapon' | 'effect' | 'ability'
      id: string
      grantEvent: string
      idempotent: true
    }

/** Lifecycle policy only. Instance identity and routing live in the registry. */
export interface SubGameLifecycleConfig {
  completion: { event: string; idempotent: true }
  failure: SubGameFailurePolicy
  waypoint:
    | { createsWaypoint: false }
    | { createsWaypoint: true; waypointName: string; snapshot: string; idempotent: true }
  revisit: SubGameRevisitPolicy
  /** Optional explicit destination for a one-off aftermath screen. */
  aftermathRoute?: string
  progress: SubGameProgressConfig
  reward: SubGameRewardConfig
  returnToRpg: { signalRpgResume: true; exitSubGame: true }
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

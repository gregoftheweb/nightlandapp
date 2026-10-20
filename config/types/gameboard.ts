import type { SubGameShapeId } from './subGames'
import type { Position } from './primitives'
import type { TrailLocation } from '../../modules/trailGeometry'

export type GameboardRegion = 'start' | 'end' | { nearSlotId: string; bufferPct: number }

/**
 * 'world-object' is a placement-only shape, not a sub-game: it resolves its contentRef
 * against a plain building template (config/objects.ts) instead of the sub-game registry,
 * and the layout engine places it as an ordinary LevelObjectInstance (no entryRoute, no
 * lifecycle, no screen) — the same object definition used for a fixed/pinned placement in
 * level.objects, just given a trail-resolved position instead of a hand-written one.
 */
export type WorldObjectShapeId = 'world-object'
export type GameboardShapeId = SubGameShapeId | WorldObjectShapeId

export type GameboardSlot =
  | {
      slotId: string
      shapeId: GameboardShapeId
      kind: 'range'
      placement: { minPct: number; maxPct: number }
      contentRef: string
    }
  | {
      slotId: string
      shapeId: GameboardShapeId
      kind: 'end'
      contentRef: string
    }
  | {
      slotId: string
      shapeId: GameboardShapeId
      kind: 'scattered-group'
      placement: {
        exclude: GameboardRegion[]
        minSpacingPct?: number
      }
      instances: string[]
    }

export interface GameboardManifest {
  version: number
  slots: GameboardSlot[]
}

export interface EncounterPlacement {
  instanceId: string
  shapeId: GameboardShapeId
  slotId: string
  location: TrailLocation
  position: Position
  footprint: { width: number; height: number }
  occupancyId: string
}

export interface GameboardCatalogIdentity {
  gameboardVersion: number
  gameboardHash: string
  referencedContentHash: string
}

/** Serializable authored content used by save fingerprinting; never contains image handles. */
export interface ContentFingerprintInput {
  shapeId: GameboardShapeId
  instanceId: string
  content: unknown
}

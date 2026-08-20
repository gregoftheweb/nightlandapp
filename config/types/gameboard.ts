import type { SubGameShapeId } from './subGames'
import type { Position } from './primitives'

export type GameboardRegion = 'start' | 'end' | { nearSlotId: string; bufferPct: number }

export type GameboardSlot =
  | {
      slotId: string
      shapeId: SubGameShapeId
      kind: 'range'
      placement: { minPct: number; maxPct: number }
      contentRef: string
    }
  | {
      slotId: string
      shapeId: SubGameShapeId
      kind: 'end'
      contentRef: string
    }
  | {
      slotId: string
      shapeId: SubGameShapeId
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
  shapeId: SubGameShapeId
  slotId: string
  position: Position
  progressPct: number
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
  shapeId: SubGameShapeId
  instanceId: string
  content: unknown
}

import type { SubGameShapeId } from './subGames'

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

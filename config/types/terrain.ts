import type { ImageSourcePropType } from 'react-native'
import type { Position } from './primitives'
import type { Effect } from './effects'

export interface TerrainRegion {
  id: string
  name: string
  description?: string
  position: Position
  width: number
  height: number
  image: ImageSourcePropType
  /** Local cell rectangles; independent of visual bounds. */
  shape: { row: number; col: number; width: number; height: number }[]
  blocksMovement: boolean
  effects?: Effect[]
  /** Effects run on each interaction turn, preserving river behavior. */
  effectTiming?: 'eachTurn' | 'onEnter'
}

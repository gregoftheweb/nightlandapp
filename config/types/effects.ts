import { Position, Area, EffectTarget } from './primitives'

// Strict discriminated union for effects
// Each effect type defines only the fields it actually uses

export type Effect =
  | {
      type: 'heal'
      value: number
      cost?: {
        hp?: number
        mp?: number
        stamina?: number
        item?: string
        quantity?: number
      }
      description?: string
    }
  | {
      type: 'recuperate'
      value: number
      description?: string
    }
  | {
      type: 'hide'
      description?: string
    }
  | {
      type: 'cloaking'
      duration: number
      description?: string
    }
  | {
      type: 'swarm'
      monsterType: string
      count: number
      range: number
    }
  | {
      type: 'soulsuck'
      description?: string
    }
  | {
      type: 'poison'
      value: number
      description?: string
    }
  | {
      type: 'showMessage'
      message: string
      description?: string
    }
  | {
      type: 'unlock_hide_ability'
      description?: string
    }
  | {
      type: 'stun'
      duration: number
      target?: EffectTarget
      description?: string
    }
  | {
      type: 'teleport'
      target?: EffectTarget
      position?: Position
      area?: Area
      range?: number
      description?: string
    }
  | {
      type: 'spawn'
      monsterType: string
      count?: number
      range?: number
      position?: Position
      area?: Area
      description?: string
    }

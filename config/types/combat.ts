import { Position, MaxHP, CurrentHP } from './primitives'
import { Effect } from './effects'

export interface SaveGameMetadata {
  version: string
  playerName: string
  currentLevel: string
  playTime: number
  lastSaved: Date
  gameMode?: string
  difficulty?: string
}

export interface CombatParticipant {
  id: string
  type: 'player' | 'monster' | 'npc'
  position: Position
  initiative: number
  currentHP: CurrentHP
  maxHP: MaxHP
  ac: number
  attack: number
  actions: CombatAction[]
  statusEffects: StatusEffect[]
}

export interface CombatAction {
  id: string
  name: string
  type: 'attack' | 'move' | 'defend' | 'special'
  cost: number
  range: number
  damage?: number
  effects?: Effect[]
}

export interface StatusEffect {
  id: string
  name: string
  description: string
  duration: number
  effects: Effect[]
  stackable: boolean
}

export interface CombatLogEntry {
  id: string
  message: string
  turn: number
}

export interface Projectile {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  angleDeg: number
  color: string
  createdAt: number
  durationMs: number
  lengthPx?: number // Optional length override for laser bolts
  thicknessPx?: number // Optional thickness override
  glow?: boolean // Optional glow effect
}

import { Position, Area } from './primitives'
import { Item, LevelObjectInstance, NonCollisionObject, ObjectInstance } from './itemsAndObjects'
import { MonsterInstance, GreatPowerInstance, GreatPower } from './actors'

export interface SpawnZone {
  id: string
  area: Area
  monsterTypes: string[]
  spawnRate: number
  maxMonsters: number
  minPlayerDistance: number
  active?: boolean
  cooldownTime?: number
  lastSpawnAttempt?: number
}

export interface CompletionCondition {
  type: 'reach_position' | 'defeat_all_monsters' | 'collect_item' | 'defeat_boss' | 'survive_time'
  position?: Position
  itemId?: string
  bossId?: string
  timeRequired?: number
  description?: string
  completed?: boolean
}

export interface BossEncounter {
  id: string
}

export interface MonsterSpawnConfig {
  templateId: string // maps to MonsterTemplate.shortName
  spawnRate: number
  maxInstances: number
}

export interface Level {
  id: string
  name: string
  description?: string
  boardSize: { width: number; height: number }
  playerSpawn: Position
  requiredLevel?: number
  recommendedLevel?: number
  experienceReward?: number
  ambientLight?: number
  weatherEffect?: string | null
  backgroundMusic?: string
  turnsPerHitPoint?: number // Number of turns needed to heal 1 HP (e.g., 5 = heal 1 HP every 5 turns)
  items: Item[]
  objects: LevelObjectInstance[]
  nonCollisionObjects?: NonCollisionObject[]
  greatPowers?: GreatPower[]
  bossEncounter?: BossEncounter
  completionConditions?: CompletionCondition[]
  spawnZones?: SpawnZone[]
  version?: string
  lastModified?: Date
  // Template/instance/hydration architecture support
  schemaVersion?: 1 | 2 // Schema version marker (1 = legacy, 2 = template/instance)
  objectInstances?: ObjectInstance[] // Object instances (used when schemaVersion === 2)
  monsterInstances?: MonsterInstance[] // Monster instances (used when schemaVersion === 2)
  greatPowerInstances?: GreatPowerInstance[] // Great power instances (used when schemaVersion === 2)
  monsterSpawnConfigs?: MonsterSpawnConfig[] // Monster spawn configurations
}

// Removed: FootstepInstance, FootstepTemplate - now using buildings with rotation

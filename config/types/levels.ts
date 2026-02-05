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

export interface MonsterSpawnConfigV2 {
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
  // V2 template/instance/hydration architecture support
  schemaVersion?: 1 | 2 // Schema version marker (1 = legacy, 2 = template/instance)
  objectInstancesV2?: ObjectInstance[] // V2 object instances (used when schemaVersion === 2)
  monsterInstancesV2?: MonsterInstance[] // V2 monster instances (used when schemaVersion === 2)
  greatPowerInstancesV2?: GreatPowerInstance[] // V2 great power instances (used when schemaVersion === 2)
  monsterSpawnConfigsV2?: MonsterSpawnConfigV2[] // V2 monster spawn configurations
}

// Removed: FootstepInstance, FootstepTemplate - now using buildings with rotation

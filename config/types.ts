import { ImageSourcePropType } from 'react-native'

export interface Position {
  row: number
  col: number
}

export interface Area {
  topLeft: Position
  bottomRight: Position
}

export type WeaponType = 'melee' | 'ranged'

export interface SubGameLaunch {
  subGameName: string // maps to /sub-games/<subGameName>
  ctaLabel: string // label for InfoBox button
  requiresPlayerOnObject?: boolean // default true
}

export interface SubGameResult {
  completed: boolean
  data?: any // Optional result data from sub-game
}

export interface GameObject {
  shortName: string
  category: string
  name: string
  description?: string
  damage?: number
  hitBonus?: number
  type?: string
  weaponType?: WeaponType // For weapons: melee or ranged
  range?: number
  width?: number
  height?: number
  image?: ImageSourcePropType
  position?: Position
  active?: boolean
  size?: { width: number; height: number }
  effects?: Effect[]
  collisionMask?: Array<{
    row: number
    col: number
    width: number
    height: number
  }>
  lastTrigger?: number
  maxInstances?: number
  zIndex?: number
  rotation?: number // NEW: Rotation in degrees (0-360)
  projectileColor?: string // Hex color for ranged weapon projectile
  projectileLengthPx?: number // Optional length of projectile in pixels
  projectileThicknessPx?: number // Optional thickness of projectile in pixels
  projectileGlow?: boolean // Optional glow effect for projectile
  subGame?: SubGameLaunch // Optional sub-game launch config
}

export interface Monster extends GameObject {
  id?: string
  position: Position
  hp: number
  maxHP: number
  attack: number
  ac: number
  initiative?: number
  moveRate: number
  spawnRate?: number // Percentage chance (0.0 to 1.0) that monster spawns each turn
  maxInstances?: number
  soulKey: string
  uiSlot?: number
  inCombatSlot?: boolean
}

export interface GreatPower extends GameObject {
  id: string
  name: string
  position: Position
  hp: number
  maxHP: number
  attack: number
  ac: number
  awakened: boolean
  awakenCondition: string
  soulKey?: string
}

export interface LevelMonsterInstance extends Monster {
  id: string
  templateId?: string
  currentHP: number
  spawned?: boolean
  spawnZoneId?: string
}

export interface Item extends GameObject {
  type: 'weapon' | 'consumable' | 'key' | 'collectible' | 'building'
  collectible: boolean
  id?: string
  weaponId?: string
  healAmount?: number
  damage?: number
  splash?: {
    image: string
    text: string
  }
  usable?: boolean
  consumeOnUse?: boolean
  maxUses?: number
  currentUses?: number
}

export interface LevelObjectInstance extends GameObject {
  id: string
  templateId?: string | number
  interactable?: boolean
  interactionType?: 'door' | 'chest' | 'npc' | 'portal'
  locked?: boolean
  keyRequired?: string
  rotation?: number // NEW: Instance-specific rotation override
}

export interface Player {
  name: string
  shortName: string
  id: string
  description: string
  lastComment: string
  image: string
  position: Position
  hp: number
  maxHP: number
  ac?: number
  initiative: number
  attack: number
  isHidden: boolean
  hideTurns: number
  inventory: Item[]
  maxInventorySize: number
  weapons: Array<{ id: string; equipped: boolean }>
  maxWeaponsSize: number
  meleeWeaponId: string // Fixed melee weapon (always "weapon-discos-001")
  equippedRangedWeaponId: string | null // Currently equipped ranged weapon
  rangedWeaponInventoryIds: string[] // Available ranged weapons
  soulKey: string
  moveSpeed: number
  level?: number
  experience?: number
  zIndex?: number
}

export interface NonCollisionObject {
  id: string
  shortName: string
  name: string
  description: string
  position: Position
  rotation: number // 0-360 degrees
  width: number
  height: number
  image: ImageSourcePropType
  zIndex: number
  type: 'footstep' | 'river' | 'decoration' // Add more types as needed
  canTap: boolean
  collisionMask?: Array<{
    row: number
    col: number
    width?: number
    height?: number
  }>
  collisionEffects?: Effect[]
  active: boolean
}

export interface Effect {
  type:
    | 'heal'
    | 'stun'
    | 'poison'
    | 'teleport'
    | 'spawn'
    | 'swarm'
    | 'hide'
    | 'recuperate'
    | 'soulsuck'
    | 'showMessage'

  description?: string

  // Numeric values
  value?: number
  duration?: number
  range?: number
  count?: number
  amount?: number

  // Target specification
  target?: 'self' | 'enemy' | 'ally' | 'area' | 'all'
  targetId?: string

  // Spawn/summon properties
  monsterType?: string
  entityId?: string

  // Position and area effects
  position?: Position
  area?: Area

  // Conditional logic
  condition?: {
    type: 'hp_below' | 'hp_above' | 'has_item' | 'level_check' | 'random'
    value?: number
    probability?: number
    itemId?: string
  }

  // Status effects
  statusEffect?: {
    id: string
    name: string
    icon?: string
    stackable?: boolean
    maxStacks?: number
  }

  // Resource costs
  cost?: {
    hp?: number
    mp?: number
    stamina?: number
    item?: string
    quantity?: number
  }

  // Success/failure messaging
  successMessage?: string
  failureMessage?: string
  message?: string // For showMessage effect

  // Cooldown and usage limits
  cooldown?: number
  maxUses?: number
  currentUses?: number

  // Animation and visual effects
  animation?: {
    type: string
    duration: number
    color?: string
    particle?: string
  }

  // Sound effects
  sound?: {
    trigger: string
    success?: string
    failure?: string
  }
}

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
  monsters: LevelMonsterInstance[]
  objects: LevelObjectInstance[]
  nonCollisionObjects?: NonCollisionObject[]
  greatPowers?: GreatPower[]
  bossEncounter?: BossEncounter
  completionConditions?: CompletionCondition[]
  spawnZones?: SpawnZone[]
  version?: string
  lastModified?: Date
}

// Removed: FootstepInstance, FootstepTemplate - now using buildings with rotation

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
  hp: number
  maxHP: number
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

export interface GameState {
  gameOver?: boolean
  level: Level
  currentLevelId: string
  player: Player
  moveCount: number
  inCombat: boolean
  combatTurn: CombatParticipant | null
  attackSlots: Monster[]
  waitingMonsters: Monster[]
  turnOrder: CombatParticipant[]
  combatLog: CombatLogEntry[]
  activeMonsters: Monster[]
  items: Item[]
  objects: LevelObjectInstance[]
  nonCollisionObjects?: NonCollisionObject[]
  greatPowers: GreatPower[]
  levels: Record<string, Level>
  weapons: Item[]
  monsters: LevelMonsterInstance[]
  gridWidth: number
  gridHeight: number
  maxAttackers: number
  saveVersion: string
  lastSaved: Date
  playTime: number
  lastAction: string
  showInventory?: boolean
  showWeaponsInventory?: boolean
  dropSuccess?: boolean
  dialogData?: any
  audioStarted?: boolean
  gameOverMessage?: string
  monstersKilled?: number
  distanceTraveled?: number
  killerName?: string
  selfHealTurnCounter?: number // Tracks turns for self-healing mechanic
  rangedAttackMode?: boolean // True when player is in ranged attack targeting mode
  targetedMonsterId?: string | null // ID of the currently targeted monster for ranged attack
  activeProjectiles: Projectile[] // Active projectiles being animated
  subGamesCompleted?: Record<string, boolean> // Track completed sub-games
}

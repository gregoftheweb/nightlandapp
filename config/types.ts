import { ImageSourcePropType } from 'react-native'

// ===== HP Type Aliases =====
// Explicit type aliases for HP to standardize semantics across the codebase
export type MaxHP = number // Maximum hit points (template/design-time value)
export type CurrentHP = number // Current hit points at runtime (for V2 instances)
export type HP = CurrentHP // Legacy runtime hp field (for backward compatibility)

// ===== HP Helper Interfaces =====
// Helper interfaces for composing HP-related fields
export interface HasMaxHP {
  maxHP: MaxHP
}

export interface HasCurrentHP {
  currentHP: CurrentHP
}

export interface HasLegacyHP {
  hp: HP
  maxHP: MaxHP
}

export interface Position {
  row: number
  col: number
}

export interface Area {
  topLeft: Position
  bottomRight: Position
}

export type WeaponType = 'melee' | 'ranged'

export type InteractionType = 'door' | 'chest' | 'npc' | 'portal'

export type EffectTarget = 'self' | 'enemy' | 'ally' | 'area' | 'all'

/**
 * EntityKind - Discriminant for different entity types in the game
 * Used to identify what kind of thing an entity is at the type level
 */
export type EntityKind = 'object' | 'monster' | 'greatPower' | 'item' | 'nonCollision'

/**
 * Category union types - Provide type safety for known categories while allowing unknown values
 * Using union with string to avoid breaking existing code that may use custom categories
 */
export type ObjectCategory = 'building' | 'pool' | 'npc' | 'decoration' | 'portal' | 'door' | 'chest' | 'weapon' | 'consumable' | 'collectible' | string
export type MonsterCategory = 'regular' | 'elite' | 'boss' | string
export type GreatPowerCategory = 'greatPower' | 'boss' | string
export type ItemCategory = 'weapon' | 'consumable' | 'key' | 'collectible' | 'building' | string

export interface SubGameLaunch {
  subGameName: string // maps to /sub-games/<subGameName>
  ctaLabel: string // label for InfoBox button
  requiresPlayerOnObject?: boolean // default true
}

export interface SubGameResult<TData = unknown> {
  completed: boolean
  data?: TData // Optional result data from sub-game
}

/**
 * EntityBase - Common runtime base for all game entities
 * Shared fields across Monster, GreatPower, Item, LevelObjectInstance, etc.
 */
export interface EntityBase {
  id?: string // Optional for legacy compatibility
  kind?: EntityKind // Optional for backward compatibility
  shortName: string
  category: string
  name: string
  description?: string
  image?: ImageSourcePropType
  position?: Position
  active?: boolean
  size?: { width: number; height: number }
  zIndex?: number
  rotation?: number
}

/**
 * GameObject - Object/item-ish interface for interactive objects
 * Extends EntityBase with object-specific fields
 * No longer a "god interface" - scoped to objects/items only
 */
export interface GameObject extends EntityBase {
  damage?: number
  hitBonus?: number
  type?: string
  weaponType?: WeaponType // For weapons: melee or ranged
  range?: number
  width?: number
  height?: number
  effects?: Effect[]
  collisionMask?: Array<{
    row: number
    col: number
    width: number
    height: number
  }>
  lastTrigger?: number
  maxInstances?: number
  projectileColor?: string // Hex color for ranged weapon projectile
  projectileLengthPx?: number // Optional length of projectile in pixels
  projectileThicknessPx?: number // Optional thickness of projectile in pixels
  projectileGlow?: boolean // Optional glow effect for projectile
  subGame?: SubGameLaunch // Optional sub-game launch config
  collectible?: boolean
  usable?: boolean
  consumeOnUse?: boolean
}

/**
 * Monster - Runtime monster entity
 * Extends EntityBase with monster-specific combat and behavior fields
 */
export interface Monster extends EntityBase {
  id?: string
  position: Position
  hp: HP
  maxHP: MaxHP
  attack: number
  ac: number
  initiative?: number
  moveRate: number
  spawnRate?: number // Percentage chance (0.0 to 1.0) that monster spawns each turn
  maxInstances?: number
  uiSlot?: number
  inCombatSlot?: boolean
  // Additional fields for compatibility
  width?: number
  height?: number
  damage?: number
  hitBonus?: number
  weaponType?: WeaponType
  range?: number
  effects?: Effect[]
}

/**
 * GreatPower - Runtime great power entity
 * Extends EntityBase with great power-specific fields
 */
export interface GreatPower extends EntityBase {
  id: string
  position: Position
  hp: HP
  maxHP: MaxHP
  attack: number
  ac: number
  awakened: boolean
  awakenCondition: string
  // Additional fields for compatibility
  width?: number
  height?: number
  effects?: Effect[]
  damage?: number
  hitBonus?: number
  weaponType?: WeaponType
  range?: number
}

export interface LevelMonsterInstance extends Monster {
  id: string
  templateId?: string
  currentHP: CurrentHP
  spawned?: boolean
  spawnZoneId?: string
}

/**
 * Item - Runtime item entity
 * Extends EntityBase with item-specific fields
 */
export interface Item extends EntityBase {
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
  // Additional fields for compatibility
  effects?: Effect[]
  weaponType?: WeaponType
  range?: number
  hitBonus?: number
  width?: number
  height?: number
  projectileColor?: string
  projectileLengthPx?: number
  projectileThicknessPx?: number
  projectileGlow?: boolean
}

/**
 * LevelObjectInstance - Runtime object instance
 * Extends EntityBase with object instance-specific fields
 */
export interface LevelObjectInstance extends EntityBase {
  id: string
  templateId?: string | number
  interactable?: boolean
  interactionType?: InteractionType
  locked?: boolean
  keyRequired?: string
  // Additional fields for compatibility from GameObject
  effects?: Effect[]
  collisionMask?: Array<{
    row: number
    col: number
    width: number
    height: number
  }>
  lastTrigger?: number
  width?: number
  height?: number
  damage?: number
  hitBonus?: number
  weaponType?: WeaponType
  range?: number
  projectileColor?: string
  projectileLengthPx?: number
  projectileThicknessPx?: number
  projectileGlow?: boolean
  subGame?: SubGameLaunch
  collectible?: boolean
  usable?: boolean
  consumeOnUse?: boolean
  maxInstances?: number
  type?: string
}

// ===== Template vs Instance Architecture =====
// Clean separation between templates (static definitions)
// and instances (runtime entities with state)
//
// PATTERN: Template → Instance → Hydrated
//
// 1. TEMPLATES (Static, Immutable Design-Time Data)
//    - Define entity characteristics (stats, images, descriptions)
//    - Contain NO runtime state (no position, id, currentHP, spawned, etc.)
//    - Use maxHP (not hp), no active flag, no lastTrigger
//    - Extend EntityTemplate for common fields
//    - Examples: MonsterTemplateV2, GreatPowerTemplateV2, GameObjectTemplate
//
// 2. INSTANCES (Runtime State)
//    - Contain ONLY runtime data: id, templateId, position, currentHP
//    - Reference template via templateId (maps to template.shortName)
//    - Hold instance-specific overrides (zIndex, rotation, etc.)
//    - Examples: MonsterInstanceV2, GreatPowerInstanceV2, ObjectInstance
//
// 3. HYDRATED (Runtime Shape = Template + Instance)
//    - Merge template data with instance state
//    - Provide complete entity for gameplay logic
//    - Created by hydration functions (e.g., hydrateMonsterV2)
//    - Examples: HydratedMonsterV2, HydratedGreatPowerV2, HydratedObject
//
// MIGRATION STATUS:
// - V2 types are the target architecture (use these going forward)
// - V1 types removed from types.ts (kept in hydration.ts for compatibility)
// - GameState.activeMonsters still uses legacy Monster type
// - Once GameState migrates, V1 compatibility bridge can be removed

/**
 * EntityTemplate - Base type for all static entity templates
 * Contains shared fields common to all game entities (monsters, objects, great powers)
 * Templates represent immutable design-time data only - no runtime state
 * 
 * @template TKind - The entity kind discriminant
 * @template TCategory - The category type (string or specific union)
 */
export interface EntityTemplate<TKind extends EntityKind = EntityKind, TCategory extends string = string> {
  kind: TKind // Entity kind discriminant
  shortName: string // Unique identifier, acts as template ID
  category: TCategory // Entity category (e.g., 'regular', 'greatPower', 'building')
  name: string // Display name
  description?: string // Optional description
  image?: ImageSourcePropType // Visual representation
  size?: { width: number; height: number } // Size in grid units
  zIndex?: number // Rendering layer priority
}

/**
 * GameObjectTemplate - Static definition of a game object (building, decoration, etc.)
 * Extends EntityTemplate with object-specific fields
 * Excludes runtime fields like position, active, lastTrigger
 */
export interface GameObjectTemplate extends EntityTemplate<'object', ObjectCategory> {
  damage?: number
  hitBonus?: number
  type?: string
  weaponType?: WeaponType
  range?: number
  width?: number
  height?: number
  effects?: Effect[]
  collisionMask?: Array<{
    row: number
    col: number
    width: number
    height: number
  }>
  maxInstances?: number
  rotation?: number // Default rotation for template
  projectileColor?: string
  projectileLengthPx?: number
  projectileThicknessPx?: number
  projectileGlow?: boolean
  subGame?: SubGameLaunch
  collectible?: boolean
  usable?: boolean
  consumeOnUse?: boolean
}

/**
 * ObjectInstance - Runtime instance of a game object with position and overrides
 */
export interface ObjectInstance {
  id: string
  templateId: string // Reference to the template shortName
  position: Position
  rotation?: number // Instance-specific rotation override
  zIndex?: number // Instance-specific z-index override
  interactable?: boolean
  interactionType?: InteractionType
  locked?: boolean
  keyRequired?: string
}

/**
 * HydratedObject - Merged shape of template + instance for runtime use
 * Contains all template data plus instance-specific overrides
 */
export interface HydratedObject extends GameObjectTemplate {
  id: string
  templateId: string
  position: Position
  active: boolean
  lastTrigger?: number
  // Instance overrides take precedence
  rotation?: number
  zIndex?: number
  interactable?: boolean
  interactionType?: InteractionType
  locked?: boolean
  keyRequired?: string
}

// ===== V2: Enhanced Template vs Instance Architecture for Monsters and Great Powers =====
// V2 types provide cleaner separation and are the preferred long-term architecture
// Converging all types to V2 - no V3 types will be created

/**
 * MonsterTemplateV2 - Static definition of a monster type
 * Extends EntityTemplate with monster-specific combat and behavior fields
 * Contains only template/definition data, no runtime state or position
 */
export interface MonsterTemplateV2 extends EntityTemplate<'monster', MonsterCategory> {
  maxHP: MaxHP
  attack: number
  ac: number
  initiative?: number
  moveRate: number
  spawnRate?: number
  maxInstances?: number
  width?: number
  height?: number
  effects?: Effect[]
  damage?: number
  hitBonus?: number
  weaponType?: WeaponType
  range?: number
}

/**
 * MonsterInstanceV2 - Runtime instance of a monster with position and state
 * Contains only runtime data and instance-specific overrides
 */
export interface MonsterInstanceV2 {
  id: string
  templateId: string // Reference to MonsterTemplateV2.shortName
  position: Position
  currentHP: CurrentHP
  spawned?: boolean
  spawnZoneId?: string
  uiSlot?: number
  inCombatSlot?: boolean
  // Instance-specific overrides
  zIndex?: number
}

/**
 * HydratedMonsterV2 - Merged shape of monster template + instance for runtime use
 * Contains all template data plus instance-specific state
 */
export interface HydratedMonsterV2 extends MonsterTemplateV2 {
  id: string
  templateId: string
  position: Position
  currentHP: CurrentHP
  spawned?: boolean
  spawnZoneId?: string
  uiSlot?: number
  inCombatSlot?: boolean
}

/**
 * GreatPowerTemplateV2 - Static definition of a Great Power
 * Extends EntityTemplate with great power-specific fields
 * Contains only template/definition data, no runtime state or position
 */
export interface GreatPowerTemplateV2 extends EntityTemplate<'greatPower', GreatPowerCategory> {
  maxHP: MaxHP
  attack: number
  ac: number
  awakenCondition: string
  width?: number
  height?: number
  effects?: Effect[]
  damage?: number
  hitBonus?: number
  weaponType?: WeaponType
  range?: number
}

/**
 * GreatPowerInstanceV2 - Runtime instance of a Great Power with position and state
 * Contains only runtime data and instance-specific overrides
 */
export interface GreatPowerInstanceV2 {
  id: string
  templateId: string // Reference to GreatPowerTemplateV2.shortName
  position: Position
  currentHP: CurrentHP
  awakened: boolean
  // Instance-specific overrides
  zIndex?: number
}

/**
 * HydratedGreatPowerV2 - Merged shape of great power template + instance for runtime use
 * Contains all template data plus instance-specific state
 */
export interface HydratedGreatPowerV2 extends GreatPowerTemplateV2 {
  id: string
  templateId: string
  position: Position
  currentHP: CurrentHP
  awakened: boolean
}

export interface Player {
  name: string
  shortName: string
  id: string
  description: string
  lastComment: string
  image: ImageSourcePropType
  position: Position
  hp: HP
  maxHP: MaxHP
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
  moveSpeed: number
  level?: number
  experience?: number
  zIndex?: number
  // Hide ability state (granted by Hermit in hermit-hollow)
  hideUnlocked: boolean // Whether the hide ability has been unlocked
  hideChargeTurns: number // Current charge (0-10 turns)
  hideActive: boolean // Whether hide is currently active
  hideRechargeProgressTurns: number // Progress toward next charge (0-2)
}

/**
 * NonCollisionObject - Runtime non-collision object entity
 * Extends EntityBase with non-collision object-specific fields
 */
export interface NonCollisionObject extends EntityBase {
  id: string
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
  templateId: string // maps to MonsterTemplateV2.shortName
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
  monsters: LevelMonsterInstance[]
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
  monsterInstancesV2?: MonsterInstanceV2[] // V2 monster instances (used when schemaVersion === 2)
  greatPowerInstancesV2?: GreatPowerInstanceV2[] // V2 great power instances (used when schemaVersion === 2)
  monsterSpawnConfigsV2?: MonsterSpawnConfigV2[] // V2 monster spawn configurations
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
  hp: HP
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

/**
 * GameState represents the complete state of the game.
 *
 * State Domains:
 * - Level: Current level configuration and level-specific data
 * - Player: Player stats, position, inventory, and equipment
 * - Combat: Active combat state including monsters, turn order, and combat log
 * - UI: Modal states, dialogs, and display flags
 * - Meta: Save/load metadata, statistics, and game progress
 */
export interface GameState {
  // ===== LEVEL DOMAIN =====
  level: Level // Current level configuration
  currentLevelId: string // Current level ID
  levels: Record<string, Level> // All loaded level configurations
  items: Item[] // Items available in current level
  objects: LevelObjectInstance[] // Interactive objects in current level
  nonCollisionObjects?: NonCollisionObject[] // Decorative/non-collision objects
  greatPowers: GreatPower[] // Great powers available in current level
  monsters: LevelMonsterInstance[] // Monster spawn configurations for current level
  gridWidth: number // Game grid width
  gridHeight: number // Game grid height

  // ===== PLAYER DOMAIN =====
  player: Player // Player character state (stats, inventory, position, etc.)
  moveCount: number // Total moves made by player
  distanceTraveled?: number // Total distance traveled (for stats)
  selfHealTurnCounter?: number // Tracks turns for self-healing mechanic

  // ===== COMBAT DOMAIN =====
  inCombat: boolean // Whether player is currently in combat
  combatTurn: CombatParticipant | null // Current turn participant
  activeMonsters: Monster[] // Active monster instances in the level
  attackSlots: Monster[] // Monsters currently attacking the player
  waitingMonsters: Monster[] // Monsters waiting to attack
  turnOrder: CombatParticipant[] // Combat turn order
  combatLog: CombatLogEntry[] // Combat event log
  maxAttackers: number // Maximum simultaneous attackers
  monstersKilled?: number // Total monsters killed (for stats)

  // ===== RANGED COMBAT =====
  rangedAttackMode?: boolean // True when player is in ranged attack targeting mode
  targetedMonsterId?: string | null // ID of the currently targeted monster for ranged attack
  activeProjectiles: Projectile[] // Active projectiles being animated

  // ===== UI DOMAIN =====
  showInventory?: boolean // Show inventory modal
  showWeaponsInventory?: boolean // Show weapons inventory modal
  dropSuccess?: boolean // Last drop operation success flag
  dialogData?: unknown // Data for currently displayed dialog
  audioStarted?: boolean // Whether audio has been initialized

  // ===== DEATH/GAME OVER DOMAIN =====
  gameOver?: boolean // True when player has died
  gameOverMessage?: string // Death message to display
  killerName?: string // Name of entity that killed player
  suppressDeathDialog?: boolean // Suppress death dialog for specific death sources (e.g., puzzle deaths)

  // ===== META/PERSISTENCE DOMAIN =====
  weapons: Item[] // Global weapons catalog
  saveVersion: string // Save format version
  lastSaved: Date // Last save timestamp
  playTime: number // Total play time in seconds
  lastAction: string // Last action performed (for debugging)
  subGamesCompleted?: Record<string, boolean> // Track completed sub-games (tesseract, aerowreck, etc.)
  waypointSavesCreated?: Record<string, boolean> // Track which waypoint saves have been created (to prevent duplicates)
}

/**
 * GameSnapshot represents a JSON-serializable subset of GameState.
 * Used for save/load operations. Excludes non-serializable types like Date, Image, functions.
 */
export type GameSnapshot = Omit<GameState, 'lastSaved'> & {
  lastSaved: string // ISO date string instead of Date object
}

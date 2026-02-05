import { Level } from './levels'
import { Item, LevelObjectInstance, NonCollisionObject } from './itemsAndObjects'
import { Player, Monster, GreatPower } from './actors'
import { CombatParticipant, CombatLogEntry, Projectile } from './combat'

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

// config/types.ts - Shared type definitions
import { ImageSourcePropType } from "react-native";

export interface GameState {
  // Core game data
  level: Level; // Added: current level object
  currentLevelId: string;
  player: Player;

  // Dynamic game state
  moveCount: number;
  inCombat: boolean;
  combatTurn: any;
  attackSlots: any[];
  waitingMonsters: any[];
  turnOrder: any[];

  // Level-specific state
  activeMonsters: Monster[];
  items: any[];
  objects: any[];
  pools: any[];
  greatPowers: any[];

  // Configuration references
  levels: Record<string, Level>;
  weapons: any[];
  monsters: any[];

  // Game settings
  gridWidth: number;
  gridHeight: number;
  maxAttackers: number;

  // Save game metadata
  saveVersion: string;
  lastSaved: Date;
  playTime: number; // milliseconds
  lastAction: string;
}

export interface Position {
  row: number;
  col: number;
}

export interface Area {
  topLeft: Position;
  bottomRight: Position;
}

export type GameObject = {
  shortName: string;
  category: string;
  name: string;
  description?: string;
  damage?: number;
  hitBonus?: number;
  type?: string;
  range?: number;
  width?: number;
  height?: number;
  image?: ImageSourcePropType;
  position?: Position;
  active?: boolean;
  size?: { width: number; height: number };
  effects?: Array<{
    type: string;
    duration?: number;
    monsterType?: string;
    count?: number;
    range?: number;
    value?: number;
  }>;
  collisionMask?: Array<{
    row: number;
    col: number;
    width: number;
    height: number;
  }>;
  lastTrigger?: number;
  maxInstances?: number;
  zIndex?: number; // Added for render order
};

export interface Monster extends GameObject {
  id?: string; // Added for runtime assignment
  position: Position; // Required, overrides GameObject's optional position
  hp: number;
  maxHP: number;
  attack: number;
  ac: number;
  initiative?: number;
  moveRate: number;
  spawnRate?: number;
  spawnChance?: number;
  maxInstances?: number;
  soulKey: string;
  uiSlot?: number; // Added for combat slot assignment
  inCombatSlot?: boolean;
}

// Extended Monster interface for level instances
export interface LevelMonsterInstance extends Monster {
  id: string; // Required for level instances
  templateId: string; // Reference to the monster template
  currentHP: number; // Current HP (may differ from template)
  spawned?: boolean; // Whether this was spawned dynamically
  spawnZoneId?: string; // Which spawn zone created this monster
}

export interface Item extends GameObject {
  type: "weapon" | "consumable" | "key" | "collectible" | "building";
  collectible: boolean;
  weaponId?: string;
  healAmount?: number; // For consumables
  splash?: {
    image: string;
    text: string;
  };
}

// Extended GameObject interface for level instances
export interface LevelObjectInstance extends GameObject {
  id: string; // Unique instance ID
  templateId: string | number; // Reference to the object template
  interactable?: boolean;
  interactionType?: "door" | "chest" | "npc" | "portal";
  locked?: boolean;
  keyRequired?: string;
}

export interface Player {
  name: string;
  shortName: string;
  id: string;
  description: string;
  lastComment: string;
  image: string;
  position: Position;
  hp: number;
  maxHP: number;
  ac?: number;
  initiative: number;
  attack: number;
  isHidden: boolean;
  hideTurns: number;
  inventory: Item[];
  maxInventorySize: number;
  weapons: Array<{ id: string; equipped: boolean }>;
  maxWeaponsSize: number;
  soulKey: string;
  moveSpeed: number;
  level?: number; // Player level
  experience?: number; // Current experience points
}

// --- Effect ---
export interface Effect {
  type: "heal" | "hide" | "damage" | "buff" | "debuff"; // extend as needed
  amount?: number;
  duration?: number;
  value?: number;
  name?: string;
  magnitude?: number;
}

// --- Pool Template (blueprint) ---
export interface PoolTemplate {
  name: string;
  shortName: string;
  size: { width: number; height: number };
  description: string;
  active: boolean;
  type: "object" | "trap" | "portal";
  maxInstances: number;
  effects?: Effect[];
  decayTime?: number;
  maxUses?: number;
  image: string;
}

// --- Pool Instance (what’s actually on a level) ---
export interface PoolInstance {
  position: Position;
  effects?: Effect[];
  shortName?: string; // shortName from the template
  name?: string;
  description?: string;
  usesRemaining?: number;
  lastUsed?: number;
  image?: string;
}

// --- Footstep Template (blueprint) ---
export interface FootstepTemplate {
  name: string;
  shortName: string;
  size: { width: number; height: number };
  description: string;
  active: boolean;
  type: "object" | "clue" | "trail"; // expand categories as needed
  maxInstances: number;
  decayTime?: number; // How long footsteps last (milliseconds)
}

// --- Footstep Instance (placed on a level) ---
export interface FootstepInstance {
  id: number;
  position: Position;
  direction: number; // in degrees, e.g. 0–360
  templateId?: string; // optional link to template (shortName)
  timestamp?: number; // When the footstep was created
}

// --- Great Power (enhanced monster for major encounters) ---
export interface GreatPower extends Monster {
  awakened: boolean; // Whether this Great Power has noticed the player
  awakenCondition:
    | "player_within_range"
    | "hp_threshold"
    | "time_elapsed"
    | "item_collected";
  awakenRange?: number; // Distance for range-based awakening
  awakenThreshold?: number; // Value for threshold-based awakening
  awakenItemId?: string; // Item ID for item-based awakening
  specialAbilities?: string[]; // List of special ability IDs
}

// --- Boss Encounter (mini-level puzzle game) ---
export interface BossEncounter {
  triggerId: string; // What triggers this encounter
  name: string;
  description: string;
  type: "combat" | "puzzle" | "survival" | "stealth" | "escort";
  boardSize: { width: number; height: number };
  playerSpawn: Position;
  objectives: BossObjective[];
  rewards: BossReward[];
  timeLimit?: number; // Time limit in milliseconds
  failureConditions?: BossFailureCondition[];
  specialRules?: string[]; // Special mechanics for this encounter
}

export interface BossObjective {
  type:
    | "defeat_boss"
    | "survive_waves"
    | "reach_position"
    | "collect_item"
    | "protect_npc";
  target?: string; // Target ID (boss, item, npc, etc.)
  position?: Position; // For position-based objectives
  waves?: number; // For wave survival
  timeRequired?: number; // Time-based objectives
  description: string;
  completed?: boolean; // Runtime state
}

export interface BossReward {
  type: "experience" | "item" | "currency" | "ability";
  value?: number; // For experience/currency
  itemId?: string; // For item rewards
  abilityId?: string; // For ability rewards
}

export interface BossFailureCondition {
  type:
    | "player_death"
    | "time_expired"
    | "objective_failed"
    | "target_destroyed";
  description: string;
}

// --- Spawn Zone (for dynamic monster generation) ---
export interface SpawnZone {
  id: string;
  area: Area;
  monsterTypes: string[]; // Array of monster template shortNames
  spawnRate: number; // Chance per time interval (0.0 to 1.0)
  maxMonsters: number; // Maximum monsters this zone can have active
  minPlayerDistance: number; // Minimum distance from player to spawn
  active?: boolean; // Whether this zone is currently active
  cooldownTime?: number; // Time between spawn attempts (milliseconds)
  lastSpawnAttempt?: number; // Timestamp of last spawn attempt
}

// --- Level Completion Conditions ---
export interface CompletionCondition {
  type:
    | "reach_position"
    | "defeat_all_monsters"
    | "collect_item"
    | "defeat_boss"
    | "survive_time";
  position?: Position; // For position-based completion
  itemId?: string; // For item collection
  bossId?: string; // For boss defeat
  timeRequired?: number; // For time-based completion
  description?: string;
  completed?: boolean; // Runtime state
}

// --- Enhanced Level Interface ---
export interface Level {
  id: string;
  name: string;
  description?: string;

  // Board configuration
  boardSize: { width: number; height: number };
  playerSpawn: Position;

  // Level progression
  requiredLevel?: number; // Minimum player level to enter
  recommendedLevel?: number; // Recommended player level
  experienceReward?: number; // XP awarded for completion

  // Environment settings
  ambientLight?: number; // 0.0 = pitch black, 1.0 = full light
  weatherEffect?: string | null; // Weather effect ID
  backgroundMusic?: string; // Background music track ID

  // Level content
  items: Item[];
  monsters: LevelMonsterInstance[];
  objects: LevelObjectInstance[];
  pools: PoolInstance[];
  poolTemplates: PoolTemplate[]; // multiple templates allowed
  footsteps: FootstepInstance[];
  footstepsTemplate: FootstepTemplate;
  greatPowers?: GreatPower[];

  // Boss encounter (mini-level)
  bossEncounter?: BossEncounter;

  // Level progression
  completionConditions?: CompletionCondition[];

  // Dynamic content
  spawnZones?: SpawnZone[];

  // Metadata
  version?: string; // For save compatibility
  lastModified?: Date; // When the level was last updated
}

// --- Weather Effects ---
export interface WeatherEffect {
  id: string;
  name: string;
  description: string;
  visibility: number; // Visibility modifier (0.0 to 1.0)
  movementModifier: number; // Movement speed modifier
  ambientSoundEffect?: string;
  particleEffect?: string;
}

// --- Save Game Related Types ---
export interface SaveGameMetadata {
  version: string;
  playerName: string;
  currentLevel: string;
  playTime: number; // Total play time in milliseconds
  lastSaved: Date;
  gameMode?: string; // Normal, hardcore, etc.
  difficulty?: string; // Easy, normal, hard
}

// --- Combat Related Types ---
export interface CombatParticipant {
  id: string;
  type: "player" | "monster" | "npc";
  position: Position;
  initiative: number;
  hp: number;
  maxHP: number;
  ac: number;
  attack: number;
  actions: CombatAction[];
  statusEffects: StatusEffect[];
}

export interface CombatAction {
  id: string;
  name: string;
  type: "attack" | "move" | "defend" | "special";
  cost: number; // Action points required
  range: number;
  damage?: number;
  effects?: Effect[];
}

export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration: number; // Turns remaining
  effects: Effect[];
  stackable: boolean;
}

import { ImageSourcePropType } from "react-native";

export interface Position {
  row: number;
  col: number;
}

export interface Area {
  topLeft: Position;
  bottomRight: Position;
}

export interface GameObject {
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
  effects?: Effect[];
  collisionMask?: Array<{
    row: number;
    col: number;
    width: number;
    height: number;
  }>;
  lastTrigger?: number;
  maxInstances?: number;
  zIndex?: number;
}

export interface Monster extends GameObject {
  id?: string;
  position: Position;
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
  uiSlot?: number;
  inCombatSlot?: boolean;
}
export interface GreatPower extends GameObject {
  id: string;
  name: string;
  position: Position;
  hp: number;
  maxHP: number;
  attack: number;
  ac: number;
  awakened: boolean;
  awakenCondition: string;
  soulKey?: string;
}

export interface LevelMonsterInstance extends Monster {
  id: string;
  templateId?: string;
  currentHP: number;
  spawned?: boolean;
  spawnZoneId?: string;
}

export interface Item extends GameObject {
  type: "weapon" | "consumable" | "key" | "collectible" | "building";
  collectible: boolean;
  id?: string;
  weaponId?: string;
  healAmount?: number;
  damage?: number;
  splash?: {
    image: string;
    text: string;
  };
  usable?: boolean;
  consumeOnUse?: boolean; // Renamed to avoid confusion with type
  maxUses?: number;
  currentUses?: number;
}

export interface LevelObjectInstance extends GameObject {
  id: string;
  templateId?: string | number;
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
  level?: number;
  experience?: number;
}

export interface Effect {
  type:
    | "damage"
    | "heal"
    | "stun"
    | "poison"
    | "buff"
    | "debuff"
    | "summon"
    | "teleport"
    | "spawn"
    | "destroy"
    | "activate"
    | "deactivate"
    | "quest_complete"
    | "quest_failed"
    | "target_destroyed"
    | "swarm" // Add swarm for existing code
    | "hide"; // Add hide for existing code

  description?: string;

  // Numeric values
  value?: number; // Primary effect value (heal amount, damage, etc.)
  duration?: number; // Duration in turns/seconds
  range?: number; // Effect range in grid units
  count?: number; // Number of spawned entities
  amount?: number; // Alternative to value for clarity

  // Target specification
  target?: "self" | "enemy" | "ally" | "area" | "all";
  targetId?: string; // Specific target ID

  // Spawn/summon properties
  monsterType?: string; // Type of monster to spawn
  entityId?: string; // ID of entity to summon/create

  // Position and area effects
  position?: Position; // Specific position for effect
  area?: Area; // Area of effect

  // Conditional logic
  condition?: {
    type: "hp_below" | "hp_above" | "has_item" | "level_check" | "random";
    value?: number;
    probability?: number; // 0-1 for random conditions
    itemId?: string;
  };

  // Status effects
  statusEffect?: {
    id: string;
    name: string;
    icon?: string;
    stackable?: boolean;
    maxStacks?: number;
  };

  // Resource costs
  cost?: {
    hp?: number;
    mp?: number;
    stamina?: number;
    item?: string;
    quantity?: number;
  };

  // Success/failure messaging
  successMessage?: string;
  failureMessage?: string;

  // Cooldown and usage limits
  cooldown?: number; // Cooldown in turns
  maxUses?: number; // Max uses per item/ability
  currentUses?: number; // Current usage count

  // Animation and visual effects
  animation?: {
    type: string;
    duration: number;
    color?: string;
    particle?: string;
  };

  // Sound effects
  sound?: {
    trigger: string;
    success?: string;
    failure?: string;
  };
}

export interface SpawnZone {
  id: string;
  area: Area;
  monsterTypes: string[];
  spawnRate: number;
  maxMonsters: number;
  minPlayerDistance: number;
  active?: boolean;
  cooldownTime?: number;
  lastSpawnAttempt?: number;
}

export interface CompletionCondition {
  type:
    | "reach_position"
    | "defeat_all_monsters"
    | "collect_item"
    | "defeat_boss"
    | "survive_time";
  position?: Position;
  itemId?: string;
  bossId?: string;
  timeRequired?: number;
  description?: string;
  completed?: boolean;
}

export interface PoolInstance {
  id: string;
  position: Position;
  image: string;
  shortName?: string;
  name?: string;
  active?: boolean;
  size?: { width: number; height: number };
  effects?: Effect[];
}

export interface PoolTemplate {
  maxInstances: number;
  shortName?: string;
  image: string;
  name?: string;
  size?: { width: number; height: number };
  effects?: Effect[];
}

export interface FootstepInstance {
  id: number;
  position: Position;
  direction: number;
  templateId: string;
}

export interface FootstepTemplate {
  id: string;
  name: string;
  shortName: string;
  size?: { width: number; height: number };
  maxInstances: number;
  description?: string;
  image: string;
  type?: string;
}

export interface BossEncounter {
  id: string;
}

export interface Level {
  id: string;
  name: string;
  description?: string;
  boardSize: { width: number; height: number };
  playerSpawn: Position;
  requiredLevel?: number;
  recommendedLevel?: number;
  experienceReward?: number;
  ambientLight?: number;
  weatherEffect?: string | null;
  backgroundMusic?: string;
  items: Item[];
  monsters: LevelMonsterInstance[];
  objects: LevelObjectInstance[];
  pools: PoolInstance[];
  poolTemplates: PoolTemplate[];
  footsteps: FootstepInstance[];
  footstepsTemplate: FootstepTemplate;
  greatPowers?: GreatPower[];
  bossEncounter?: BossEncounter;
  completionConditions?: CompletionCondition[];
  spawnZones?: SpawnZone[];
  version?: string;
  lastModified?: Date;
}

export interface SaveGameMetadata {
  version: string;
  playerName: string;
  currentLevel: string;
  playTime: number;
  lastSaved: Date;
  gameMode?: string;
  difficulty?: string;
}

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
  cost: number;
  range: number;
  damage?: number;
  effects?: Effect[];
}

export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration: number;
  effects: Effect[];
  stackable: boolean;
}

export interface CombatLogEntry {
  id: string;
  message: string;
  turn: number;
}

export interface GameState {
  gameOver?: boolean;
  level: Level;
  currentLevelId: string;
  player: Player;
  moveCount: number;
  inCombat: boolean;
  combatTurn: CombatParticipant | null;
  attackSlots: Monster[];
  waitingMonsters: Monster[];
  turnOrder: CombatParticipant[];
  combatLog: CombatLogEntry[];
  activeMonsters: Monster[];
  items: Item[];
  objects: LevelObjectInstance[];
  pools: PoolInstance[];
  greatPowers: GreatPower[];
  poolsTemplate: PoolTemplate[];
  footsteps: FootstepInstance[];
  footstepsTemplate: FootstepTemplate;
  levels: Record<string, Level>;
  weapons: Item[];
  monsters: LevelMonsterInstance[];
  gridWidth: number;
  gridHeight: number;
  maxAttackers: number;
  saveVersion: string;
  lastSaved: Date;
  playTime: number;
  lastAction: string;
  showInventory?: boolean;
  showWeaponsInventory?: boolean;
  dropSuccess?: boolean;
  dialogData?: any;
  audioStarted?: boolean;
}

// config/types.ts - Shared type definitions
export interface Position {
  row: number;
  col: number;
}
// config/types.ts - Shared type definitions
export interface Position {
  row: number;
  col: number;
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
  image: string | null;
  position?: Position;
  active?: boolean;
  size?: { width: number; height: number };

  effects?: Array<{
    type: string;
    duration?: number;
    monsterType?: string;
    count?: number;
    range?: number;
  }>;
  collisionMask?: Array<{
    row: number;
    col: number;
    width: number;
    height: number;
  }>;
  lastTrigger?: number;
  maxInstances?: number;
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
}

export interface Item extends GameObject {
  type: "weapon" | "consumable" | "key" | "collectible" | "building";
  collectible: boolean;
  weaponId?: string;
  splash?: {
    image: string;
    text: string;
  };
}

export interface Player {
  name: string;
  id: string;
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
  weapons: Array<{ id: string; equipped: boolean }>;
  soulKey: string;
  moveSpeed: number;
}

// --- Effect ---
export interface Effect {
  type: "heal" | "hide" | "damage" | "buff" | "debuff"; // extend as needed
  amount?: number;
  duration?: number;
}

// --- Pool Template (the blueprint) ---
export interface PoolTemplate {
  name: string;
  shortName: string;
  size: { width: number; height: number };
  description: string;
  active: boolean;
  type: "object" | "trap" | "portal"; // add categories if needed
  maxInstances: number;
  effects: Effect[];
}

// --- Pool Instance (what’s actually on a level) ---
export interface PoolInstance {
  position: Position;
  effects: Effect[];
  templateId?: string; // optional link back to a template (shortName is handy)
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
}

// --- Footstep Instance (placed on a level) ---
export interface FootstepInstance {
  id: number;
  position: Position;
  direction: number; // in degrees, e.g. 0–360
  templateId?: string; // optional link to template (shortName)
}

export interface Level {
  id: string;
  name: string;
  boardSize: { width: number; height: number };
  playerSpawn: Position;
  items: Item[];
  monsters: Monster[];
  objects: GameObject[];
  pools: PoolInstance[];
  poolTemplates: PoolTemplate[]; // multiple templates allowed
  footsteps: FootstepInstance[];
  footstepsTemplate: FootstepTemplate;
  greatPowers?: Monster[];
}

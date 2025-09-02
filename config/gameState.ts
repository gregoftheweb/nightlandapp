// config/gameState.ts - Runtime game state structure
import { Player, Level } from './types';
import { playerConfig } from './player';
import { levels } from './levels';
import { gameConfig } from './gameConfig';

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
  activeMonsters: any[];
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
}

export const createInitialGameState = (levelId: string = "1"): GameState => {
  const level = levels[levelId];
  if (!level) {
    throw new Error(`Level ${levelId} not found`);
  }

  return {
    level, // Added here
    currentLevelId: levelId,
    player: {
      ...playerConfig,
      position: level.playerSpawn,
    },
    moveCount: 0,
    inCombat: false,
    combatTurn: null,
    attackSlots: [],
    waitingMonsters: [],
    turnOrder: [],
    activeMonsters: [],
    items: [...level.items],
    objects: [...level.objects],
    pools: level.pools || [],
    greatPowers: level.greatPowers || [],
    levels: levels,
    weapons: [], // Load from weapons config if needed
    monsters: level.monsters,
    gridWidth: gameConfig.grid.width,
    gridHeight: gameConfig.grid.height,
    maxAttackers: gameConfig.combat.maxAttackers,
    saveVersion: "1.0.0",
    lastSaved: new Date(),
    playTime: 0,
  };
};

// Save game functionality
export const serializeGameState = (gameState: GameState): string => {
  return JSON.stringify({
    ...gameState,
    lastSaved: gameState.lastSaved.toISOString(),
  }, null, 2);
};

export const deserializeGameState = (saveData: string): GameState => {
  const parsed = JSON.parse(saveData);
  return {
    ...parsed,
    lastSaved: new Date(parsed.lastSaved),
  };
};

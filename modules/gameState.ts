// modules/gameState.ts - State management and initialization only
import { levels } from "../config/levels";
import { GameState, Level } from "../config/types";
import { playerConfig } from "../config/player";
import { reducer } from "./reducers";
import { initializeStartingMonsters } from "./gameLoop";

export const getInitialState = (levelId: string = "1"): GameState => {
  const levelConfig = levels[levelId] as Level;
  return {
    // Core game data
    level: levelConfig,
    currentLevelId: levelId,
    player: {
      ...playerConfig,
      position: playerConfig.position || { row: 0, col: 0 },
    },
    
    // Dynamic game state
    moveCount: 0,
    inCombat: false,
    combatTurn: null,
    attackSlots: [],
    waitingMonsters: [],
    turnOrder: [],

    // Level-specific state
    activeMonsters: [],
    items: levelConfig.items || [],
    objects: levelConfig.objects || [],
    pools: levelConfig.pools || [],
    greatPowers: levelConfig.greatPowers || [],

    // Configuration references
    levels: { [levelId]: levelConfig },
    weapons: [
      {
        id: "weapon-discos-001",
        shortName: "discos",
        name: "Discos",
        description: "Physically paired with Christos, powered by the Earth Current. This is a pole arm with a spinning blue disc of death for the evil monsters of the Night Land.",
        damage: { min: 2, max: 12 },
        attack: 1,
        toHit: 2,
        effects: [],
      },
      {
        id: "weapon-shortsword-002",
        shortName: "shortsword",
        name: "Short Sword",
        description: "A simple blade forged in the Last Redoubt, sharp and reliable against the lesser horrors.",
        damage: { min: 1, max: 6 },
        attack: 0,
        toHit: 0,
        effects: [],
      },
    ],
    monsters: levelConfig.monsters || [],

    // Game settings
    gridWidth: 400,
    gridHeight: 400,
    maxAttackers: 4,

    // Save game metadata
    saveVersion: "1.0",
    lastSaved: new Date(),
    playTime: 0,
    lastAction: "",
  };
};

export const initialState = getInitialState("1");

export const createInitialGameState = (levelId: string = "1"): GameState => {
  return getInitialState(levelId);
};

// ==================== SERIALIZATION ====================

export const serializeGameState = (state: GameState): string => {
  return JSON.stringify(state);
};

export const deserializeGameState = (serializedState: string): GameState => {
  try {
    const parsedState = JSON.parse(serializedState);
    return {
      ...initialState,
      ...parsedState,
      level: parsedState.level || initialState.level,
      player: {
        ...initialState.player,
        ...parsedState.player,
      },
      levels: {
        ...initialState.levels,
        ...parsedState.levels,
      },
    };
  } catch (e) {
    console.error("Failed to deserialize game state:", e);
    return initialState;
  }
};

// Export the reducer from the separate file
export { reducer };
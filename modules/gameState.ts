// modules/gameState.ts
import { levels } from "../config/levels";
import { GameState, Level, FootstepTemplate } from "../config/types";
import { playerConfig } from "../config/player";
import { reducer } from "./reducers";
import { initializeStartingMonsters } from "./turnManager";

export const getInitialState = (levelId: string = "1"): GameState => {
  const levelConfig = levels[levelId] as Level;
  return {
    level: levelConfig,
    currentLevelId: levelId,
    player: {
      ...playerConfig,
      position: playerConfig.position || { row: 0, col: 0 },
    },
    moveCount: 0,
    inCombat: false,
    combatTurn: null,
    attackSlots: [],
    waitingMonsters: [],
    turnOrder: [],
    combatLog: [],
    activeMonsters: [],
    items: levelConfig.items || [],
    objects: levelConfig.objects || [],
    greatPowers: levelConfig.greatPowers || [],
    footsteps: levelConfig.footsteps || [],
    footstepsTemplate: levelConfig.footstepsTemplate || [],
    levels: { [levelId]: levelConfig },
    weapons: [
      {
        id: "weapon-discos-001",
          category: "weapon",
        shortName: "discos",
        name: "Discos",
        description: "Physically paired with Christos, powered by the Earth Current. This is a pole arm with a spinning blue disc of death for the evil monsters of the Night Land.",
        damage: 10,
        hitBonus: 2,
        effects: [],
        type: "weapon",
        collectible: true,
      },
      {
        id: "weapon-shortsword-002",
          category: "weapon",
        shortName: "shortsword",
        name: "Short Sword",
        description: "A simple blade forged in the Last Redoubt, sharp and reliable against the lesser horrors.",
        damage: 6,
        hitBonus: 0,
        effects: [],
        type: "weapon",
        collectible: true,
      },
    ],
    monsters: levelConfig.monsters || [],
    gridWidth: 400,
    gridHeight: 400,
    maxAttackers: 4,
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
      combatLog: parsedState.combatLog || [],
      poolsTemplate: parsedState.poolsTemplate || [],
      footsteps: parsedState.footsteps || [],
      footstepsTemplate: parsedState.footstepsTemplate || { maxInstances: 0 },
    };
  } catch (e) {
    console.error("Failed to deserialize game state:", e);
    return initialState;
  }
};

export { reducer };
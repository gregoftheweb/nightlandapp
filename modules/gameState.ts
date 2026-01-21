// modules/gameState.ts
import { levels } from '../config/levels'
import { GameState, Level } from '../config/types'
import { playerConfig } from '../config/player'
import { weaponsCatalog } from '../config/weapons'
import { gameConfig } from '../config/gameConfig'
import { reducer } from './reducers'
import { initializeStartingMonsters } from './turnManager'

export const getInitialState = (levelId: string = '1'): GameState => {
  const levelConfig = levels[levelId] as Level
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
    nonCollisionObjects: levelConfig.nonCollisionObjects || [],
    levels: { [levelId]: levelConfig },
    weapons: weaponsCatalog, // Import from centralized config
    monsters: levelConfig.monsters || [],
    gridWidth: gameConfig.grid.width,
    gridHeight: gameConfig.grid.height,
    maxAttackers: gameConfig.combat.maxAttackers,
    saveVersion: gameConfig.save.version,
    lastSaved: new Date(),
    playTime: 0,
    lastAction: '',
    monstersKilled: 0,
    distanceTraveled: 0,
    rangedAttackMode: false,
    targetedMonsterId: null,
    activeProjectiles: [],
    subGamesCompleted: {},
  }
}

export const initialState = getInitialState('1')

export const createInitialGameState = (levelId: string = '1'): GameState => {
  return getInitialState(levelId)
}

export const serializeGameState = (state: GameState): string => {
  return JSON.stringify(state)
}

export const deserializeGameState = (serializedState: string): GameState => {
  try {
    const parsedState = JSON.parse(serializedState)
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
      nonCollisionObjects: parsedState.nonCollisionObjects || [],
      activeProjectiles: parsedState.activeProjectiles || [],
    }
  } catch (e) {
    console.error('Failed to deserialize game state:', e)
    return initialState
  }
}

export { reducer }

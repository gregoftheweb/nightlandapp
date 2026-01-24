// modules/gameState.ts
/**
 * GameState Management Module
 * 
 * This module provides the single source of truth for game state initialization,
 * serialization, and reset operations. It ensures type safety and consistency
 * across the application.
 * 
 * Key Functions:
 * - getInitialState(): Creates a fresh initial state for a given level
 * - toSnapshot(): Converts GameState to a JSON-serializable format
 * - fromSnapshot(): Reconstructs GameState from a snapshot (for future save/load)
 * - validateGameState(): Development-only state validation
 */
import { levels } from '../config/levels'
import { GameState, GameSnapshot } from '../config/types'
import { playerConfig } from '../config/player'
import { weaponsCatalog } from '../config/weapons'
import { gameConfig } from '../config/gameConfig'
import { reducer } from './reducers'
import { logIfDev } from './utils'

/**
 * Creates a fresh initial game state for a given level.
 * This is the single source of truth for the default/initial state.
 * 
 * @param levelId - The level ID to initialize (defaults to '1')
 * @returns A complete, fresh GameState object
 */
export const getInitialState = (levelId: string = '1'): GameState => {
  // Type-safe level lookup with validation
  const levelConfig = levels[levelId as keyof typeof levels]
  
  if (!levelConfig) {
    logIfDev(`⚠️  Unknown levelId: ${levelId}, falling back to level 1`)
    return getInitialState('1') // Recursively call with valid level
  }

  logIfDev(`🎮 Creating initial state for level: ${levelId}`)

  return {
    // ===== LEVEL DOMAIN =====
    level: levelConfig,
    currentLevelId: levelId,
    levels: { [levelId]: levelConfig },
    items: levelConfig.items || [],
    objects: levelConfig.objects || [],
    greatPowers: levelConfig.greatPowers || [],
    nonCollisionObjects: levelConfig.nonCollisionObjects || [],
    monsters: levelConfig.monsters || [],
    gridWidth: gameConfig.grid.width,
    gridHeight: gameConfig.grid.height,

    // ===== PLAYER DOMAIN =====
    player: {
      ...playerConfig,
      position: playerConfig.position || { row: 0, col: 0 },
    },
    moveCount: 0,
    distanceTraveled: 0,
    selfHealTurnCounter: 0,

    // ===== COMBAT DOMAIN =====
    inCombat: false,
    combatTurn: null,
    activeMonsters: [],
    attackSlots: [],
    waitingMonsters: [],
    turnOrder: [],
    combatLog: [],
    maxAttackers: gameConfig.combat.maxAttackers,
    monstersKilled: 0,

    // ===== RANGED COMBAT =====
    rangedAttackMode: false,
    targetedMonsterId: null,
    activeProjectiles: [],

    // ===== UI DOMAIN =====
    showInventory: false,
    showWeaponsInventory: false,
    dropSuccess: false,
    dialogData: undefined,
    audioStarted: false,

    // ===== DEATH/GAME OVER DOMAIN =====
    gameOver: false,
    gameOverMessage: undefined,
    killerName: undefined,
    suppressDeathDialog: false,

    // ===== META/PERSISTENCE DOMAIN =====
    weapons: weaponsCatalog,
    saveVersion: gameConfig.save.version,
    lastSaved: new Date(),
    playTime: 0,
    lastAction: '',
    subGamesCompleted: {}, // Decision: Reset on death for "fresh run" experience
  }
}

/**
 * The canonical initial state. All resets should derive from getInitialState(),
 * not from this constant, to ensure fresh state generation.
 */
export const initialState = getInitialState('1')

/**
 * Legacy alias for getInitialState. Deprecated - use getInitialState() directly.
 * @deprecated Use getInitialState() instead
 */
export const createInitialGameState = (levelId: string = '1'): GameState => {
  return getInitialState(levelId)
}

/**
 * Converts GameState to a JSON-serializable snapshot.
 * This excludes non-serializable fields like Date objects and prepares
 * the state for persistence (e.g., AsyncStorage, file save).
 * 
 * @param state - The current game state
 * @returns A JSON-serializable GameSnapshot
 */
export const toSnapshot = (state: GameState): GameSnapshot => {
  return {
    ...state,
    lastSaved: state.lastSaved.toISOString(), // Convert Date to ISO string
    // Note: Image refs in level/objects/items are already ImageSourcePropType (serializable)
  }
}

/**
 * Reconstructs GameState from a serialized snapshot.
 * Currently returns initialState as a stub. Will be expanded when save/load is implemented.
 * 
 * @param snapshot - The serialized game snapshot
 * @returns A reconstructed GameState
 */
export const fromSnapshot = (snapshot: GameSnapshot): GameState => {
  // TODO: Implement full deserialization when save/load is added
  // For now, return fresh state (this is a stub for future implementation)
  logIfDev('⚠️  fromSnapshot is not fully implemented yet, returning fresh initial state')
  return getInitialState(snapshot.currentLevelId || '1')
}

/**
 * Legacy serialization function. Deprecated - use toSnapshot() instead.
 * @deprecated Use toSnapshot() instead
 */
export const serializeGameState = (state: GameState): string => {
  return JSON.stringify(toSnapshot(state))
}

/**
 * Legacy deserialization function. Deprecated - use fromSnapshot() instead.
 * @deprecated Use fromSnapshot() instead
 */
export const deserializeGameState = (serializedState: string): GameState => {
  try {
    const snapshot: GameSnapshot = JSON.parse(serializedState)
    return fromSnapshot(snapshot)
  } catch (e) {
    console.error('Failed to deserialize game state:', e)
    return initialState
  }
}

/**
 * Validates GameState structure in development builds.
 * Checks for required fields and type consistency.
 * 
 * @param state - The state to validate
 * @param actionType - The action that produced this state (for logging)
 */
export const validateGameState = (state: GameState, actionType?: string): void => {
  if (!__DEV__) return // Only run in development

  const errors: string[] = []

  // Validate critical fields exist
  if (!state.player) errors.push('player is missing')
  if (!state.level) errors.push('level is missing')
  if (typeof state.inCombat !== 'boolean') errors.push('inCombat must be boolean')
  if (!Array.isArray(state.activeMonsters)) errors.push('activeMonsters must be array')
  if (!Array.isArray(state.combatLog)) errors.push('combatLog must be array')
  if (!Array.isArray(state.activeProjectiles)) errors.push('activeProjectiles must be array')

  // Validate player structure
  if (state.player) {
    if (!state.player.position) errors.push('player.position is missing')
    if (typeof state.player.hp !== 'number') errors.push('player.hp must be number')
    if (typeof state.player.maxHP !== 'number') errors.push('player.maxHP must be number')
  }

  // Validate combat state consistency
  if (state.inCombat && state.activeMonsters.length === 0) {
    errors.push('inCombat is true but activeMonsters is empty')
  }

  if (errors.length > 0) {
    console.error(`❌ GameState validation failed${actionType ? ` after ${actionType}` : ''}:`)
    errors.forEach(err => console.error(`  - ${err}`))
  }
}

export { reducer }

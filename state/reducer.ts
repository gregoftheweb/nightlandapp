// state/reducer.ts
/**
 * GameState Reducer
 *
 * This is the central reducer that handles all game state transitions.
 * All reducer cases must be pure functions that do not mutate the state.
 *
 * Key Principles:
 * - Pure functions: No mutations, always return new state
 * - Single source of truth: Use getInitialState() for resets
 * - Comprehensive logging: Log key state transitions in dev mode
 * - Type safety: Avoid unsafe casts when possible
 */
import { GameState } from '../config/types'
import { getInitialState } from '../modules/gameState'
import { reduceLevel } from './slices/levelSlice'
import { reduceMovement } from './slices/movementSlice'
import { reduceMonsters } from './slices/monstersSlice'
import { reduceCombat } from './slices/combatSlice'
import { reduceCombatLog } from './slices/combatLogSlice'
import { reducePlayer } from './slices/playerSlice'
import { reduceInventory } from './slices/inventorySlice'
import { reduceWeapons } from './slices/weaponsSlice'
import { reduceItems } from './slices/itemsSlice'
import { reduceHide } from './slices/hideSlice'
import { reduceUI } from './slices/uiSlice'
import { reduceSave } from './slices/saveSlice'

export const reducer = (state: GameState = getInitialState('1'), action: any): GameState => {
  // Try each slice reducer in order
  // Each slice returns the new state if it handles the action, or null otherwise
  const sliceReducers = [
    reduceLevel,
    reduceMovement,
    reduceMonsters,
    reduceCombat,
    reduceCombatLog,
    reducePlayer,
    reduceInventory,
    reduceWeapons,
    reduceItems,
    reduceHide,
    reduceUI,
    reduceSave,
  ]

  for (const sliceReducer of sliceReducers) {
    const result = sliceReducer(state, action)
    if (result !== null) {
      return result
    }
  }

  // If no slice handled the action, warn and return unchanged state
  if (__DEV__) {
    console.warn(`⚠️  Unhandled action type: ${action.type}`)
  }
  return state
}

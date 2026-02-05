// state/slices/combatSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'
import { getInitialState } from '../../modules/gameState'

export function reduceCombat(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'SET_COMBAT':
      logIfDev(`🎯 SET_COMBAT dispatched, inCombat: ${action.payload.inCombat}`)

      // Check if we're exiting combat
      const exitingCombat = !action.payload.inCombat && state.inCombat
      // Check if there are any living monsters remaining
      const hasRemainingMonsters =
        action.payload.attackSlots.length > 0 ||
        state.activeMonsters.some((m) => m.currentHP > 0)

      // Determine if we should clear ranged mode
      // Clear when: entering combat OR exiting combat with no monsters left
      const shouldClearRangedMode =
        action.payload.inCombat || (exitingCombat && !hasRemainingMonsters)

      return {
        ...state,
        inCombat: action.payload.inCombat,
        attackSlots: action.payload.attackSlots,
        waitingMonsters: action.payload.waitingMonsters || [],
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
        combatLog: action.payload.inCombat ? state.combatLog || [] : [],
        // Clear ranged attack mode when entering combat OR when exiting combat with no monsters left
        rangedAttackMode: shouldClearRangedMode ? false : state.rangedAttackMode,
        targetedMonsterId: shouldClearRangedMode ? null : state.targetedMonsterId,
      }

    case 'START_COMBAT':
      return {
        ...state,
        inCombat: true,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.monster?.id ? { ...monster, inCombatSlot: true } : monster
        ),
      }

    case 'UPDATE_TURN':
      return {
        ...state,
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
      }

    case 'UPDATE_MONSTER':
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id ? { ...monster, ...action.payload.updates } : monster
        ),
        attackSlots: state.attackSlots.map((slot) =>
          slot.id === action.payload.id ? { ...slot, ...action.payload.updates } : slot
        ),
      }

    case 'GAME_OVER': {
      // Mark the player as dead and clear combat state
      // Full reset happens when RESET_GAME is dispatched from death screen
      logIfDev(`💀 GAME_OVER: ${action.payload?.message || 'Player died'}`)
      logIfDev(`   Killer: ${action.payload?.killerName || 'unknown'}`)

      return {
        ...state,
        gameOver: true,
        gameOverMessage: action.payload?.message || 'You have been defeated.',
        killerName: action.payload?.killerName || 'unknown horror',
        suppressDeathDialog: action.payload?.suppressDeathDialog || false,
        inCombat: false,
        attackSlots: [],
        waitingMonsters: [],
        turnOrder: [],
        combatTurn: null,
        combatLog: [],
        activeMonsters: [], // Clear all active monsters
      }
    }

    case 'RESET_GAME': {
      /**
       * Complete game reset to initial state.
       * This is triggered from the death screen or manual restart.
       *
       * Decision: Reset ALL state including sub-game completion flags
       * to provide a "fresh run" experience. Players who died should
       * start from scratch, including re-completing sub-games.
       *
       * If we want to preserve sub-game progress across deaths in the future,
       * we can modify this to:
       *   const preservedFlags = state.subGamesCompleted
       *   return { ...getInitialState('1'), subGamesCompleted: preservedFlags }
       */
      logIfDev('🔄 RESET_GAME: Resetting to fresh initial state')

      // Return a FRESH initial state (not the stale initialState constant)
      return getInitialState('1')
    }

    default:
      return null
  }
}

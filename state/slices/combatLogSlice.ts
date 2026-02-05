// state/slices/combatLogSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceCombatLog(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'ADD_COMBAT_LOG':
      logIfDev('ADD_COMBAT_LOG dispatched:', action.payload)
      return {
        ...state,
        combatLog: [
          ...(state.combatLog || []),
          {
            id: `${Date.now()}-${Math.random()}`,
            message: action.payload.message,
            turn: state.moveCount,
          },
        ],
      }

    case 'CLEAR_COMBAT_LOG':
      logIfDev('🎯 CLEAR_COMBAT_LOG dispatched')
      return {
        ...state,
        combatLog: [],
      }

    default:
      return null
  }
}

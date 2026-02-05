// state/slices/playerSlice.ts
import { GameState } from '../../config/types'

export function reducePlayer(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'UPDATE_PLAYER':
      return {
        ...state,
        player: { ...state.player, ...action.payload.updates },
      }

    case 'UPDATE_SELF_HEAL_COUNTER':
      return {
        ...state,
        selfHealTurnCounter: action.payload.counter,
      }

    default:
      return null
  }
}

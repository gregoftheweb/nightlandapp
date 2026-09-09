// state/slices/playerSlice.ts
import { GameState } from '../../config/types'
import { toIntegerTilePosition } from '../../modules/playerPosition'

export function reducePlayer(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'DECREMENT_STRENGTH_BOOST': {
      const rounds = Math.max(0, (state.player.strengthBoostRounds ?? 0) - 1)
      return {
        ...state,
        player: {
          ...state.player,
          strengthBoostRounds: rounds,
          strengthDamageMultiplier: rounds > 0 ? state.player.strengthDamageMultiplier : 1,
        },
      }
    }
    case 'UPDATE_PLAYER':
      return {
        ...state,
        player: {
          ...state.player,
          ...action.payload.updates,
          ...(action.payload.updates.position
            ? { position: toIntegerTilePosition(action.payload.updates.position) }
            : {}),
        },
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

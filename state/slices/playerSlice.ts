// state/slices/playerSlice.ts
import { GameState } from '../../config/types'
import { toIntegerTilePosition } from '../../modules/playerPosition'

export function reducePlayer(state: GameState, action: any): GameState | null {
  switch (action.type) {
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

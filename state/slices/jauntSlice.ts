// state/slices/jauntSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceJaunt(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'PLAYER_JAUNT_REQUESTED': {
      const { canJaunt } = state.player

      // Can't jaunt if not unlocked
      if (!canJaunt) {
        logIfDev('[Jaunt] Cannot jaunt - ability not unlocked')
        return state
      }

      // Stub implementation - actual jaunt behavior to be implemented in next prompt
      logIfDev('[Jaunt] Jaunt requested - stub handler (no action taken)')
      return state
    }

    default:
      return null
  }
}

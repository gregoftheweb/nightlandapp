// state/slices/saveSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceSave(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'SET_SUB_GAME_COMPLETED':
      logIfDev(
        `🎮 SET_SUB_GAME_COMPLETED: ${action.payload.subGameName} = ${action.payload.completed}`
      )
      return {
        ...state,
        subGamesCompleted: {
          ...(state.subGamesCompleted || {}),
          [action.payload.subGameName]: action.payload.completed,
        },
      }

    case 'HYDRATE_GAME_STATE':
      logIfDev('💾 HYDRATE_GAME_STATE: Loading saved game state')
      logIfDev(`💾 Current state moveCount: ${state.moveCount}`)
      logIfDev(`💾 New state moveCount: ${action.payload.state.moveCount}`)
      logIfDev(`💾 Current state player position: ${JSON.stringify(state.player?.position)}`)
      logIfDev(
        `💾 New state player position: ${JSON.stringify(action.payload.state.player?.position)}`
      )
      // Replace entire state with loaded state (fromSnapshot already handles cleanup)
      return action.payload.state

    case 'SET_WAYPOINT_CREATED':
      logIfDev(`💾 SET_WAYPOINT_CREATED: ${action.payload.waypointName}`)
      return {
        ...state,
        waypointSavesCreated: {
          ...(state.waypointSavesCreated || {}),
          [action.payload.waypointName]: true,
        },
      }

    default:
      return null
  }
}

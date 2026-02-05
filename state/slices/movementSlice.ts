// state/slices/movementSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceMovement(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'MOVE_PLAYER':
      if (state.inCombat) {
        logIfDev('Player cannot move while in combat')
        return state
      }
      let newPlayerPos
      if (action.payload.position) {
        newPlayerPos = action.payload.position
      } else if (action.payload.direction) {
        const currentPos = state.player.position
        if (!currentPos) {
          if (__DEV__) {
            console.error('Player position is undefined!')
          }
          return state
        }
        let newRow = currentPos.row
        let newCol = currentPos.col
        switch (action.payload.direction) {
          case 'up':
            newRow = Math.max(0, currentPos.row - 1)
            break
          case 'down':
            newRow = Math.min(state.gridHeight - 1, currentPos.row + 1)
            break
          case 'left':
            newCol = Math.max(0, currentPos.col - 1)
            break
          case 'right':
            newCol = Math.min(state.gridWidth - 1, currentPos.col + 1)
            break
          default:
            if (__DEV__) {
              console.warn('Unknown direction:', action.payload.direction)
            }
            return state
        }
        newPlayerPos = { row: newRow, col: newCol }
      } else {
        if (__DEV__) {
          console.error('MOVE_PLAYER: No position or direction provided')
        }
        return state
      }
      const oldPosition = state.player.position
      const newState = {
        ...state,
        player: {
          ...state.player,
          position: newPlayerPos,
        },
      }

      const distanceMoved =
        Math.abs(newPlayerPos.row - oldPosition.row) + Math.abs(newPlayerPos.col - oldPosition.col)
      if (distanceMoved > 0) {
        newState.distanceTraveled = (state.distanceTraveled || 0) + distanceMoved
      }

      return newState

    case 'UPDATE_MOVE_COUNT':
      return { ...state, moveCount: action.payload.moveCount }

    case 'PASS_TURN':
      return {
        ...state,
        moveCount: state.moveCount + 1,
        lastAction: 'PASS_TURN',
      }

    default:
      return null
  }
}

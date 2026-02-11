// state/slices/jauntSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'
import { Position } from '../../config/types/primitives'

// Counter to ensure unique flash IDs even with rapid successive teleports
let flashIdCounter = 0

export function reduceJaunt(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'ARM_JAUNT': {
      const { canJaunt, jauntCharges, isJauntArmed } = state.player

      // Can't arm if not unlocked
      if (!canJaunt) {
        logIfDev('[Jaunt] Cannot arm - ability not unlocked')
        return state
      }

      // Can't arm if no charges
      if (jauntCharges <= 0) {
        logIfDev('[Jaunt] Cannot arm - no charges available')
        return state
      }

      // If already armed, treat as toggle/cancel
      if (isJauntArmed) {
        logIfDev('[Jaunt] Canceling armed state (toggled off)')
        return {
          ...state,
          player: {
            ...state.player,
            isJauntArmed: false,
          },
        }
      }

      // Arm the jaunt
      logIfDev('[Jaunt] Armed - waiting for target tap')
      return {
        ...state,
        player: {
          ...state.player,
          isJauntArmed: true,
        },
      }
    }

    case 'CANCEL_JAUNT': {
      // Cancel armed mode without consuming charge
      if (!state.player.isJauntArmed) {
        return state
      }

      logIfDev('[Jaunt] Canceled armed state')
      return {
        ...state,
        player: {
          ...state.player,
          isJauntArmed: false,
        },
      }
    }

    case 'EXECUTE_JAUNT': {
      const { canJaunt, jauntCharges, isJauntArmed } = state.player
      const { targetPosition } = action.payload as { targetPosition: Position }

      // Validate preconditions
      if (!canJaunt || jauntCharges <= 0 || !isJauntArmed) {
        logIfDev('[Jaunt] Cannot execute - invalid state')
        return state
      }

      // Clamp target position to grid bounds
      const clampedCol = Math.max(0, Math.min(targetPosition.col, state.gridWidth - 1))
      const clampedRow = Math.max(0, Math.min(targetPosition.row, state.gridHeight - 1))

      logIfDev('[Jaunt] Teleporting to position', {
        target: { col: clampedCol, row: clampedRow },
        chargesRemaining: jauntCharges - 1,
      })

      // Create a teleport flash effect at the destination
      // Use counter to ensure unique IDs even with rapid successive teleports
      flashIdCounter++
      const flashId = `flash-${Date.now()}-${flashIdCounter}`
      const newFlash = {
        id: flashId,
        gridCol: clampedCol,
        gridRow: clampedRow,
      }

      // Teleport player and consume charge
      return {
        ...state,
        player: {
          ...state.player,
          position: { col: clampedCol, row: clampedRow },
          jauntCharges: jauntCharges - 1,
          isJauntArmed: false,
        },
        activeTeleportFlashes: [...(state.activeTeleportFlashes || []), newFlash],
      }
    }

    case 'UPDATE_JAUNT_STATE': {
      const { canJaunt, jauntCharges, jauntRechargeCounter } = state.player

      // Only update if jaunt is unlocked
      if (!canJaunt) {
        return state
      }

      // Don't recharge if already at max charges
      if (jauntCharges >= 3) {
        return state
      }

      // Increment recharge counter
      const newCounter = jauntRechargeCounter + 1

      // Check if we've hit the recharge threshold (20 turns)
      if (newCounter >= 20) {
        const newCharges = Math.min(3, jauntCharges + 1)
        logIfDev('[Jaunt] Recharged +1 charge', {
          newCharges,
          maxCharges: 3,
        })

        return {
          ...state,
          player: {
            ...state.player,
            jauntCharges: newCharges,
            jauntRechargeCounter: 0,
          },
        }
      }

      // Just increment counter
      return {
        ...state,
        player: {
          ...state.player,
          jauntRechargeCounter: newCounter,
        },
      }
    }

    case 'PLAYER_JAUNT_REQUESTED': {
      // Legacy action - redirect to ARM_JAUNT
      return reduceJaunt(state, { type: 'ARM_JAUNT' })
    }

    default:
      return null
  }
}

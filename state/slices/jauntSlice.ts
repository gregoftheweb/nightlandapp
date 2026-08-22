// state/slices/jauntSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'
import { Position } from '../../config/types/primitives'

// Counter to ensure unique flash IDs even with rapid successive teleports
let flashIdCounter = 0

export function grantJauntCrystalToPlayer(player: GameState['player']): GameState['player'] {
  if (!player.jauntUnlocked) {
    return {
      ...player,
      jauntUnlocked: true,
      jauntCrystalCharges: 5,
      jauntCrystalReserve: 0,
      isJauntArmed: false,
    }
  }
  if (player.jauntCrystalCharges <= 0 && player.jauntCrystalReserve <= 0) {
    return { ...player, jauntCrystalCharges: 5, isJauntArmed: false }
  }
  return { ...player, jauntCrystalReserve: player.jauntCrystalReserve + 1 }
}

/** Shared world-position update used by gameplay Jaunt and the dev-only jump menu. */
export function teleportPlayerPosition(state: GameState, targetPosition: Position): GameState {
  const clampedPosition = {
    col: Math.max(0, Math.min(targetPosition.col, state.gridWidth - 1)),
    row: Math.max(0, Math.min(targetPosition.row, state.gridHeight - 1)),
  }

  return {
    ...state,
    player: {
      ...state.player,
      position: clampedPosition,
    },
  }
}

export function reduceJaunt(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'ARM_JAUNT': {
      const { jauntUnlocked, jauntCrystalCharges, isJauntArmed } = state.player

      // Can't arm if not unlocked
      if (!jauntUnlocked) {
        logIfDev('[Jaunt] Cannot arm - ability not unlocked')
        return state
      }

      // Can't arm if no charges
      if (jauntCrystalCharges <= 0) {
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
      const { jauntUnlocked, jauntCrystalCharges, jauntCrystalReserve, isJauntArmed } = state.player
      const { targetPosition } = action.payload as { targetPosition: Position }

      // Validate preconditions
      if (!jauntUnlocked || jauntCrystalCharges <= 0 || !isJauntArmed) {
        logIfDev('[Jaunt] Cannot execute - invalid state')
        return state
      }

      const teleportedState = teleportPlayerPosition(state, targetPosition)
      const clampedPosition = teleportedState.player.position

      logIfDev('[Jaunt] Teleporting to position', {
        target: clampedPosition,
        chargesRemaining: jauntCrystalCharges - 1,
      })

      // Create a teleport flash effect at the destination
      // Use counter to ensure unique IDs even with rapid successive teleports
      flashIdCounter++
      const flashId = `flash-${Date.now()}-${flashIdCounter}`
      const newFlash = {
        id: flashId,
        gridCol: clampedPosition.col,
        gridRow: clampedPosition.row,
      }

      const depleted = jauntCrystalCharges === 1
      const reloadFromReserve = depleted && jauntCrystalReserve > 0

      // Teleport player and consume one active-crystal charge. Reserve reload is atomic.
      return {
        ...teleportedState,
        player: {
          ...teleportedState.player,
          jauntCrystalCharges: reloadFromReserve ? 5 : jauntCrystalCharges - 1,
          jauntCrystalReserve: reloadFromReserve ? jauntCrystalReserve - 1 : jauntCrystalReserve,
          isJauntArmed: false,
        },
        activeTeleportFlashes: [...(state.activeTeleportFlashes || []), newFlash],
      }
    }

    case 'DEBUG_TELEPORT_PLAYER': {
      if (!__DEV__) return state
      const { targetPosition } = action.payload as { targetPosition: Position }
      return teleportPlayerPosition(state, targetPosition)
    }

    case 'GRANT_JAUNT_CRYSTAL': {
      return {
        ...state,
        player: grantJauntCrystalToPlayer(state.player),
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

export function jauntExecutionActions(
  player: GameState['player'],
  targetPosition: Position
): any[] {
  const actions: any[] = [{ type: 'EXECUTE_JAUNT', payload: { targetPosition } }]
  if (!player.jauntUnlocked || !player.isJauntArmed || player.jauntCrystalCharges !== 1) {
    return actions
  }
  actions.push({
    type: 'ADD_COMBAT_LOG',
    payload: { message: 'The Jaunt Crystal is burned up, it dissolves in your hand' },
  })
  if (player.jauntCrystalReserve > 0) {
    actions.push({
      type: 'ADD_COMBAT_LOG',
      payload: { message: 'A fresh crystal ignites in your grasp' },
    })
  }
  return actions
}

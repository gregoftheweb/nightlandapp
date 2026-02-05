// state/slices/hideSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceHide(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'CLEAR_HIDE':
      return {
        ...state,
        player: {
          ...state.player,
          isHidden: false,
        },
      }

    case 'DECREMENT_CLOAKING_TURNS':
      const newHideTurns = Math.max(0, state.player.hideTurns - 1)
      return {
        ...state,
        player: {
          ...state.player,
          hideTurns: newHideTurns,
          isHidden: newHideTurns > 0,
        },
      }

    case 'TOGGLE_HIDE': {
      const { hideUnlocked, hideChargeTurns, hideActive } = state.player

      // Can't toggle if not unlocked
      if (!hideUnlocked) {
        logIfDev('[Hide] Cannot toggle - ability not unlocked')
        return state
      }

      // Toggling OFF - always allowed
      if (hideActive) {
        logIfDev(`[Hide] deactivated, charge=${hideChargeTurns}`)
        return {
          ...state,
          player: {
            ...state.player,
            hideActive: false,
          },
        }
      }

      // Toggling ON - requires charge
      if (hideChargeTurns <= 0) {
        logIfDev('[Hide] Cannot activate - no charge remaining')
        return state
      }

      logIfDev(`[Hide] activated, charge=${hideChargeTurns}`)
      return {
        ...state,
        player: {
          ...state.player,
          hideActive: true,
        },
      }
    }

    case 'UPDATE_HIDE_STATE': {
      // This action is called each turn to manage charge consumption and recharge
      const { hideUnlocked, hideActive, hideChargeTurns, hideRechargeProgressTurns } = state.player

      if (!hideUnlocked) {
        return state // No-op if ability not unlocked
      }

      let newCharge = hideChargeTurns
      let newActive = hideActive
      let newProgress = hideRechargeProgressTurns

      // 1. Consume charge if hide is active
      if (hideActive) {
        newCharge = Math.max(0, hideChargeTurns - 1)
        if (newCharge === 0) {
          newActive = false // Auto-disable when depleted
          logIfDev('[Hide] depleted')
        }
      } else {
        // 2. Recharge logic (only recharge when hide is NOT active)
        if (newCharge < 10) {
          newProgress = hideRechargeProgressTurns + 1
          if (newProgress >= 5) {
            newCharge = Math.min(10, newCharge + 1)
            newProgress = 0
            logIfDev(`[Hide] recharge tick: charge=${newCharge}`)
          }
        } else {
          newProgress = 0 // Reset progress when at max
        }
      }

      return {
        ...state,
        player: {
          ...state.player,
          hideChargeTurns: newCharge,
          hideActive: newActive,
          hideRechargeProgressTurns: newProgress,
        },
      }
    }

    default:
      return null
  }
}

// state/slices/uiSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceUI(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'UPDATE_DIALOG':
      return { ...state, dialogData: action.payload.dialogData }

    case 'SET_AUDIO_STARTED':
      return { ...state, audioStarted: action.payload }

    case 'TOGGLE_RANGED_MODE':
      logIfDev(
        `🎯 TOGGLE_RANGED_MODE: active=${action.payload.active}, targetId=${action.payload.targetId}`
      )
      return {
        ...state,
        rangedAttackMode: action.payload.active,
        targetedMonsterId: action.payload.active ? action.payload.targetId : null,
      }

    case 'SET_TARGET_MONSTER':
      logIfDev(`🎯 SET_TARGET_MONSTER: monsterId=${action.payload.monsterId}`)
      return {
        ...state,
        targetedMonsterId: action.payload.monsterId,
      }

    case 'CLEAR_RANGED_MODE':
      logIfDev(`🎯 CLEAR_RANGED_MODE`)
      return {
        ...state,
        rangedAttackMode: false,
        targetedMonsterId: null,
      }

    case 'ADD_PROJECTILE':
      logIfDev(`🎯 ADD_PROJECTILE: id=${action.payload.id}`)
      return {
        ...state,
        activeProjectiles: [...state.activeProjectiles, action.payload],
      }

    case 'REMOVE_PROJECTILE':
      logIfDev(`🎯 REMOVE_PROJECTILE: id=${action.payload.id}`)
      return {
        ...state,
        activeProjectiles: state.activeProjectiles.filter((p) => p.id !== action.payload.id),
      }

    case 'ADD_TELEPORT_FLASH':
      logIfDev(`✨ ADD_TELEPORT_FLASH: id=${action.payload.id}`)
      return {
        ...state,
        activeTeleportFlashes: [...(state.activeTeleportFlashes || []), action.payload],
      }

    case 'REMOVE_TELEPORT_FLASH':
      logIfDev(`✨ REMOVE_TELEPORT_FLASH: id=${action.payload.id}`)
      return {
        ...state,
        activeTeleportFlashes: (state.activeTeleportFlashes || []).filter(
          (f) => f.id !== action.payload.id
        ),
      }

    default:
      return null
  }
}

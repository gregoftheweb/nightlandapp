// state/slices/monstersSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceMonsters(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'MOVE_MONSTER':
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id
            ? { ...monster, position: action.payload.position }
            : monster
        ),
      }

    case 'SPAWN_MONSTER':
      const newMonster = action.payload.monster
      logIfDev('Spawning monster:', newMonster.name)
      return {
        ...state,
        activeMonsters: [...state.activeMonsters, newMonster],
      }

    case 'UPDATE_ACTIVE_MONSTERS':
      return { ...state, activeMonsters: action.payload.activeMonsters }

    case 'AWAKEN_GREAT_POWER':
      return {
        ...state,
        level: {
          ...state.level,
          greatPowers:
            state.level.greatPowers?.map((power) =>
              power.id === action.payload.greatPowerId ? { ...power, awakened: true } : power
            ) || [],
        },
      }

    case 'UPDATE_WAITING_MONSTERS':
      return { ...state, waitingMonsters: action.payload.waitingMonsters }

    case 'REMOVE_MONSTER':
      return {
        ...state,
        activeMonsters: state.activeMonsters.filter((monster) => monster.id !== action.payload.id),
        attackSlots: state.attackSlots.filter((slot) => slot.id !== action.payload.id),
        waitingMonsters: state.waitingMonsters.filter(
          (monster) => monster.id !== action.payload.id
        ),
        monstersKilled: (state.monstersKilled || 0) + 1,
        // If the removed monster was the targeted monster, clear the target but keep ranged mode on
        // This allows the player to retarget another monster without re-entering ranged mode
        targetedMonsterId:
          state.targetedMonsterId === action.payload.id ? null : state.targetedMonsterId,
      }

    default:
      return null
  }
}

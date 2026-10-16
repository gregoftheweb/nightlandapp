// state/slices/monstersSlice.ts
import { GameState } from '../../config/types'
import { canTraverseTerrain, isTerrainWalkable } from '../../modules/terrain'
import { logIfDev } from '../../modules/utils'

export function reduceMonsters(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'MOVE_MONSTER': {
      const monster = state.activeMonsters.find((m) => m.id === action.payload.id)
      if (
        !monster ||
        !canTraverseTerrain(
          state,
          monster.position,
          action.payload.position,
          monster.width ?? 1,
          monster.height ?? 1
        )
      )
        return state
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id
            ? {
                ...monster,
                position: action.payload.position,
                facingLeft:
                  action.payload.position.col < monster.position.col
                    ? true
                    : action.payload.position.col > monster.position.col
                      ? false
                      : monster.facingLeft,
              }
            : monster
        ),
      }
    }
    case 'SPAWN_MONSTER':
      const newMonster = action.payload.monster
      if (
        !isTerrainWalkable(
          state,
          newMonster.position,
          newMonster.width ?? 1,
          newMonster.height ?? 1
        )
      )
        return state
      logIfDev('Spawning monster:', newMonster.name)
      return {
        ...state,
        activeMonsters: [...state.activeMonsters, newMonster],
      }

    case 'UPDATE_ACTIVE_MONSTERS':
      return {
        ...state,
        activeMonsters: action.payload.activeMonsters.filter(
          (m: GameState['activeMonsters'][number]) =>
            state.activeMonsters.some((old) => old.id === m.id) ||
            isTerrainWalkable(state, m.position, m.width ?? 1, m.height ?? 1)
        ),
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

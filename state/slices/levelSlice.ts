// state/slices/levelSlice.ts
import { GameState } from '../../config/types'
import { levels } from '../../config/levels'
import { logIfDev } from '../../modules/utils'

export function reduceLevel(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'SET_LEVEL': {
      const targetLevelId = action.levelId
      if (!(targetLevelId in levels)) {
        logIfDev(`⚠️  Unknown levelId: ${String(targetLevelId)}`)
        return state
      }

      logIfDev(`🗺️  Changing level to: ${targetLevelId}`)

      const levelId = targetLevelId as keyof typeof levels
      const newLevelConfig = levels[levelId]
      return {
        ...state,
        level: newLevelConfig,
        levels: { ...state.levels, [action.levelId]: newLevelConfig },
        greatPowers: newLevelConfig.greatPowers || [],
        objects: newLevelConfig.objects || [],
        nonCollisionObjects: newLevelConfig.nonCollisionObjects || [],
        activeMonsters: [],
        attackSlots: [],
        waitingMonsters: [],
        inCombat: false,
        turnOrder: [],
        combatTurn: null,
        moveCount: 0,
        combatLog: [],
        player: {
          ...state.player,
          currentHP: state.player.maxHP,
          position: { row: 395, col: 200 },
        },
      }
    }

    default:
      return null
  }
}

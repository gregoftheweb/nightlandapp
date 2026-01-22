// modules/reducers.ts
import {
  GameState,
  CombatLogEntry,
  Monster,
  LevelMonsterInstance,
  Position,
  NonCollisionObject,
} from '../config/types'
import { levels } from '../config/levels'
import { initialState } from './gameState'
import { createMonsterFromTemplate } from '../modules/monsterUtils'
import { logIfDev } from './utils'

export const reducer = (state: GameState = initialState, action: any): GameState => {
  switch (action.type) {
    // ============ LEVEL MANAGEMENT ============
    case 'SET_LEVEL':
      const newLevelConfig = levels[String(action.levelId)]
      return {
        ...state,
        level: newLevelConfig,
        levels: { ...state.levels, [action.levelId]: newLevelConfig },
        monsters: newLevelConfig.monsters || [],
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
          hp: state.player.maxHP,
          position: { row: 395, col: 200 },
        },
      }

    // ============ PLAYER MOVEMENT ============
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

    // ============ MONSTER MOVEMENT ============
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

    // ============ COMBAT SYSTEM ============
    case 'SET_COMBAT':
      logIfDev(`🎯 SET_COMBAT dispatched, inCombat: ${action.payload.inCombat}`)

      // Check if we're exiting combat
      const exitingCombat = !action.payload.inCombat && state.inCombat
      // Check if there are any living monsters remaining
      const hasRemainingMonsters =
        action.payload.attackSlots.length > 0 ||
        state.activeMonsters.some((m) => m.hp > 0 && m.active !== false)

      // Determine if we should clear ranged mode
      // Clear when: entering combat OR exiting combat with no monsters left
      const shouldClearRangedMode =
        action.payload.inCombat || (exitingCombat && !hasRemainingMonsters)

      return {
        ...state,
        inCombat: action.payload.inCombat,
        attackSlots: action.payload.attackSlots,
        waitingMonsters: action.payload.waitingMonsters || [],
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
        combatLog: action.payload.inCombat ? state.combatLog || [] : [],
        // Clear ranged attack mode when entering combat OR when exiting combat with no monsters left
        rangedAttackMode: shouldClearRangedMode ? false : state.rangedAttackMode,
        targetedMonsterId: shouldClearRangedMode ? null : state.targetedMonsterId,
      }

    case 'START_COMBAT':
      return {
        ...state,
        inCombat: true,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.monster?.id ? { ...monster, inCombatSlot: true } : monster
        ),
      }

    case 'UPDATE_TURN':
      return {
        ...state,
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
      }

    case 'UPDATE_WAITING_MONSTERS':
      return { ...state, waitingMonsters: action.payload.waitingMonsters }

    // ============ COMBAT LOG ============
    case 'ADD_COMBAT_LOG':
      logIfDev('ADD_COMBAT_LOG dispatched:', action.payload)
      return {
        ...state,
        combatLog: [
          ...(state.combatLog || []),
          {
            id: `${Date.now()}-${Math.random()}`,
            message: action.payload.message,
            turn: state.moveCount,
          },
        ],
      }

    case 'CLEAR_COMBAT_LOG':
      logIfDev('🎯 CLEAR_COMBAT_LOG dispatched')
      return {
        ...state,
        combatLog: [],
      }

    // ============ HEALTH SYSTEM ============
    case 'UPDATE_PLAYER':
      return {
        ...state,
        player: { ...state.player, ...action.payload.updates },
      }

    case 'UPDATE_MONSTER':
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id ? { ...monster, ...action.payload.updates } : monster
        ),
        attackSlots: state.attackSlots.map((slot) =>
          slot.id === action.payload.id ? { ...slot, ...action.payload.updates } : slot
        ),
      }

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

    case 'UPDATE_PLAYER_HP':
      return {
        ...state,
        player: { ...state.player, hp: action.payload.hp },
      }

    case 'UPDATE_SELF_HEAL_COUNTER':
      return {
        ...state,
        selfHealTurnCounter: action.payload.counter,
      }

    case 'UPDATE_MONSTER_HP':
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id ? { ...monster, hp: action.payload.hp } : monster
        ),
        attackSlots: state.attackSlots.map((slot) =>
          slot.id === action.payload.id ? { ...slot, hp: action.payload.hp } : slot
        ),
      }

    case 'RESET_HP':
      return {
        ...state,
        player: { ...state.player, hp: state.player.maxHP },
      }

    case 'GAME_OVER': {
      // This should set the death state but NOT reset anything yet
      return {
        ...state,
        gameOver: true,
        gameOverMessage: action.payload?.message || 'You have been defeated.',
        killerName: action.payload?.killerName || 'unknown horror',
        inCombat: false,
        attackSlots: [],
        waitingMonsters: [],
        turnOrder: [],
        combatTurn: null,
        combatLog: [],
        activeMonsters: [], // <-- Add this to flush monsters immediately
      }
    }

    case 'RESET_GAME': {
      return initialState
    }

    // ============ INVENTORY MANAGEMENT ============
    case 'ADD_TO_INVENTORY':
      return {
        ...state,
        player: {
          ...state.player,
          inventory: [...state.player.inventory, action.payload.item],
        },
      }

    case 'REMOVE_FROM_INVENTORY':
      return {
        ...state,
        player: {
          ...state.player,
          inventory: state.player.inventory.filter((item) => item.id !== action.payload.id),
        },
      }

    case 'TOGGLE_INVENTORY':
      return {
        ...state,
        showInventory: !state.showInventory,
        showWeaponsInventory: false,
      }

    case 'ADD_TO_WEAPONS':
      return {
        ...state,
        player: {
          ...state.player,
          weapons: [...state.player.weapons, action.payload.weapon],
        },
      }

    case 'REMOVE_FROM_WEAPONS':
      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.filter((w) => w.id !== action.payload.id),
        },
      }

    case 'EQUIP_WEAPON':
      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.map((w) =>
            w.id === action.payload.id ? { ...w, equipped: true } : { ...w, equipped: false }
          ),
        },
      }

    case 'ADD_RANGED_WEAPON': {
      // Add a ranged weapon to the player's inventory
      const weaponId = action.payload.id

      // Check if weapon is already in inventory
      if (state.player.rangedWeaponInventoryIds.includes(weaponId)) {
        logIfDev(`Weapon ${weaponId} is already in ranged weapon inventory`)
        return state
      }

      return {
        ...state,
        player: {
          ...state.player,
          rangedWeaponInventoryIds: [...state.player.rangedWeaponInventoryIds, weaponId],
        },
      }
    }

    case 'EQUIP_RANGED_WEAPON': {
      // Equip a ranged weapon by ID
      // Only one ranged weapon can be equipped at a time
      const weaponId = action.payload.id

      // Check if the weapon is in the ranged weapon inventory
      if (!state.player.rangedWeaponInventoryIds.includes(weaponId)) {
        logIfDev(`Weapon ${weaponId} not found in ranged weapon inventory`)
        return state
      }

      return {
        ...state,
        player: {
          ...state.player,
          equippedRangedWeaponId: weaponId,
        },
      }
    }

    case 'DROP_WEAPON': {
      const weaponId = action.payload.id
      if (weaponId === 'weapon-discos-001') {
        logIfDev('Cannot drop the Discos!')
        return state
      }

      const weaponDetails = state.weapons.find((w) => w.id === action.payload.id)
      if (!weaponDetails) {
        if (__DEV__) {
          console.warn(`Weapon with ID ${weaponId} not found`)
        }
        return state
      }

      const newWeaponItem = {
        name: weaponDetails.name,
        shortName: weaponDetails.shortName,
        position: { ...state.player.position },
        description: weaponDetails.description,
        active: true,
        collectible: true,
        type: 'weapon' as const,
        weaponId: weaponId,
        category: 'weapon' as const,
      }

      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.filter((w) => w.id !== action.payload.id),
        },
        items: [...state.items, newWeaponItem],
        dropSuccess: true,
      }
    }

    case 'TOGGLE_WEAPONS_INVENTORY':
      return {
        ...state,
        showWeaponsInventory: !state.showWeaponsInventory,
        showInventory: false,
      }

    // ============ ITEM MANAGEMENT ============

    case 'DROP_ITEM': {
      const { item, position } = action.payload

      const updatedInventory = state.player.inventory.filter((invItem) => invItem.id !== item.id)

      const droppedItem = {
        ...item,
        position: { ...position },
        active: true,
        collectible: true,
      }

      return {
        ...state,
        player: {
          ...state.player,
          inventory: updatedInventory,
        },
        items: [...state.items, droppedItem],
      }
    }

    case 'REMOVE_ITEM_FROM_GAMEBOARD':
      logIfDev(
        `Removing item from gameboard: ${action.payload.shortName} from position (${action.payload.position.row}, ${action.payload.position.col})`
      )
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              item.position?.row === action.payload.position.row &&
              item.position?.col === action.payload.position.col &&
              item.shortName === action.payload.shortName
            )
        ),
      }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((item) =>
          item.shortName === action.payload.shortName
            ? { ...item, ...action.payload.updates }
            : item
        ),
      }

    // ============ EFFECTS SYSTEM ============
    // NOTE: Effect execution has been moved to /modules/effects.ts
    // All effects are now applied through the unified applyEffect() function
    // This provides consistent behavior for items, objects, abilities, etc.

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

    // ============ WORLD OBJECTS ============
    case 'UPDATE_OBJECT':
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.shortName === action.payload.shortName ? { ...obj, ...action.payload.updates } : obj
        ),
      }

    // ============ UI STATE ============
    case 'UPDATE_DIALOG':
      return { ...state, dialogData: action.payload.dialogData }

    case 'SET_AUDIO_STARTED':
      return { ...state, audioStarted: action.payload }

    // ============ RANGED ATTACK MODE ============
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

    // ============ PROJECTILE MANAGEMENT ============
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

    // ============ SUB-GAME MANAGEMENT ============
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

    // ============ CLEANUP ============
    default:
      if (__DEV__) {
        console.warn(`Unhandled action type: ${action.type}`)
      }
      return state || initialState
  }
}

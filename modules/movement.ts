// modules/movement.ts - All movement-related logic
import { GameState, Position, Monster } from '../config/types'
import { setupCombat, checkForCombatCollision } from './combat'
import { logIfDev } from './utils'

// ==================== PLAYER MOVEMENT ====================

export const calculateNewPosition = (
  currentPos: Position,
  direction: string,
  state: GameState
): Position => {
  const newPosition = { ...currentPos }

  switch (direction) {
    case 'up':
      newPosition.row = Math.max(0, newPosition.row - 1)
      break
    case 'down':
      newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + 1)
      break
    case 'left':
      newPosition.col = Math.max(0, newPosition.col - 1)
      break
    case 'right':
      newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + 1)
      break
    case 'stay':
    case null:
      break
    default:
      if (__DEV__) {
        console.warn(`Unhandled direction: ${direction}`)
      }
      break
  }

  return newPosition
}

// ==================== MONSTER MOVEMENT ====================

export const moveAway = (
  monster: Monster,
  playerPos: Position,
  gridWidth: number,
  gridHeight: number
): Position => {
  const newPos = { ...monster.position }
  const moveDistance = monster.moveRate || 1

  if (monster.position.row < playerPos.row) {
    newPos.row = Math.max(0, monster.position.row - moveDistance)
  } else if (monster.position.row > playerPos.row) {
    newPos.row = Math.min(gridHeight - 1, monster.position.row + moveDistance)
  }

  if (monster.position.col < playerPos.col) {
    newPos.col = Math.max(0, monster.position.col - moveDistance)
  } else if (monster.position.col > playerPos.col) {
    newPos.col = Math.min(gridWidth - 1, monster.position.col + moveDistance)
  }

  return newPos
}

export const calculateMonsterMovement = (
  monster: Monster,
  playerPos: Position,
  state: GameState
): Position => {
  // Check if player is hidden (either by object/zone effect or by Hide ability)
  if (state.player.isHidden || state.player.hideActive) {
    return moveAway(monster, playerPos, state.gridWidth, state.gridHeight)
  }

  // Move towards player
  const moveDistance = monster.moveRate || 1
  let newPos = { ...monster.position }

  if (monster.position.row < playerPos.row) {
    newPos.row = Math.min(monster.position.row + moveDistance, playerPos.row)
  } else if (monster.position.row > playerPos.row) {
    newPos.row = Math.max(monster.position.row - moveDistance, playerPos.row)
  }

  if (monster.position.col < playerPos.col) {
    newPos.col = Math.min(monster.position.col + moveDistance, playerPos.col)
  } else if (monster.position.col > playerPos.col) {
    newPos.col = Math.max(monster.position.col - moveDistance, playerPos.col)
  }

  // Keep within grid bounds
  newPos.row = Math.max(0, Math.min(state.gridHeight - 1, newPos.row))
  newPos.col = Math.max(0, Math.min(state.gridWidth - 1, newPos.col))

  return newPos
}

export const isMonsterInCombat = (monster: Monster, state: GameState): boolean => {
  return (
    state.attackSlots?.some((slot: any) => slot.id === monster.id) ||
    state.waitingMonsters?.some((m: any) => m.id === monster.id)
  )
}

export const moveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void,
  playerPosOverride?: Position
): void => {
  const playerPos = playerPosOverride || state.player.position

  state.activeMonsters.forEach((monster) => {
    // Skip monsters already engaged in combat
    if (isMonsterInCombat(monster, state)) {
      return
    }

    // Calculate monster's new position
    const newPos = calculateMonsterMovement(monster, playerPos, state)

    // Check for combat collision before moving
    if (checkForCombatCollision(state, monster, newPos, playerPos)) {
      setupCombat(state, dispatch, monster, playerPos)
      return
    }

    // Move monster to new position
    dispatch({
      type: 'MOVE_MONSTER',
      payload: { id: monster.id, position: newPos },
    })
    logIfDev(`Monster ${monster.name} moved to (${newPos.row}, ${newPos.col})`)
  })
}

// ==================== MOVEMENT UTILITIES ====================

export function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.sqrt(Math.pow(pos2.row - pos1.row, 2) + Math.pow(pos2.col - pos1.col, 2))
}

export function isAdjacentToPlayer(monster: Monster, playerPosition: Position): boolean {
  return calculateDistance(monster.position, playerPosition) <= 1.5
}

// modules/movement.ts - All movement-related logic
import { GameState, Position, Monster } from '../config/types'
import { setupCombat, checkForCombatCollision } from './combat'
import { logIfDev } from './utils'
import { executeMonsterRangedAttack } from './monsterRangedAttacks'
import { canTraverseTerrain, buildTerrainDistances } from './terrain'

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

  if (!canTraverseTerrain(state, currentPos, newPosition)) {
    return currentPos
  }

  return newPosition
}

// ==================== MONSTER MOVEMENT ====================

const moveAway = (
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
    newPos.row = Math.min(gridHeight - (monster.height ?? 1), monster.position.row + moveDistance)
  }

  if (monster.position.col < playerPos.col) {
    newPos.col = Math.max(0, monster.position.col - moveDistance)
  } else if (monster.position.col > playerPos.col) {
    newPos.col = Math.min(gridWidth - (monster.width ?? 1), monster.position.col + moveDistance)
  }

  return newPos
}

const calculateMonsterMovement = (
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
  newPos.row = Math.max(0, Math.min(state.gridHeight - (monster.height ?? 1), newPos.row))
  newPos.col = Math.max(0, Math.min(state.gridWidth - (monster.width ?? 1), newPos.col))

  return newPos
}

const isMonsterInCombat = (monster: Monster, state: GameState): boolean => {
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

  const fields = new Map<string, Int32Array>()
  state.activeMonsters.forEach((monster) => {
    // Skip monsters already engaged in combat
    if (isMonsterInCombat(monster, state)) {
      return
    }

    const moveEveryTurns = Math.max(1, monster.moveEveryTurns ?? 1)
    if ((state.moveCount ?? 0) % moveEveryTurns !== 0) {
      return
    }

    if (
      !state.player.isHidden &&
      !state.player.hideActive &&
      executeMonsterRangedAttack(state, monster, playerPos, dispatch)
    ) {
      return
    }

    // Calculate monster's new position
    let newPos = calculateMonsterMovement(monster, playerPos, state)
    const width = monster.width ?? 1,
      height = monster.height ?? 1
    if (!canTraverseTerrain(state, monster.position, newPos, width, height)) {
      const fleeing = state.player.isHidden || state.player.hideActive
      const key = `${width}:${height}`
      if (!fields.has(key)) fields.set(key, buildTerrainDistances(state, playerPos, width, height))
      const distances = fields.get(key)!
      newPos = { ...monster.position }
      for (let step = 0; step < Math.max(1, Math.floor(monster.moveRate || 1)); step++) {
        const candidates: Position[] = []
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dy && !dx) continue
            const p = { row: newPos.row + dy, col: newPos.col + dx }
            if (
              canTraverseTerrain(state, newPos, p, width, height) &&
              canTraverseTerrain(state, monster.position, p, width, height)
            )
              candidates.push(p)
          }
        const score = (p: Position) =>
          fleeing
            ? Math.hypot(p.row - playerPos.row, p.col - playerPos.col)
            : -distances[p.row * state.gridWidth + p.col]
        const reachable = candidates.filter(
          (p) => fleeing || distances[p.row * state.gridWidth + p.col] >= 0
        )
        reachable.sort((a, b) => score(b) - score(a))
        const next = reachable[0]
        if (
          !next ||
          (!fleeing &&
            distances[newPos.row * state.gridWidth + newPos.col] >= 0 &&
            score(next) <= score(newPos))
        )
          break
        newPos = next
      }
    }

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

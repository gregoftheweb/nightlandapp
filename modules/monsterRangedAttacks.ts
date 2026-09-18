import type { GameState, Monster, Position, Projectile } from '@config/types'

export interface MonsterRangedAttackResult {
  damage: number
  projectile: Projectile
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export function distanceFromMonsterFootprint(monster: Monster, target: Position): number {
  const width = monster.width ?? 1
  const height = monster.height ?? 1
  const targetCenter = { row: target.row + 0.5, col: target.col + 0.5 }
  const nearest = {
    row: clamp(targetCenter.row, monster.position.row, monster.position.row + height),
    col: clamp(targetCenter.col, monster.position.col, monster.position.col + width),
  }

  return Math.hypot(targetCenter.row - nearest.row, targetCenter.col - nearest.col)
}

export function doesBeamTouchPosition(start: Position, end: Position, target: Position): boolean {
  const minCol = target.col
  const maxCol = target.col + 1
  const minRow = target.row
  const maxRow = target.row + 1
  const deltaCol = end.col - start.col
  const deltaRow = end.row - start.row
  let enter = 0
  let exit = 1

  const clips: readonly [number, number][] = [
    [-deltaCol, start.col - minCol],
    [deltaCol, maxCol - start.col],
    [-deltaRow, start.row - minRow],
    [deltaRow, maxRow - start.row],
  ]

  for (const [direction, distance] of clips) {
    if (direction === 0) {
      if (distance < 0) return false
      continue
    }
    const ratio = distance / direction
    if (direction < 0) enter = Math.max(enter, ratio)
    else exit = Math.min(exit, ratio)
    if (enter > exit) return false
  }

  return true
}

export function buildBileBeamAttack(
  monster: Monster,
  target: Position,
  random: () => number = Math.random,
  now: () => number = Date.now
): MonsterRangedAttackResult | null {
  const attack = monster.rangedAttack
  if (!attack || attack.kind !== 'bile-beam') return null
  if (distanceFromMonsterFootprint(monster, target) > attack.range) return null

  const startPosition = {
    row: monster.position.row + (monster.height ?? 1) / 2,
    col: monster.position.col + (monster.width ?? 1) / 2,
  }
  const endPosition = { row: target.row + 0.5, col: target.col + 0.5 }
  if (!doesBeamTouchPosition(startPosition, endPosition, target)) return null

  const roll = clamp(random(), 0, 0.999999999)
  const damage = attack.minDamage + Math.floor(roll * (attack.maxDamage - attack.minDamage + 1))
  const createdAt = now()

  return {
    damage,
    projectile: {
      id: `bile-beam-${monster.id}-${createdAt}`,
      kind: 'bile-beam',
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      angleDeg: 0,
      color: attack.color,
      createdAt,
      durationMs: attack.durationMs,
      thicknessPx: 5,
      glow: true,
      startPosition,
      endPosition,
      stationaryFade: true,
    },
  }
}

export function executeMonsterRangedAttack(
  state: GameState,
  monster: Monster,
  target: Position,
  dispatch: (action: any) => void,
  random: () => number = Math.random
): boolean {
  const result = buildBileBeamAttack(monster, target, random)
  if (!result) return false

  const newHP = Math.max(0, state.player.currentHP - result.damage)
  dispatch({ type: 'ADD_PROJECTILE', payload: result.projectile })
  dispatch({
    type: 'ADD_COMBAT_LOG',
    payload: {
      message: `${monster.name} spat acid stomach bile through Christos for ${result.damage} damage!`,
    },
  })
  dispatch({ type: 'UPDATE_PLAYER', payload: { updates: { currentHP: newHP } } })

  if (newHP === 0) {
    dispatch({
      type: 'GAME_OVER',
      payload: {
        message: `${monster.name} dissolved Christos in a torrent of acid stomach bile.`,
        killerName: monster.name,
      },
    })
  }

  return true
}

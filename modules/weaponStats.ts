import type { GameState, Item, Monster, Position, WeaponUpgrade } from '@config/types'

export const DEFAULT_WEAPON_UPGRADE: WeaponUpgrade = {
  damageMultiplier: 1,
  hitBonusAdd: 0,
}

export function getWeaponUpgrade(state: GameState, weaponId: string): WeaponUpgrade {
  return state.weaponUpgrades?.[weaponId] ?? DEFAULT_WEAPON_UPGRADE
}

export function getOwnedWeapon(state: GameState, weaponId: string | null): Item | undefined {
  if (!weaponId) return undefined
  return state.weapons.find((weapon) => weapon.id === weaponId)
}

export function getEquippedRangedWeapon(state: GameState): Item | undefined {
  return getOwnedWeapon(state, state.player.equippedRangedWeaponId)
}

export function getEquippedMeleeWeapon(state: GameState): Item | undefined {
  return getOwnedWeapon(state, state.player.meleeWeaponId)
}

export function calculateWeaponAttackTotal(
  d20Roll: number,
  playerAttack: number,
  weapon: Item,
  upgrade: WeaponUpgrade = DEFAULT_WEAPON_UPGRADE
): number {
  return d20Roll + playerAttack + (weapon.hitBonus ?? 0) + upgrade.hitBonusAdd
}

export function calculateWeaponDamage(
  d6Roll: number,
  playerAttack: number,
  weapon: Item,
  upgrade: WeaponUpgrade = DEFAULT_WEAPON_UPGRADE
): number {
  return (
    (d6Roll + Math.floor(playerAttack / 2) + (weapon.damageMod ?? 0)) * upgrade.damageMultiplier
  )
}

export function distanceInTiles(from: Position, to: Position): number {
  const colDistance = to.col - from.col
  const rowDistance = to.row - from.row
  return Math.sqrt(colDistance * colDistance + rowDistance * rowDistance)
}

export function isTargetInWeaponRange(
  playerPosition: Position,
  targetPosition: Position,
  weapon: Item | undefined
): boolean {
  return weapon?.weaponType === 'ranged' && typeof weapon.range === 'number'
    ? distanceInTiles(playerPosition, targetPosition) <= weapon.range
    : false
}

export function isMonsterInEquippedRangedWeaponRange(state: GameState, monster: Monster): boolean {
  return isTargetInWeaponRange(
    state.player.position,
    monster.position,
    getEquippedRangedWeapon(state)
  )
}

export function findNearestMonsterInEquippedRangedWeaponRange(
  state: GameState,
  monsters: Monster[]
): Monster | null {
  const inRange = monsters.filter(
    (monster) => monster.currentHP > 0 && isMonsterInEquippedRangedWeaponRange(state, monster)
  )
  let nearest: Monster | null = null
  let nearestDistance = Infinity

  for (const monster of inRange) {
    const distance = distanceInTiles(state.player.position, monster.position)
    if (distance < nearestDistance) {
      nearest = monster
      nearestDistance = distance
    }
  }
  return nearest
}

export function shouldBreakHide(weapon: Item, random: () => number = Math.random): boolean {
  if (weapon.breaksHide === 'never') return false
  if (typeof weapon.breaksHide === 'object') return random() < weapon.breaksHide.chance
  return true
}

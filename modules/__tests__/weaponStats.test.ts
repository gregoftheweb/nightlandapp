import type { Monster } from '@config/types'
import { weaponsCatalog } from '@config/weapons'
import { getInitialState } from '@modules/gameState'
import { reducer } from '../../state/reducer'
import {
  calculateWeaponAttackTotal,
  calculateWeaponDamage,
  findNearestMonsterInEquippedRangedWeaponRange,
  isTargetInWeaponRange,
  shouldBreakHide,
} from '../weaponStats'

const weapon = (id: string) => {
  const result = weaponsCatalog.find((candidate) => candidate.id === id)
  if (!result) throw new Error(`Missing test weapon ${id}`)
  return result
}

const monsterAt = (id: string, row: number, col: number): Monster =>
  ({ id, currentHP: 10, position: { row, col } }) as Monster

describe('canonical weapon stats', () => {
  it('contains only the supported weapons and fully removes the Short Sword', () => {
    expect(weaponsCatalog.map(({ id }) => id)).toEqual([
      'weapon-discos-001',
      'weapon-valkyries-bow-001',
      'weapon-shurikens-001',
      'weapon-lazer-pistol-001',
      'weapon-earth-current-bolter-001',
      'weapon-voidglass-needler-001',
      'weapon-cinder-wrought-torch-001',
    ])
    expect(weaponsCatalog.some(({ name }) => name === 'Short Sword')).toBe(false)
  })

  it('keeps the Discos baseline exactly equal to the former formula', () => {
    const discos = weapon('weapon-discos-001')
    for (let d20 = 1; d20 <= 20; d20++) {
      expect(calculateWeaponAttackTotal(d20, 8, discos)).toBe(d20 + 8)
    }
    for (let d6 = 1; d6 <= 6; d6++) {
      expect(calculateWeaponDamage(d6, 8, discos)).toBe(d6 + 4)
    }
    const average =
      Array.from({ length: 6 }, (_, index) => calculateWeaponDamage(index + 1, 8, discos)).reduce(
        (sum, damage) => sum + damage,
        0
      ) / 6
    expect(average).toBe(7.5)
  })

  it.each([
    ['weapon-discos-001', 0, 0],
    ['weapon-shurikens-001', -1, 3],
    ['weapon-valkyries-bow-001', 1, -1],
    ['weapon-lazer-pistol-001', 3, 2],
    ['weapon-earth-current-bolter-001', 5, 3],
    ['weapon-voidglass-needler-001', 6, 5],
    ['weapon-cinder-wrought-torch-001', 9, -1],
  ])('applies %s damage and accuracy modifiers', (id, damageMod, hitBonus) => {
    const selected = weapon(id as string)
    expect(calculateWeaponAttackTotal(10, 8, selected)).toBe(18 + (hitBonus as number))
    expect(calculateWeaponDamage(3, 8, selected)).toBe(7 + (damageMod as number))
  })

  it('composes a second upgrade by multiplying damage and accumulating accuracy', () => {
    const initial = getInitialState('1')
    const once = reducer(initial, {
      type: 'APPLY_WEAPON_UPGRADE',
      payload: { weaponId: 'weapon-discos-001', damageMultiplier: 1.5, hitBonusAdd: 2 },
    })
    const twice = reducer(once, {
      type: 'APPLY_WEAPON_UPGRADE',
      payload: { weaponId: 'weapon-discos-001', damageMultiplier: 2, hitBonusAdd: 3 },
    })
    expect(twice.weaponUpgrades['weapon-discos-001']).toEqual({
      damageMultiplier: 3,
      hitBonusAdd: 5,
    })
  })

  it.each([
    ['weapon-shurikens-001', 12],
    ['weapon-valkyries-bow-001', 22],
    ['weapon-lazer-pistol-001', 30],
    ['weapon-earth-current-bolter-001', 36],
    ['weapon-voidglass-needler-001', 40],
    ['weapon-cinder-wrought-torch-001', 24],
  ])('enforces %s range at its tile boundary', (id, range) => {
    const selected = weapon(id as string)
    expect(
      isTargetInWeaponRange({ row: 0, col: 0 }, { row: 0, col: range as number }, selected)
    ).toBe(true)
    expect(
      isTargetInWeaponRange({ row: 0, col: 0 }, { row: 0, col: (range as number) + 1 }, selected)
    ).toBe(false)
  })

  it('auto-targeting skips out-of-range monsters and selects the nearest eligible target', () => {
    const initial = getInitialState('1')
    const state = {
      ...initial,
      player: {
        ...initial.player,
        position: { row: 0, col: 0 },
        equippedRangedWeaponId: 'weapon-shurikens-001',
      },
    }
    const inRange = monsterAt('in-range', 0, 10)
    const outOfRange = monsterAt('out-of-range', 0, 13)
    expect(findNearestMonsterInEquippedRangedWeaponRange(state, [outOfRange, inRange])).toBe(
      inRange
    )
    expect(findNearestMonsterInEquippedRangedWeaponRange(state, [outOfRange])).toBeNull()
  })

  it('implements deterministic and probabilistic hide-breaking policies', () => {
    expect(shouldBreakHide(weapon('weapon-shurikens-001'), () => 0)).toBe(false)
    expect(shouldBreakHide(weapon('weapon-valkyries-bow-001'), () => 0.99)).toBe(true)
    const needler = weapon('weapon-voidglass-needler-001')
    let breaks = 0
    for (let index = 0; index < 1000; index++) {
      if (shouldBreakHide(needler, () => index / 1000)) breaks++
    }
    expect(breaks).toBe(500)
  })
})

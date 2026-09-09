import type { Effect, Item } from '@config/types'
import { getInitialState } from '../gameState'
import { applyEffect } from '../effects'
import { calculateWeaponDamage } from '../weaponStats'
import { reducer } from '../../state/reducer'

const item = { id: 'potion-test', name: 'Potion' } as Item

function applyPotionEffect(
  effect: Effect,
  state = getInitialState('1', { skipGameboardLayout: true })
) {
  const dispatch = jest.fn()
  const showDialog = jest.fn()
  const result = applyEffect(effect, {
    state,
    dispatch,
    showDialog,
    sourceType: 'item',
    sourceId: item.id,
    trigger: 'onUseItem',
    item,
  })
  return { dispatch, showDialog, result }
}

describe('trail potion effects', () => {
  it('places reusable potion templates along a generated trail', () => {
    const state = getInitialState('1')
    const generatedNames = state.items
      .filter((candidate) => candidate.id?.startsWith('generated:'))
      .map((candidate) => candidate.shortName)

    expect(generatedNames.filter((name) => name === 'healthPotion')).toHaveLength(3)
    expect(generatedNames.filter((name) => name === 'jauntJuice')).toHaveLength(2)
    expect(generatedNames.filter((name) => name === 'injectaGrande')).toHaveLength(2)
  })

  it('describes healing after a potion is consumed', () => {
    const state = getInitialState('1', { skipGameboardLayout: true })
    state.player.currentHP = 50
    const { showDialog, result } = applyPotionEffect({ type: 'heal', value: 25 }, state)
    expect(result).toMatchObject({
      success: true,
      consumeItem: true,
      message: 'You feel healed some.',
    })
    expect(showDialog).toHaveBeenCalledWith('You feel healed some.', 3000)
  })

  it('restores and arms one jaunt charge', () => {
    const { dispatch, showDialog, result } = applyPotionEffect({ type: 'restore_jaunt', value: 1 })
    expect(result.consumeItem).toBe(true)
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'UPDATE_PLAYER' }))
    expect(showDialog).toHaveBeenCalledWith(
      'You feel ready to jaunt. Tap on the map to jaunt.',
      4000
    )
  })

  it('boosts damage by 50% and expires after ten combat rounds', () => {
    const initial = getInitialState('1', { skipGameboardLayout: true })
    const { dispatch } = applyPotionEffect(
      { type: 'strength_boost', multiplier: 1.5, duration: 10 },
      initial
    )
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { updates: { strengthDamageMultiplier: 1.5, strengthBoostRounds: 10 } },
      })
    )
    const weapon = initial.weapons[0]
    expect(calculateWeaponDamage(2, 8, weapon, undefined, 1.5)).toBe(
      calculateWeaponDamage(2, 8, weapon) * 1.5
    )
    let state = reducer(initial, {
      type: 'UPDATE_PLAYER',
      payload: { updates: { strengthDamageMultiplier: 1.5, strengthBoostRounds: 10 } },
    })
    for (let round = 0; round < 10; round++)
      state = reducer(state, { type: 'DECREMENT_STRENGTH_BOOST' })
    expect(state.player).toMatchObject({ strengthDamageMultiplier: 1, strengthBoostRounds: 0 })
  })
})

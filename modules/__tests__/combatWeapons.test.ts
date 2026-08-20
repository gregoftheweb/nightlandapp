import type { GameState, Monster } from '@config/types'
import { executeRangedAttack } from '../combat'
import { getInitialState } from '../gameState'

const TARGET_ID = 'range-test-monster'

function rangedState(weaponId: string, distance = 1): GameState {
  const initial = getInitialState('1')
  const target = {
    id: TARGET_ID,
    name: 'Range Test Monster',
    shortName: 'range-test-monster',
    currentHP: 10,
    position: { row: 0, col: distance },
  } as Monster
  return {
    ...initial,
    player: {
      ...initial.player,
      position: { row: 0, col: 0 },
      equippedRangedWeaponId: weaponId,
      rangedWeaponInventoryIds: [weaponId],
      hideActive: true,
      isHidden: true,
    },
    activeMonsters: [target],
  }
}

function fire(state: GameState, dispatch: jest.Mock, hideRandom: () => number = () => 0) {
  return executeRangedAttack(state, dispatch, TARGET_ID, 0, 0, 10, 0, hideRandom)
}

describe('ranged weapon fire rules', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('does not clear hideActive when Shurikens are fired', () => {
    const dispatch = jest.fn()
    const state = rangedState('weapon-shurikens-001')
    expect(fire(state, dispatch)).not.toBeNull()
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UPDATE_PLAYER',
        payload: { updates: { hideActive: false } },
      })
    )
    expect(state.player.hideActive).toBe(true)
    expect(state.player.isHidden).toBe(true)
  })

  it.each([
    'weapon-valkyries-bow-001',
    'weapon-lazer-pistol-001',
    'weapon-earth-current-bolter-001',
    'weapon-cinder-wrought-torch-001',
  ])('clears hideActive when %s is fired without touching isHidden', (weaponId) => {
    const dispatch = jest.fn()
    const state = rangedState(weaponId)
    expect(fire(state, dispatch, () => 0.99)).not.toBeNull()
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: { updates: { hideActive: false } },
    })
    expect(state.player.isHidden).toBe(true)
  })

  it('rolls the Needler hide break independently for each shot at 50%', () => {
    const state = rangedState('weapon-voidglass-needler-001')
    let breaks = 0
    for (let index = 0; index < 100; index++) {
      const dispatch = jest.fn()
      fire(state, dispatch, () => index / 100)
      if (dispatch.mock.calls.some(([action]) => action.type === 'UPDATE_PLAYER')) breaks++
    }
    expect(breaks).toBe(50)
  })

  it('refuses to fire at a target beyond the equipped weapon range', () => {
    const dispatch = jest.fn()
    const state = rangedState('weapon-shurikens-001', 13)
    expect(fire(state, dispatch)).toBeNull()
    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_COMBAT_LOG',
      payload: { message: 'Target is out of range.' },
    })
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'ADD_PROJECTILE' }))
  })
})

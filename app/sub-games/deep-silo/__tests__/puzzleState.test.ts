import {
  GENERATOR_DEATH_MESSAGE,
  GENERATOR_KILLER_NAME,
  INITIAL_DEEP_SILO_STATE,
  applyGeneratorSurge,
  canCompleteDeepSilo,
  pickUpDiscos,
  placeDiscos,
  powerOn,
} from '../puzzleState'

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

describe('Deep Silo power puzzle', () => {
  it('places Discos safely while power is off', () => {
    expect(placeDiscos(INITIAL_DEEP_SILO_STATE)).toEqual({
      state: { discosOnTable: true, powerOn: false, weaponCharged: false },
      surge: false,
    })
  })

  it('rejects powered placement, removes exactly 10 HP, powers off, and does not complete', () => {
    const dispatch = jest.fn()
    const navigate = jest.fn()
    const result = placeDiscos({ ...INITIAL_DEEP_SILO_STATE, powerOn: true })

    expect(result).toEqual({ state: INITIAL_DEEP_SILO_STATE, surge: true })
    expect(applyGeneratorSurge(25, dispatch, navigate)).toBe(15)
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: { updates: { currentHP: 15 } },
    })
    expect(navigate).not.toHaveBeenCalled()
    expect(canCompleteDeepSilo(result.state)).toBe(false)
  })

  it('dispatches GAME_OVER and navigates to death when the surge is lethal', () => {
    const dispatch = jest.fn()
    const navigate = jest.fn()

    expect(applyGeneratorSurge(10, dispatch, navigate)).toBe(0)
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: 'GAME_OVER',
      payload: {
        message: GENERATOR_DEATH_MESSAGE,
        killerName: GENERATOR_KILLER_NAME,
        suppressDeathDialog: true,
      },
    })
    expect(navigate).toHaveBeenCalledWith('/death')
  })

  it('only charges with Discos present and never charges twice', () => {
    expect(powerOn(INITIAL_DEEP_SILO_STATE).chargedNow).toBe(false)
    const placed = placeDiscos(INITIAL_DEEP_SILO_STATE).state
    const first = powerOn(placed)
    const second = powerOn(first.state)
    expect(first.chargedNow).toBe(true)
    expect(second.chargedNow).toBe(false)
    expect(second.state.weaponCharged).toBe(true)
  })

  it('requires both a successful charge and pickup for completion', () => {
    const chargedOnTable = powerOn(placeDiscos(INITIAL_DEEP_SILO_STATE).state).state
    expect(canCompleteDeepSilo(chargedOnTable)).toBe(false)
    expect(canCompleteDeepSilo(pickUpDiscos(chargedOnTable))).toBe(true)
    expect(canCompleteDeepSilo({ ...INITIAL_DEEP_SILO_STATE, discosOnTable: false })).toBe(false)
  })
})

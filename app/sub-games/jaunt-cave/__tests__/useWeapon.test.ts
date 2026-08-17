import { act, renderHook } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { Item } from '@config/types'
import { getInitialState } from '@modules/gameState'
import { DaemonState } from '../_components/useBattleState'
import { useWeapon, UseWeaponProps } from '../_components/useWeapon'

const STANDARD_WEAPON_ID = 'weapon-test-pistol-001'
const LASER_WEAPON_ID = 'weapon-lazer-pistol-001'

const makeWeapon = (id: string): Item => ({
  kind: 'item',
  id,
  category: 'weapon',
  shortName: id,
  name: id,
  description: 'Test weapon',
  type: 'weapon',
  weaponType: 'ranged',
  collectible: true,
  projectileColor: '#ff7a00',
})

describe('useWeapon', () => {
  const initialAppState = AppState.currentState
  let appStateListener: ((state: AppStateStatus) => void) | undefined

  beforeEach(() => {
    jest.useFakeTimers()
    AppState.currentState = 'active'
    appStateListener = undefined
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateListener = listener
      return { remove: jest.fn() }
    })
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
    jest.restoreAllMocks()
    AppState.currentState = initialAppState
  })

  it('uses the latest equipped weapon and hit callback when the projectile lands', () => {
    const standardWeapon = makeWeapon(STANDARD_WEAPON_ID)
    const laserWeapon = makeWeapon(LASER_WEAPON_ID)
    const baseState = getInitialState('1')
    const oldHitHandler = jest.fn()
    const latestHitHandler = jest.fn()

    const makeProps = (equippedRangedWeaponId: string, onDaemonHit: jest.Mock): UseWeaponProps => ({
      gameState: {
        ...baseState,
        weapons: [standardWeapon, laserWeapon],
        player: {
          ...baseState.player,
          equippedRangedWeaponId,
          rangedWeaponInventoryIds: [STANDARD_WEAPON_ID, LASER_WEAPON_ID],
        },
      },
      dispatch: jest.fn(),
      arenaSize: { width: 100, height: 100 },
      onSetFeedback: jest.fn(),
      onFireProjectile: jest.fn(),
      getDaemonState: () => DaemonState.LANDED,
      getCurrentDaemonPosition: () => 'left',
      projectileDuration: 100,
      getEquippedWeaponDamage: () => ({ min: 10, max: 10 }),
      onDaemonHit,
    })

    const initialProps = makeProps(STANDARD_WEAPON_ID, oldHitHandler)
    const { result, rerender } = renderHook((props: UseWeaponProps) => useWeapon(props), {
      initialProps,
    })

    rerender(makeProps(LASER_WEAPON_ID, latestHitHandler))

    act(() => {
      result.current.handleZapTargetPress('left')
      jest.advanceTimersByTime(100)
    })

    expect(latestHitHandler).toHaveBeenCalledWith(30)
    expect(oldHitHandler).not.toHaveBeenCalled()
  })

  it('invalidates an in-flight projectile when the app backgrounds', () => {
    const weapon = makeWeapon(STANDARD_WEAPON_ID)
    const state = getInitialState('1')
    const onDaemonHit = jest.fn()
    const { result } = renderHook(() =>
      useWeapon({
        gameState: {
          ...state,
          weapons: [weapon],
          player: {
            ...state.player,
            equippedRangedWeaponId: STANDARD_WEAPON_ID,
            rangedWeaponInventoryIds: [STANDARD_WEAPON_ID],
          },
        },
        dispatch: jest.fn(),
        arenaSize: { width: 100, height: 100 },
        onSetFeedback: jest.fn(),
        onFireProjectile: jest.fn(),
        getDaemonState: () => DaemonState.LANDED,
        getCurrentDaemonPosition: () => 'left',
        projectileDuration: 100,
        getEquippedWeaponDamage: () => ({ min: 10, max: 10 }),
        onDaemonHit,
      })
    )

    act(() => result.current.handleZapTargetPress('left'))
    act(() => appStateListener?.('background'))
    act(() => jest.advanceTimersByTime(100))

    expect(onDaemonHit).not.toHaveBeenCalled()
    expect(result.current.hitIndicator).toBeNull()
  })
})

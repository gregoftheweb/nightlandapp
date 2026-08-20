import { fromSnapshot, getInitialState, toSnapshot } from '../gameState'
import { checkObjectInteractions } from '../interactions'
import { reducer } from '../../state/reducer'

describe('Great Power interactions and object updates', () => {
  test('a stale awaken action is harmless and Great Power collision effects still execute', () => {
    const state = getInitialState('1')
    const watcher = state.level.greatPowers!.find((power) => power.shortName === 'watcher_se')!
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    expect(
      reducer(state, {
        type: 'AWAKEN_GREAT_POWER',
        payload: { greatPowerId: watcher.id },
      })
    ).toBe(state)

    const dispatch = jest.fn()
    checkObjectInteractions(state, dispatch, watcher.position)

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'AWAKEN_GREAT_POWER' })
    )
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'ADD_COMBAT_LOG' }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'GAME_OVER' }))
    warn.mockRestore()
  })

  test('the former top-level greatPowers field is discarded from legacy snapshots', () => {
    const snapshot = toSnapshot(getInitialState('1')) as ReturnType<typeof toSnapshot> & {
      greatPowers?: unknown
    }
    snapshot.greatPowers = [{ id: 'stale-duplicate' }]

    expect('greatPowers' in fromSnapshot(snapshot)).toBe(false)
  })

  test('UPDATE_OBJECT keeps gameplay and rendered level objects synchronized', () => {
    const state = getInitialState('1')
    const lastTrigger = 123456
    const updated = reducer(state, {
      type: 'UPDATE_OBJECT',
      payload: { shortName: 'cursedTotem', updates: { lastTrigger } },
    })

    expect(updated.objects).toBe(updated.level.objects)
    expect(updated.objects.find((object) => object.shortName === 'cursedTotem')?.lastTrigger).toBe(
      lastTrigger
    )
    expect(
      updated.level.objects.find((object) => object.shortName === 'cursedTotem')?.lastTrigger
    ).toBe(lastTrigger)
  })

  test('the Cursed Totem swarm retains its 50-second UPDATE_OBJECT cooldown', () => {
    jest.spyOn(Date, 'now').mockReturnValue(100_000)
    const state = getInitialState('1')
    const cursedTotem = state.objects.find((object) => object.shortName === 'cursedTotem')!

    const firstDispatch = jest.fn()
    checkObjectInteractions(state, firstDispatch, cursedTotem.position!)
    expect(firstDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UPDATE_OBJECT',
        payload: expect.objectContaining({
          shortName: 'cursedTotem',
          updates: { lastTrigger: 100_000 },
        }),
      })
    )

    const coolingDown = reducer(state, {
      type: 'UPDATE_OBJECT',
      payload: { shortName: 'cursedTotem', updates: { lastTrigger: 100_000 } },
    })
    const cooldownDispatch = jest.fn()
    checkObjectInteractions(coolingDown, cooldownDispatch, cursedTotem.position!)
    expect(cooldownDispatch).not.toHaveBeenCalled()

    jest.restoreAllMocks()
  })
})

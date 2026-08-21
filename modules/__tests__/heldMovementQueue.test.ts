import {
  clearHeldMovementQueue,
  completeHeldMove,
  heldMoveCanProgress,
  heldMovementMustStop,
  queueHeldMove,
  type HeldMoveDirection,
  type HeldMovementQueueRefs,
} from '../heldMovementQueue'

function refs(): HeldMovementQueueRefs {
  return { inFlight: { current: false }, pending: { current: null } }
}

describe('held movement coalescing queue', () => {
  test('coalesces ticks into one overwriteable pending slot and executes it on completion', () => {
    const queueRefs = refs()
    const executed: HeldMoveDirection[] = []
    const execute = (direction: HeldMoveDirection) => {
      executed.push(direction)
      return true
    }
    const stop = jest.fn()

    queueHeldMove('up', queueRefs, execute, stop)
    queueHeldMove('left', queueRefs, execute, stop)
    queueHeldMove('right', queueRefs, execute, stop)

    expect(executed).toEqual(['up'])
    expect(queueRefs.pending.current).toBe('right')

    completeHeldMove(queueRefs, execute, stop)

    expect(executed).toEqual(['up', 'right'])
    expect(queueRefs.pending.current).toBeNull()
    expect(queueRefs.inFlight.current).toBe(true)
  })

  test('stops and clears the queue when execution makes no progress', () => {
    const queueRefs = refs()
    const stop = jest.fn(() => clearHeldMovementQueue(queueRefs))

    queueHeldMove('up', queueRefs, () => false, stop)

    expect(stop).toHaveBeenCalledTimes(1)
    expect(queueRefs.inFlight.current).toBe(false)
    expect(queueRefs.pending.current).toBeNull()
  })

  test.each([
    ['up', { row: 0, col: 5 }],
    ['down', { row: 9, col: 5 }],
    ['left', { row: 5, col: 0 }],
    ['right', { row: 5, col: 9 }],
  ] as const)('%s cannot progress at its board edge', (direction, position) => {
    expect(heldMoveCanProgress(direction, position, 10, 10)).toBe(false)
  })

  test.each([
    [
      'combat',
      { inCombat: true, settingsVisible: false, inventoryVisible: false, gameOver: false },
    ],
    [
      'settings',
      { inCombat: false, settingsVisible: true, inventoryVisible: false, gameOver: false },
    ],
    [
      'inventory',
      { inCombat: false, settingsVisible: false, inventoryVisible: true, gameOver: false },
    ],
    [
      'gameOver',
      { inCombat: false, settingsVisible: false, inventoryVisible: false, gameOver: true },
    ],
  ] as const)('%s transition requires cleanup of in-flight and pending state', (_name, state) => {
    const queueRefs = refs()
    queueRefs.inFlight.current = true
    queueRefs.pending.current = 'down'

    if (heldMovementMustStop(state)) clearHeldMovementQueue(queueRefs)

    expect(queueRefs.inFlight.current).toBe(false)
    expect(queueRefs.pending.current).toBeNull()
  })
})

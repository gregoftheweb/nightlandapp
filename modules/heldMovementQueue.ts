export type HeldMoveDirection = 'up' | 'down' | 'left' | 'right'

export interface MutableRef<T> {
  current: T
}

export interface HeldMovementQueueRefs {
  inFlight: MutableRef<boolean>
  pending: MutableRef<HeldMoveDirection | null>
}

export function heldMovementMustStop(state: {
  inCombat: boolean
  settingsVisible: boolean
  inventoryVisible: boolean
  gameOver: boolean
}): boolean {
  return state.inCombat || state.settingsVisible || state.inventoryVisible || state.gameOver
}

export function heldMoveCanProgress(
  direction: HeldMoveDirection,
  position: { row: number; col: number },
  gridWidth: number,
  gridHeight: number
): boolean {
  return !(
    (direction === 'up' && position.row === 0) ||
    (direction === 'down' && position.row === gridHeight - 1) ||
    (direction === 'left' && position.col === 0) ||
    (direction === 'right' && position.col === gridWidth - 1)
  )
}

export function queueHeldMove(
  direction: HeldMoveDirection,
  refs: HeldMovementQueueRefs,
  execute: (direction: HeldMoveDirection) => boolean,
  stop: () => void
): void {
  if (refs.inFlight.current) {
    refs.pending.current = direction
    return
  }

  refs.inFlight.current = true
  if (!execute(direction)) stop()
}

export function completeHeldMove(
  refs: HeldMovementQueueRefs,
  execute: (direction: HeldMoveDirection) => boolean,
  stop: () => void
): void {
  if (!refs.inFlight.current) return

  refs.inFlight.current = false
  const pending = refs.pending.current
  refs.pending.current = null
  if (pending) queueHeldMove(pending, refs, execute, stop)
}

export function clearHeldMovementQueue(refs: HeldMovementQueueRefs): void {
  refs.inFlight.current = false
  refs.pending.current = null
}

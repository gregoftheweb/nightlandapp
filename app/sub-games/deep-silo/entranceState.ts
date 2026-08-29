import { useSyncExternalStore } from 'react'

export const CURRENT_LOOM_IDS = [
  'current-loom-01',
  'current-loom-02',
  'current-loom-03',
  'current-loom-04',
  'current-loom-05',
] as const

export const DEEP_SILO_SWITCH_THROWN_FLAG = 'deep-silo:switch-thrown'

export function countCompletedCurrentLooms(completed: Record<string, boolean> | undefined): number {
  return CURRENT_LOOM_IDS.filter((id) => completed?.[id] === true).length
}

export function isDeepSiloSwitchThrown(completed: Record<string, boolean> | undefined): boolean {
  return completed?.[DEEP_SILO_SWITCH_THROWN_FLAG] === true
}

export interface DeepSiloDevState {
  loomOverrideCount: number
  switchThrown: boolean
}

const INITIAL_DEV_STATE: DeepSiloDevState = { loomOverrideCount: 0, switchThrown: false }
let devState = INITIAL_DEV_STATE
const listeners = new Set<() => void>()

function emitDevState(next: DeepSiloDevState) {
  if (!__DEV__) return
  devState = next
  listeners.forEach((listener) => listener())
}

export function getDeepSiloDevState(): DeepSiloDevState {
  return __DEV__ ? devState : INITIAL_DEV_STATE
}

export function incrementDevLoomOverride(): void {
  if (!__DEV__ || devState.loomOverrideCount >= CURRENT_LOOM_IDS.length) return
  emitDevState({ ...devState, loomOverrideCount: devState.loomOverrideCount + 1 })
}

export function setDevSwitchThrown(): void {
  if (!__DEV__ || devState.loomOverrideCount < CURRENT_LOOM_IDS.length) return
  emitDevState({ ...devState, switchThrown: true })
}

export function resetDeepSiloDevStateForTests(): void {
  devState = INITIAL_DEV_STATE
  listeners.forEach((listener) => listener())
}

export function useDeepSiloDevState(): DeepSiloDevState {
  return useSyncExternalStore(
    (listener) => {
      if (!__DEV__) return () => undefined
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getDeepSiloDevState,
    () => INITIAL_DEV_STATE
  )
}

export function effectiveLoomCount(realCount: number, overrideCount: number): number {
  return __DEV__ && overrideCount > 0 ? overrideCount : realCount
}

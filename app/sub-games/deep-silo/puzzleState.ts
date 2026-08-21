import { useCallback, useEffect, useRef, useState } from 'react'

import type { GameDispatch } from '@context/GameContext'
import { getSubGameSave, setSubGameSave } from '../_shared/persistence'

export const DEEP_SILO_SAVE_KEY = 'deep-silo-power-puzzle'
export const DEEP_SILO_SAVE_VERSION = 1
export const GENERATOR_SURGE_DAMAGE = 10
export const GENERATOR_DEATH_MESSAGE =
  'Christos is struck by a violent surge from the failing generator.'
export const GENERATOR_KILLER_NAME = 'The Failing Current'

export interface DeepSiloPuzzleState {
  discosOnTable: boolean
  powerOn: boolean
  weaponCharged: boolean
}

export const INITIAL_DEEP_SILO_STATE: DeepSiloPuzzleState = {
  discosOnTable: false,
  powerOn: false,
  weaponCharged: false,
}

export function placeDiscos(state: DeepSiloPuzzleState): {
  state: DeepSiloPuzzleState
  surge: boolean
} {
  if (state.powerOn) {
    return { state: { ...state, powerOn: false, discosOnTable: false }, surge: true }
  }
  return { state: { ...state, discosOnTable: true }, surge: false }
}

export const pickUpDiscos = (state: DeepSiloPuzzleState): DeepSiloPuzzleState => ({
  ...state,
  discosOnTable: false,
})

export function powerOn(state: DeepSiloPuzzleState): {
  state: DeepSiloPuzzleState
  chargedNow: boolean
} {
  const chargedNow = state.discosOnTable && !state.weaponCharged
  return {
    state: { ...state, powerOn: true, weaponCharged: state.weaponCharged || chargedNow },
    chargedNow,
  }
}

export const powerOff = (state: DeepSiloPuzzleState): DeepSiloPuzzleState => ({
  ...state,
  powerOn: false,
})

export const canCompleteDeepSilo = (state: DeepSiloPuzzleState): boolean =>
  state.weaponCharged && !state.discosOnTable

export function applyGeneratorSurge(
  currentHP: number,
  dispatch: GameDispatch,
  navigateToDeath: (route: string) => void
): number {
  const nextHP = Math.max(0, currentHP - GENERATOR_SURGE_DAMAGE)
  dispatch({ type: 'UPDATE_PLAYER', payload: { updates: { currentHP: nextHP } } })
  if (nextHP <= 0) {
    dispatch({
      type: 'GAME_OVER',
      payload: {
        message: GENERATOR_DEATH_MESSAGE,
        killerName: GENERATOR_KILLER_NAME,
        suppressDeathDialog: true,
      },
    })
    navigateToDeath('/death')
  }
  return nextHP
}

export function useDeepSiloPuzzleState() {
  const [state, setState] = useState(INITIAL_DEEP_SILO_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const stateRef = useRef(state)
  const saveQueueRef = useRef(Promise.resolve())
  stateRef.current = state

  useEffect(() => {
    let active = true
    void getSubGameSave<DeepSiloPuzzleState>(DEEP_SILO_SAVE_KEY).then((saved) => {
      if (!active) return
      if (saved?.version === DEEP_SILO_SAVE_VERSION) {
        stateRef.current = saved.data
        setState(saved.data)
      }
      setIsLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const commit = useCallback((next: DeepSiloPuzzleState): Promise<void> => {
    stateRef.current = next
    setState(next)
    const write = saveQueueRef.current
      .catch(() => undefined)
      .then(() => setSubGameSave(DEEP_SILO_SAVE_KEY, next, DEEP_SILO_SAVE_VERSION))
    saveQueueRef.current = write
    return write
  }, [])

  return { state, stateRef, isLoading, commit }
}

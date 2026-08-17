import { useMemo, useRef } from 'react'

import { collectible } from '@config/objects'
import type { Effect, GameState, Item } from '@config/types'
import { useGameContext, type GameDispatch } from '@context/GameContext'
import { applyEffect } from '@modules/effects'
import { saveWaypoint } from '@modules/saveGame'
import { exitSubGame } from '@modules/subGames'
import { reducer } from '../../../state/reducer'

import { clearSubGameSave, getSubGameSave, setSubGameSave } from './persistence'

export type SubGameShape =
  'dialogue' | 'dial-lock' | 'word-grid' | 'exploration-sequence' | 'one-off'

export type SubGameFailureExit = 'death' | 'safe'

export type SubGameRevisitPolicy =
  'restart' | 'resume' | 'success-screen' | 'aftermath-screen' | 'unavailable'

export type SubGameProgressConfig =
  | { mode: 'local-only' }
  | {
      mode: 'async-storage'
      saveKey: string
      version: number
      clearOnCompletion: boolean
    }

export type SubGameRewardConfig =
  | { kind: 'none' }
  | {
      kind: 'item' | 'weapon' | 'effect' | 'ability'
      id: string
      grantEvent: string
      idempotent: true
    }

export interface SubGameLifecycleConfig {
  id: string
  shape: SubGameShape
  entryRoute: string
  completion: {
    event: string
    idempotent: true
  }
  failureExit: SubGameFailureExit
  waypoint:
    | { createsWaypoint: false }
    | {
        createsWaypoint: true
        waypointName: string
        snapshot: string
        idempotent: true
      }
  revisit: SubGameRevisitPolicy
  progress: SubGameProgressConfig
  reward: SubGameRewardConfig
  returnToRpg: {
    signalRpgResume: true
    exitSubGame: true
  }
}

export interface SubGameLifecycleController<TProgress = unknown> {
  completeSubGame: () => Promise<void>
  failSubGame: () => Promise<void>
  isCompleted: () => boolean
  resolveEntryRoute: () => string | null
  loadProgress: () => Promise<TProgress | null>
  saveProgress: (progress: TProgress) => Promise<void>
  clearProgress: () => Promise<void>
}

export interface LifecycleDependencies {
  getState: () => GameState
  dispatch: GameDispatch
  signalRpgResume: () => void
  exit: typeof exitSubGame
  saveWaypoint: typeof saveWaypoint
  getProgress: typeof getSubGameSave
  setProgress: typeof setSubGameSave
  clearProgress: typeof clearSubGameSave
}

const rewardFlag = (config: SubGameLifecycleConfig): string =>
  `${config.id}:reward:${config.reward.kind === 'none' ? 'none' : config.reward.id}`

function routeDirectory(entryRoute: string): string {
  const slash = entryRoute.lastIndexOf('/')
  return slash > 0 ? entryRoute.slice(0, slash) : entryRoute
}

export function resolveSubGameEntryRoute(
  config: SubGameLifecycleConfig,
  completed: boolean
): string | null {
  if (!completed) return config.entryRoute

  switch (config.revisit) {
    case 'restart':
    case 'resume':
      return config.entryRoute
    case 'success-screen':
      return `${routeDirectory(config.entryRoute)}/success`
    case 'aftermath-screen':
      return `${routeDirectory(config.entryRoute)}/aftermath`
    case 'unavailable':
      return null
  }
}

function hasDurableReward(state: GameState, config: SubGameLifecycleConfig): boolean {
  const reward = config.reward
  if (reward.kind === 'none') return true
  if (state.subGamesCompleted?.[rewardFlag(config)] === true) return true

  if (reward.kind === 'item') {
    return state.player.inventory.some((item) => item.id === reward.id)
  }

  if (reward.kind === 'weapon') {
    return (
      state.player.rangedWeaponInventoryIds.includes(reward.id) ||
      state.player.weapons.some((weapon) => weapon.id === reward.id)
    )
  }

  return false
}

function findItemReward(id: string): Item {
  const toKebabCase = (value: string) =>
    value
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .toLowerCase()
  const template = Object.entries(collectible).find(
    ([key, candidate]) =>
      candidate.id === id ||
      candidate.shortName === id ||
      toKebabCase(key) === id ||
      (candidate.shortName ? toKebabCase(candidate.shortName) === id : false)
  )?.[1]
  if (!template) {
    throw new Error(`Sub-game lifecycle reward item '${id}' was not found in collectible config`)
  }

  return {
    ...template,
    kind: 'item',
    id,
    type: 'collectible',
    collectible: true,
  } as Item
}

function rewardActions(
  state: GameState,
  config: SubGameLifecycleConfig
): Parameters<GameDispatch>[0][] {
  const reward = config.reward
  if (reward.kind === 'none' || hasDurableReward(state, config)) return []

  const actions: Parameters<GameDispatch>[0][] = []

  if (reward.kind === 'item') {
    actions.push({ type: 'ADD_TO_INVENTORY', payload: { item: findItemReward(reward.id) } })
  } else if (reward.kind === 'weapon') {
    const weapon = state.weapons.find((candidate) => candidate.id === reward.id)
    if (!weapon) throw new Error(`Sub-game lifecycle reward weapon '${reward.id}' was not found`)

    actions.push(
      weapon.weaponType === 'ranged'
        ? { type: 'ADD_RANGED_WEAPON', payload: { id: reward.id } }
        : { type: 'ADD_TO_WEAPONS', payload: { weapon } }
    )
  } else {
    const result = applyEffect({ type: reward.id } as Effect, {
      state,
      dispatch: (action) => actions.push(action),
      sourceType: 'system',
      sourceId: config.id,
      trigger: 'onInteract',
    })
    if (!result.success) {
      throw new Error(
        `Sub-game lifecycle ${reward.kind} reward '${reward.id}' failed: ${result.message}`
      )
    }
  }

  actions.push({
    type: 'SET_SUB_GAME_COMPLETED',
    payload: { subGameName: rewardFlag(config), completed: true },
  })
  return actions
}

function applyAndDispatch(
  initialState: GameState,
  dispatch: GameDispatch,
  actions: Parameters<GameDispatch>[0][]
): GameState {
  return actions.reduce((nextState, action) => {
    dispatch(action)
    return reducer(nextState, action)
  }, initialState)
}

export function createSubGameLifecycleController<TProgress = unknown>(
  config: SubGameLifecycleConfig,
  dependencies: LifecycleDependencies
): SubGameLifecycleController<TProgress> {
  let completionInFlight: Promise<void> | null = null
  let completionCommitted = false
  let failureCommitted = false

  const clearProgress = async () => {
    if (config.progress.mode === 'async-storage') {
      await dependencies.clearProgress(config.progress.saveKey)
    }
  }

  const controller: SubGameLifecycleController<TProgress> = {
    isCompleted: () =>
      completionCommitted || dependencies.getState().subGamesCompleted?.[config.id] === true,

    resolveEntryRoute: () =>
      resolveSubGameEntryRoute(
        config,
        completionCommitted || dependencies.getState().subGamesCompleted?.[config.id] === true
      ),

    loadProgress: async () => {
      if (config.progress.mode === 'local-only') return null
      const saved = await dependencies.getProgress<TProgress>(config.progress.saveKey)
      if (!saved || saved.version !== config.progress.version) return null
      return saved.data
    },

    saveProgress: async (progress) => {
      if (config.progress.mode === 'local-only') return
      await dependencies.setProgress(config.progress.saveKey, progress, config.progress.version)
    },

    clearProgress,

    completeSubGame: () => {
      if (completionCommitted) return Promise.resolve()
      if (completionInFlight) return completionInFlight

      completionInFlight = (async () => {
        let snapshot = dependencies.getState()
        const actions: Parameters<GameDispatch>[0][] = []

        if (snapshot.subGamesCompleted?.[config.id] !== true) {
          actions.push({
            type: 'SET_SUB_GAME_COMPLETED',
            payload: { subGameName: config.id, completed: true },
          })
        }
        actions.push(...rewardActions(snapshot, config))
        snapshot = applyAndDispatch(snapshot, dependencies.dispatch, actions)

        if (
          config.waypoint.createsWaypoint &&
          snapshot.waypointSavesCreated?.[config.waypoint.waypointName] !== true
        ) {
          await dependencies.saveWaypoint(snapshot, config.waypoint.waypointName)
          snapshot = applyAndDispatch(snapshot, dependencies.dispatch, [
            {
              type: 'SET_WAYPOINT_CREATED',
              payload: { waypointName: config.waypoint.waypointName },
            },
          ])
        }

        if (config.progress.mode === 'async-storage' && config.progress.clearOnCompletion) {
          await clearProgress()
        }

        completionCommitted = true
        dependencies.signalRpgResume()
        dependencies.exit({ completed: true })
      })().finally(() => {
        completionInFlight = null
      })

      return completionInFlight
    },

    failSubGame: async () => {
      if (failureCommitted || completionCommitted) return
      failureCommitted = true

      if (config.failureExit === 'death') {
        dependencies.dispatch({
          type: 'GAME_OVER',
          payload: {
            message: `Christos failed the ${config.id} encounter.`,
            killerName: config.id,
            suppressDeathDialog: false,
          },
        })
        return
      }

      dependencies.signalRpgResume()
      dependencies.exit({ completed: false })
    },
  }

  return controller
}

export function useSubGameLifecycle<TProgress = unknown>(
  config: SubGameLifecycleConfig
): SubGameLifecycleController<TProgress> {
  const { state, dispatch, signalRpgResume } = useGameContext()
  const stateRef = useRef(state)
  stateRef.current = state

  const controllerRef = useRef<SubGameLifecycleController<TProgress> | null>(null)
  const configRef = useRef(config)

  if (configRef.current !== config) {
    throw new Error('Sub-game lifecycle config must have a stable module-level identity')
  }

  controllerRef.current ??= createSubGameLifecycleController<TProgress>(config, {
    getState: () => stateRef.current,
    dispatch,
    signalRpgResume,
    exit: exitSubGame,
    saveWaypoint,
    getProgress: getSubGameSave,
    setProgress: setSubGameSave,
    clearProgress: clearSubGameSave,
  })

  return useMemo(() => controllerRef.current!, [])
}

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { Animated, AppState, type AppStateStatus } from 'react-native'
import { DaemonState, PositionKey } from './DaemonSprite'

export { DaemonState }

const rollToHit = (): boolean => Math.random() < 0.8
const rollDamage = (): number => Math.floor(Math.random() * 16) + 10

export const BATTLE_TIMINGS = {
  RESTING_MIN: 3000,
  RESTING_MAX: 7000,
  PREP1: 500,
  PREP2: 200,
  LANDED: 800,
  ATTACK: 750,
  TRANSITION_TO_RESTING: 400,
  BLOCK_SHIELD_VISUAL_DURATION: 900,
  DAEMON_DEATH_NAVIGATION_DELAY: 400,
} as const

type TerminalState = 'none' | 'player-dead' | 'daemon-dead'
type ScheduledTransition =
  | 'enter-prep1'
  | 'enter-prep2'
  | 'teleport'
  | 'finish-attack'
  | 'hide-block-shield'
  | 'finish-landed'
  | 'finish-crossfade'
  | 'navigate-player-death'
  | 'navigate-daemon-death'

interface BattleViewState {
  daemonState: DaemonState
  currentPosition: PositionKey
  attackDirection: 'left' | 'right'
  previousState: DaemonState
  isCrossfading: boolean
  daemonHP: number
  isBlockActive: boolean
}

type BattleViewAction =
  | { type: 'RESET_CYCLE' }
  | { type: 'SET_PHASE'; phase: DaemonState }
  | {
      type: 'START_ATTACK'
      position: PositionKey
      direction: 'left' | 'right'
      blockActive: boolean
    }
  | { type: 'LAND'; position?: PositionKey }
  | { type: 'START_CROSSFADE' }
  | { type: 'END_CROSSFADE' }
  | { type: 'SET_BLOCK_ACTIVE'; active: boolean }
  | { type: 'DAMAGE_DAEMON'; hp: number }

const reduceBattleView = (state: BattleViewState, action: BattleViewAction): BattleViewState => {
  switch (action.type) {
    case 'RESET_CYCLE':
      return {
        ...state,
        daemonState: DaemonState.RESTING,
        previousState: state.daemonState,
        isCrossfading: false,
        isBlockActive: false,
      }
    case 'SET_PHASE':
      return { ...state, daemonState: action.phase }
    case 'START_ATTACK':
      return {
        ...state,
        daemonState: DaemonState.ATTACKING,
        currentPosition: action.position,
        attackDirection: action.direction,
        isBlockActive: action.blockActive,
      }
    case 'LAND':
      return {
        ...state,
        daemonState: DaemonState.LANDED,
        currentPosition: action.position ?? state.currentPosition,
      }
    case 'START_CROSSFADE':
      return {
        ...state,
        previousState: DaemonState.LANDED,
        daemonState: DaemonState.RESTING,
        isCrossfading: true,
      }
    case 'END_CROSSFADE':
      return { ...state, isCrossfading: false }
    case 'SET_BLOCK_ACTIVE':
      return { ...state, isBlockActive: action.active }
    case 'DAMAGE_DAEMON':
      return { ...state, daemonHP: action.hp }
  }
}

export interface UseBattleStateProps {
  initialDaemonHP?: number
  maxDaemonHP?: number
  onDaemonHit?: () => void
  onDaemonMiss?: () => void
  shakeAnim: Animated.Value
  dispatch: any
  currentPlayerHP: number
  router: any
  isFocused?: boolean
}

export interface UseBattleStateReturn {
  daemonState: DaemonState
  currentPosition: PositionKey
  attackDirection: 'left' | 'right'
  previousState: DaemonState
  isCrossfading: boolean
  daemonHP: number
  handleDaemonTap: () => void
  isVulnerable: boolean
  isAttacking: boolean
  applyPlayerDamage: (damage: number) => void
  isBlockActive: boolean
  activateBlock: () => 'success' | 'too_early' | 'too_late'
}

export function useBattleState({
  initialDaemonHP = 100,
  onDaemonHit,
  onDaemonMiss,
  shakeAnim,
  dispatch,
  currentPlayerHP,
  router,
  isFocused = true,
}: UseBattleStateProps): UseBattleStateReturn {
  const [view, viewDispatch] = useReducer(reduceBattleView, {
    daemonState: DaemonState.RESTING,
    currentPosition: 'center',
    attackDirection: 'left',
    previousState: DaemonState.RESTING,
    isCrossfading: false,
    daemonHP: initialDaemonHP,
    isBlockActive: false,
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generationRef = useRef(0)
  const mountedRef = useRef(true)
  const focusedRef = useRef(isFocused)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState ?? 'active')
  const runningRef = useRef(false)
  const terminalRef = useRef<TerminalState>('none')
  const lastPositionRef = useRef<PositionKey>('center')
  const cycleRef = useRef({ willAttack: false, nextPosition: 'center' as PositionKey })
  const blockArmedRef = useRef(false)
  const attackWasBlockedRef = useRef(false)
  const blockActiveRef = useRef(false)
  const currentHPRef = useRef(currentPlayerHP)
  const daemonHPRef = useRef(initialDaemonHP)
  const transitionRef = useRef<(transition: ScheduledTransition) => void>(() => undefined)
  const startCycleRef = useRef<() => void>(() => undefined)

  const clearScheduledTransition = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const lifecycleIsActive = useCallback(
    () => mountedRef.current && focusedRef.current && appStateRef.current === 'active',
    []
  )

  const schedule = useCallback(
    (transition: ScheduledTransition, delay: number) => {
      clearScheduledTransition()
      const generation = generationRef.current
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        if (generation !== generationRef.current || !lifecycleIsActive()) return
        transitionRef.current(transition)
      }, delay)
    },
    [clearScheduledTransition, lifecycleIsActive]
  )

  const stopForLifecycleChange = useCallback(() => {
    generationRef.current += 1
    runningRef.current = false
    clearScheduledTransition()
    blockArmedRef.current = false
    attackWasBlockedRef.current = false
    blockActiveRef.current = false
  }, [clearScheduledTransition])

  const getNextPosition = useCallback((): PositionKey => {
    const positions: PositionKey[] = ['left', 'center', 'right']
    const available = positions.filter((position) => position !== lastPositionRef.current)
    const next = available[Math.floor(Math.random() * available.length)]
    lastPositionRef.current = next
    return next
  }, [])

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start()
  }, [shakeAnim])

  const applyDaemonAttackRef = useRef<() => boolean>(() => false)
  applyDaemonAttackRef.current = () => {
    if (terminalRef.current !== 'none') return false

    if (attackWasBlockedRef.current) {
      attackWasBlockedRef.current = false
      return false
    }

    if (!rollToHit()) return false

    const newHP = Math.max(0, currentHPRef.current - rollDamage())
    currentHPRef.current = newHP
    dispatch({ type: 'UPDATE_PLAYER', payload: { updates: { currentHP: newHP } } })

    if (newHP > 0) return false

    terminalRef.current = 'player-dead'
    dispatch({
      type: 'GAME_OVER',
      payload: {
        message: 'Christos was killed by the Jaunt Daemon.',
        killerName: 'Jaunt Daemon',
        suppressDeathDialog: true,
      },
    })
    return true
  }

  const startCycle = useCallback(() => {
    if (!lifecycleIsActive() || terminalRef.current !== 'none' || runningRef.current) return

    runningRef.current = true
    cycleRef.current = {
      willAttack: Math.random() < 0.6,
      nextPosition: getNextPosition(),
    }
    viewDispatch({ type: 'RESET_CYCLE' })
    const restingTime =
      BATTLE_TIMINGS.RESTING_MIN +
      Math.random() * (BATTLE_TIMINGS.RESTING_MAX - BATTLE_TIMINGS.RESTING_MIN)
    schedule('enter-prep1', restingTime)
  }, [getNextPosition, lifecycleIsActive, schedule])
  startCycleRef.current = startCycle

  transitionRef.current = (transition) => {
    switch (transition) {
      case 'enter-prep1':
        viewDispatch({ type: 'SET_PHASE', phase: DaemonState.PREP1 })
        schedule('enter-prep2', BATTLE_TIMINGS.PREP1)
        return
      case 'enter-prep2':
        viewDispatch({ type: 'SET_PHASE', phase: DaemonState.PREP2 })
        schedule('teleport', BATTLE_TIMINGS.PREP2)
        return
      case 'teleport': {
        const { willAttack, nextPosition } = cycleRef.current
        if (!willAttack) {
          blockArmedRef.current = false
          viewDispatch({ type: 'LAND', position: nextPosition })
          schedule('finish-landed', BATTLE_TIMINGS.LANDED)
          return
        }

        const blocked = blockArmedRef.current
        blockArmedRef.current = false
        attackWasBlockedRef.current = blocked
        blockActiveRef.current = blocked
        viewDispatch({
          type: 'START_ATTACK',
          position: nextPosition,
          direction: Math.random() < 0.5 ? 'left' : 'right',
          blockActive: blocked,
        })
        triggerShake()
        schedule('finish-attack', BATTLE_TIMINGS.ATTACK)
        return
      }
      case 'finish-attack': {
        const playerDied = applyDaemonAttackRef.current()
        viewDispatch({ type: 'LAND' })
        if (playerDied) {
          schedule('navigate-player-death', BATTLE_TIMINGS.ATTACK)
        } else if (blockActiveRef.current) {
          schedule(
            'hide-block-shield',
            BATTLE_TIMINGS.BLOCK_SHIELD_VISUAL_DURATION - BATTLE_TIMINGS.ATTACK
          )
        } else {
          schedule('finish-landed', BATTLE_TIMINGS.LANDED)
        }
        return
      }
      case 'hide-block-shield':
        blockActiveRef.current = false
        viewDispatch({ type: 'SET_BLOCK_ACTIVE', active: false })
        schedule(
          'finish-landed',
          BATTLE_TIMINGS.LANDED -
            (BATTLE_TIMINGS.BLOCK_SHIELD_VISUAL_DURATION - BATTLE_TIMINGS.ATTACK)
        )
        return
      case 'finish-landed':
        viewDispatch({ type: 'START_CROSSFADE' })
        schedule('finish-crossfade', BATTLE_TIMINGS.TRANSITION_TO_RESTING)
        return
      case 'finish-crossfade':
        viewDispatch({ type: 'END_CROSSFADE' })
        runningRef.current = false
        startCycleRef.current()
        return
      case 'navigate-player-death':
        router.replace('/sub-games/jaunt-cave/screen4' as any)
        return
      case 'navigate-daemon-death':
        router.replace('/sub-games/jaunt-cave/screen3')
    }
  }

  const resumeBattle = useCallback(() => {
    if (!lifecycleIsActive() || runningRef.current) return
    if (terminalRef.current === 'player-dead') {
      schedule('navigate-player-death', BATTLE_TIMINGS.ATTACK)
    } else if (terminalRef.current === 'daemon-dead') {
      schedule('navigate-daemon-death', BATTLE_TIMINGS.DAEMON_DEATH_NAVIGATION_DELAY)
    } else {
      viewDispatch({ type: 'RESET_CYCLE' })
      startCycleRef.current()
    }
  }, [lifecycleIsActive, schedule])

  const applyPlayerDamage = useCallback(
    (damage: number) => {
      if (terminalRef.current !== 'none' || !lifecycleIsActive()) return

      const newHP = Math.max(0, daemonHPRef.current - damage)
      daemonHPRef.current = newHP
      viewDispatch({ type: 'DAMAGE_DAEMON', hp: newHP })

      if (newHP > 0) return

      terminalRef.current = 'daemon-dead'
      runningRef.current = false
      clearScheduledTransition()
      schedule('navigate-daemon-death', BATTLE_TIMINGS.DAEMON_DEATH_NAVIGATION_DELAY)
    },
    [clearScheduledTransition, lifecycleIsActive, schedule]
  )

  const activateBlock = useCallback((): 'success' | 'too_early' | 'too_late' => {
    if (view.daemonState === DaemonState.PREP2 && terminalRef.current === 'none') {
      blockArmedRef.current = true
      return 'success'
    }
    if (view.daemonState === DaemonState.RESTING || view.daemonState === DaemonState.PREP1) {
      return 'too_early'
    }
    return 'too_late'
  }, [view.daemonState])

  const handleDaemonTap = useCallback(() => {
    if (view.daemonState === DaemonState.LANDED) onDaemonHit?.()
    else onDaemonMiss?.()
  }, [onDaemonHit, onDaemonMiss, view.daemonState])

  useEffect(() => {
    currentHPRef.current = currentPlayerHP
  }, [currentPlayerHP])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopForLifecycleChange()
    }
  }, [stopForLifecycleChange])

  useEffect(() => {
    focusedRef.current = isFocused
    if (!isFocused) stopForLifecycleChange()
    else resumeBattle()
  }, [isFocused, resumeBattle, stopForLifecycleChange])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = appStateRef.current === 'active'
      appStateRef.current = nextState
      if (wasActive && nextState !== 'active') stopForLifecycleChange()
      else if (!wasActive && nextState === 'active') resumeBattle()
    })
    return () => subscription.remove()
  }, [resumeBattle, stopForLifecycleChange])

  return {
    daemonState: view.daemonState,
    currentPosition: view.currentPosition,
    attackDirection: view.attackDirection,
    previousState: view.previousState,
    isCrossfading: view.isCrossfading,
    daemonHP: view.daemonHP,
    handleDaemonTap,
    isVulnerable: view.daemonState === DaemonState.LANDED,
    isAttacking: view.daemonState === DaemonState.ATTACKING,
    applyPlayerDamage,
    isBlockActive: view.isBlockActive,
    activateBlock,
  }
}

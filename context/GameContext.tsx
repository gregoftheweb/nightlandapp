// /context/GameContext.tsx
import React, {
  createContext,
  useContext,
  ReactNode,
  useReducer,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { deserializeGameState, createInitialGameState } from '../modules/gameState'
import { reducer } from '../state/reducer'
import { GameState } from '../config/types'
import {
  requestAutoSave,
  hasSaveRelevantChanges,
  invalidateAutoSaveAndDeleteCurrentGame,
} from '../modules/autoSave'

export type GameAction = Parameters<typeof reducer>[1]
export type GameDispatch = React.Dispatch<GameAction>

interface GameActionsContextType {
  dispatch: GameDispatch
  hydrateGameState: (state: GameState) => Promise<void>
  setOverlay: (overlay: any) => void
  signalRpgResume: () => void
}

const GameStateContext = createContext<GameState | undefined>(undefined)
const GameActionsContext = createContext<GameActionsContextType | undefined>(undefined)
const RpgResumeContext = createContext<number | undefined>(undefined)

interface GameProviderProps {
  children: ReactNode
  initialGameState?: string
}

export const GameProvider = ({ children, initialGameState }: GameProviderProps) => {
  const initialState = useMemo(
    () => (initialGameState ? deserializeGameState(initialGameState) : createInitialGameState()),
    [initialGameState]
  )

  const [state, dispatch] = useReducer(reducer, initialState)
  const [rpgResumeNonce, setRpgResumeNonce] = useState(0)

  // Retain the last state submitted to autosave for constant-time comparison
  // of the specific fields that historically made up the save fingerprint.
  const lastAutoSaveStateRef = useRef<GameState | null>(null)

  // Track if game over save deletion has been triggered to avoid multiple calls
  const gameOverDeleteTriggeredRef = useRef<boolean>(false)
  const committedStateRef = useRef(state)
  const pendingHydrationRef = useRef<{
    state: GameState
    resolve: () => void
    reject: (error: Error) => void
  } | null>(null)
  committedStateRef.current = state

  const hydrateGameState = useCallback((nextState: GameState): Promise<void> => {
    if (committedStateRef.current === nextState) return Promise.resolve()

    if (pendingHydrationRef.current) {
      return Promise.reject(new Error('A game-state hydration is already in progress'))
    }

    return new Promise<void>((resolve, reject) => {
      pendingHydrationRef.current = { state: nextState, resolve, reject }
      dispatch({ type: 'HYDRATE_GAME_STATE', payload: { state: nextState } })
    })
  }, [])

  // Resolve only after React has committed the exact state supplied to the
  // reducer. Callers can then navigate without relying on an arbitrary delay.
  useLayoutEffect(() => {
    const pending = pendingHydrationRef.current
    if (pending?.state === state) {
      pendingHydrationRef.current = null
      pending.resolve()
    }
  }, [state])

  useEffect(
    () => () => {
      pendingHydrationRef.current?.reject(
        new Error('GameProvider unmounted before hydration committed')
      )
      pendingHydrationRef.current = null
    },
    []
  )

  const setOverlay = useCallback((overlay: any) => console.log('Overlay:', overlay), [])

  const signalRpgResume = useCallback(() => {
    setRpgResumeNonce((prev) => {
      const next = prev + 1
      if (__DEV__) {
        console.log('[GameContext] RPG resume signaled, nonce:', next)
      }
      return next
    })
  }, [])

  const actions = useMemo(
    () => ({ dispatch, hydrateGameState, setOverlay, signalRpgResume }),
    [dispatch, hydrateGameState, setOverlay, signalRpgResume]
  )

  // Autosave effect - triggers save when important state changes
  useEffect(() => {
    if (hasSaveRelevantChanges(lastAutoSaveStateRef.current, state)) {
      lastAutoSaveStateRef.current = state

      // Request autosave (throttled)
      requestAutoSave(state)
    }
  }, [state])

  // Game over effect - deletes current save when player dies
  useEffect(() => {
    if (state.gameOver && !gameOverDeleteTriggeredRef.current) {
      gameOverDeleteTriggeredRef.current = true
      invalidateAutoSaveAndDeleteCurrentGame().catch((err) => {
        console.error('Failed to delete current save on death:', err)
        // Reset flag on error to allow retry if needed
        gameOverDeleteTriggeredRef.current = false
      })
    }

    // Reset the flag when game is reset (gameOver becomes false)
    if (!state.gameOver && gameOverDeleteTriggeredRef.current) {
      gameOverDeleteTriggeredRef.current = false
    }
  }, [state.gameOver])

  return (
    <GameActionsContext.Provider value={actions}>
      <RpgResumeContext.Provider value={rpgResumeNonce}>
        <GameStateContext.Provider value={state}>{children}</GameStateContext.Provider>
      </RpgResumeContext.Provider>
    </GameActionsContext.Provider>
  )
}

export const useGameState = () => {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('useGameState must be used within a GameProvider')
  return state
}

export const useGameActions = () => {
  const actions = useContext(GameActionsContext)
  if (!actions) throw new Error('useGameActions must be used within a GameProvider')
  return actions
}

export const useRpgResumeNonce = () => {
  const nonce = useContext(RpgResumeContext)
  if (nonce === undefined) {
    throw new Error('useRpgResumeNonce must be used within a GameProvider')
  }
  return nonce
}

export const useGameContext = () => {
  const state = useGameState()
  const actions = useGameActions()
  const rpgResumeNonce = useRpgResumeNonce()
  return { state, ...actions, rpgResumeNonce }
}

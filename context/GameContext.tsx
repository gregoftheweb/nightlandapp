// /context/GameContext.tsx
import React, {
  createContext,
  useContext,
  ReactNode,
  useReducer,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { deserializeGameState, createInitialGameState } from '../modules/gameState'
import { reducer } from '../state/reducer'
import { GameState } from '../config/types'
import {
  requestAutoSave,
  getStateSaveFingerprint,
  invalidateAutoSaveAndDeleteCurrentGame,
} from '../modules/autoSave'

export type GameAction = Parameters<typeof reducer>[1]
export type GameDispatch = React.Dispatch<GameAction>

interface GameActionsContextType {
  dispatch: GameDispatch
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

  // Autosave controller - tracks state fingerprint to trigger saves
  const lastSaveFingerprintRef = useRef<string>('')

  // Track if game over save deletion has been triggered to avoid multiple calls
  const gameOverDeleteTriggeredRef = useRef<boolean>(false)

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
    () => ({ dispatch, setOverlay, signalRpgResume }),
    [dispatch, setOverlay, signalRpgResume]
  )

  // Autosave effect - triggers save when important state changes
  useEffect(() => {
    const currentFingerprint = getStateSaveFingerprint(state)

    // Only trigger autosave if fingerprint changed
    if (currentFingerprint !== lastSaveFingerprintRef.current) {
      lastSaveFingerprintRef.current = currentFingerprint

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

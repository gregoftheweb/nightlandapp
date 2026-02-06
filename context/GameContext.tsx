// /context/GameContext.tsx
import React, {
  createContext,
  useContext,
  ReactNode,
  useReducer,
  useState,
  useEffect,
  useRef,
} from 'react'
import { deserializeGameState, createInitialGameState } from '../modules/gameState'
import { reducer } from '../state/reducer'
import { GameState } from '../config/types'
import { requestAutoSave, getStateSaveFingerprint } from '../modules/autoSave'
import { deleteCurrentGame } from '../modules/saveGame'

type GameAction = Parameters<typeof reducer>[1]
type GameDispatch = React.Dispatch<GameAction>

interface GameContextType {
  state: GameState
  dispatch: GameDispatch
  setOverlay: (overlay: any) => void
  rpgResumeNonce: number
  signalRpgResume: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

interface GameProviderProps {
  children: ReactNode
  initialGameState?: string
}

export const GameProvider = ({ children, initialGameState }: GameProviderProps) => {
  const initialState = initialGameState
    ? deserializeGameState(initialGameState)
    : createInitialGameState()

  const [state, dispatch] = useReducer(reducer, initialState)
  const [rpgResumeNonce, setRpgResumeNonce] = useState(0)

  // Autosave controller - tracks state fingerprint to trigger saves
  const lastSaveFingerprintRef = useRef<string>('')
  
  // Track if game over save deletion has been triggered to avoid multiple calls
  const gameOverDeleteTriggeredRef = useRef<boolean>(false)

  const setOverlay = (overlay: any) => console.log('Overlay:', overlay)

  const signalRpgResume = () => {
    setRpgResumeNonce((prev) => {
      const next = prev + 1
      if (__DEV__) {
        console.log('[GameContext] RPG resume signaled, nonce:', next)
      }
      return next
    })
  }

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
      deleteCurrentGame().catch((err) => {
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
    <GameContext.Provider value={{ state, dispatch, setOverlay, rpgResumeNonce, signalRpgResume }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGameContext = () => {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGameContext must be used within a GameProvider')
  return context
}

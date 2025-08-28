// /context/GameContext.tsx
import React, { createContext, useContext, ReactNode, useReducer } from "react";
import { deserializeGameState, createInitialGameState, GameState } from "../config/gameState";
import { reducer as gameReducer } from "../modules/gameState";

interface GameContextType {
  state: GameState;
  dispatch: (action: any) => void;
  showDialog: (message: string, duration?: number) => void;
  setOverlay: (overlay: any) => void;
  setDeathMessage: (message: string) => void;
  initialGameState?: string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
  initialGameState?: string;
}

export const GameProvider = ({ children, initialGameState }: GameProviderProps) => {
 
  const initialState = initialGameState 
    ? deserializeGameState(initialGameState) 
    : createInitialGameState();
 
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const showDialog = (message: string, duration?: number) =>
    console.log("Dialog:", message, duration);
  const setOverlay = (overlay: any) => console.log("Overlay:", overlay);
  const setDeathMessage = (message: string) => console.log("Death:", message);

  return (
    <GameContext.Provider value={{ state, dispatch, showDialog, setOverlay, setDeathMessage, initialGameState }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameContext must be used within a GameProvider");
  return context;
};
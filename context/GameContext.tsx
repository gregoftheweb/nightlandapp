// /context/GameContext.tsx
import React, { createContext, useContext, ReactNode, useReducer } from "react";
import {
  deserializeGameState,
  createInitialGameState,
} from "../modules/gameState";
import { reducer } from "../modules/reducers";
import { GameState } from "../config/types";

interface GameContextType {
  state: GameState;
  dispatch: (action: any) => void;
  setOverlay: (overlay: any) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
  initialGameState?: string;
}

export const GameProvider = ({
  children,
  initialGameState,
}: GameProviderProps) => {
  const initialState = initialGameState
    ? deserializeGameState(initialGameState)
    : createInitialGameState();

  const [state, dispatch] = useReducer(reducer, initialState);

  const setOverlay = (overlay: any) => console.log("Overlay:", overlay);

  return (
    <GameContext.Provider value={{ state, dispatch, setOverlay }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context)
    throw new Error("useGameContext must be used within a GameProvider");
  return context;
};
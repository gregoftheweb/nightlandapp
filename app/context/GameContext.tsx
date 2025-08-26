// app/context/GameContext.tsx
import React, { createContext, useContext, ReactNode, useState } from "react";

interface GameContextType {
  dispatch: (action: any) => void;
  showDialog: (message: string, duration?: number) => void;
  setOverlay: (overlay: any) => void;
  setDeathMessage: (message: string) => void;
  initialGameState?: string; // Optional field in context
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Define props interface for GameProvider
interface GameProviderProps {
  children: ReactNode;
  initialGameState?: string; // Match the prop being passed
}

export const GameProvider = ({ children, initialGameState }: GameProviderProps) => {
  const [gameState, setGameState] = useState(initialGameState);

  const dispatch = (action: any) => {
    console.log("Dispatch:", action); // Replace with actual state management logic
  };
  const showDialog = (message: string, duration?: number) =>
    console.log("Dialog:", message, duration); // Replace with dialog component
  const setOverlay = (overlay: any) => console.log("Overlay:", overlay); // Replace with overlay component
  const setDeathMessage = (message: string) => console.log("Death:", message); // Replace with death message handling

  return (
    <GameContext.Provider value={{ dispatch, showDialog, setOverlay, setDeathMessage, initialGameState: gameState }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameContext must be used within a GameProvider");
  return context;
};
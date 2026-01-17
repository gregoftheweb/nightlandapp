// app/sub-games/_shared/types.ts
// Shared TypeScript types for sub-games

/**
 * Generic sub-game save data structure
 */
export interface SubGameSaveData<T = any> {
  version: number;
  timestamp: number;
  data: T;
}

/**
 * Result returned when a sub-game is exited
 */
export interface SubGameExitResult {
  completed: boolean;
  data?: any;
}

// app/sub-games/aerowreckage-puzzle/types.ts
// TypeScript types for the Dead Dial puzzle

/**
 * Direction for dial rotation
 */
export type DialDirection = 'L' | 'R';

/**
 * A single step in the safe code sequence
 */
export interface DialStep {
  direction: DialDirection;
  target: number;
  dwellMs: number;
}

/**
 * The complete puzzle state (persisted)
 */
export interface PuzzleState {
  currentStepIndex: number;
  currentAngle: number;
  currentNumber: number;
  lastRotationDirection: DialDirection | null;
  stepHistory: number[];
  isOpened: boolean;
  dwellStartTime: number | null;
}

/**
 * Configuration for the dial puzzle
 */
export interface PuzzleConfig {
  totalNumbers: number;
  codeSteps: DialStep[];
  tolerance: number;
  tickStepSize: number;
}

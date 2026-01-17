// app/sub-games/aerowreckage-puzzle/config.ts
// Configuration for the Dead Dial safe-cracking puzzle

import { PuzzleConfig } from './types';

/**
 * Dead Dial puzzle configuration
 * Code sequence: CCW-28, CW-15, CCW-7
 */
export const PUZZLE_CONFIG: PuzzleConfig = {
  totalNumbers: 40,
  codeSteps: [
    { direction: 'CCW', target: 28, dwellMs: 400 },
    { direction: 'CW', target: 15, dwellMs: 400 },
    { direction: 'CCW', target: 7, dwellMs: 400 },
  ],
  tolerance: 0.5, // Must be within 0.5 numbers of target
  tickStepSize: 1, // Haptic tick every 1 number
};

/**
 * Storage key for this puzzle's save data
 */
export const SAVE_KEY = 'aerowreckage-puzzle';

/**
 * Initial puzzle state
 */
export const INITIAL_STATE = {
  currentStepIndex: 0,
  currentAngle: 0,
  currentNumber: 0,
  lastRotationDirection: null,
  stepHistory: [],
  isOpened: false,
  dwellStartTime: null,
};

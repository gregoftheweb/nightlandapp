// constants/Game.ts - Game-specific constants
// Extracted from various game modules for better maintainability

/**
 * UI and Layout Constants
 */
export const UI_CONSTANTS = {
  /** Height of the HUD at the bottom of the screen in pixels */
  HUD_HEIGHT: 60,

  /** Minimum distance in cells for a tap to register as a movement direction */
  MIN_MOVE_DISTANCE: 1,
} as const

/**
 * Game Timing Constants
 */
export const TIMING_CONSTANTS = {
  /** Interval in milliseconds between continuous movement during long press */
  MOVEMENT_INTERVAL: 150,

  /** Delay in milliseconds before navigating to death screen after game over */
  GAME_OVER_DELAY: 7000,

  /** Minimum time in milliseconds between ranged attack button presses (throttle) */
  ZAP_BUTTON_THROTTLE: 300,
} as const

/**
 * Combat Constants
 */
export const COMBAT_CONSTANTS = {
  /** Maximum distance in cells for awakening a Great Power */
  GREAT_POWER_AWAKEN_DISTANCE: 3,

  /**
   * Default maximum number of monsters that can attack at once
   * Note: This is defined here for reference but the actual value is pulled from gameConfig.combat.maxAttackers in the game state
   */
  MAX_ATTACKERS: 4,
} as const

/**
 * Monster Spawning Constants
 */
export const SPAWN_CONSTANTS = {
  /** Number of initial monsters spawned at game start */
  INITIAL_ABHUMAN_SPAWNS: 2,

  /** Base distance from player for monster spawns */
  SPAWN_BASE_DISTANCE: 15,

  /** Additional random distance variation for monster spawns */
  SPAWN_RANDOM_DISTANCE: 10,
} as const

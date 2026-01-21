// config/gameConfig.ts
export const gameConfig = {
  // Grid/board configuration
  grid: {
    width: 400, // number of tiles horizontally
    height: 400, // number of tiles vertically
    tileSize: 32, // renamed from cellSize for consistency with gameState.ts
  },

  // Combat settings
  combat: {
    maxAttackers: 4, // maximum number of monsters attacking at once
  },

  // UI settings
  ui: {
    viewportSize: 20, // Size of the viewport in tiles (e.g., 20x20 visible area)
    viewHeight: 800, // matches old hardcoded value in gameState.ts
  },

  // Audio settings
  audio: {
    backgroundMusicEnabled: true,
    soundEffectsEnabled: true,
    masterVolume: 0.7, // 0.0 to 1.0
    backgroundVolume: 0.5, // 0.0 to 1.0
    sfxVolume: 0.8, // 0.0 to 1.0
  },

  // Save metadata
  save: {
    version: '1.0.0', // version number pulled into config
  },
}

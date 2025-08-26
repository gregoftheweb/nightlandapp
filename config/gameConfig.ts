// config/gameConfig.ts
export interface GameConfig {
  sound: {
    ambientBackgroundEnabled: boolean;
    ambientBackgroundFile: any;
  };
  grid: {
    width: number;
    height: number;
  };
  combat: {
    maxAttackers: number;
    turnTimeLimit?: number;
  };
  ui: {
    viewportSize: number;
    showGrid: boolean;
  };
}

export const gameConfig: GameConfig = {
  sound: {
    ambientBackgroundEnabled: false,
    ambientBackgroundFile: require("../assets/sounds/ambient-background.wav"),
  },
  grid: {
    width: 400,
    height: 400,
  },
  combat: {
    maxAttackers: 4,
    turnTimeLimit: 30000, // 30 seconds per turn
  },
  ui: {
    viewportSize: 10,
    showGrid: true,
  },
};

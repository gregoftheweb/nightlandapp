export const COMBAT_STRINGS = {
  start: {
    player: "Combat begins!",
    enemy: "Ready to fight!",
  },
  victory: {
    player: "You vanquished him!",
    enemy: "He's dead!",
  },
  death: {
    player: (monsterName: string) => `The vile ${monsterName} has killed you!`,
    enemy: "He overwhelmed you!",
  },
  hit: {
    player: "You hit for 6 points!",
    enemy: "He hit you for 4 points!",
  },
  miss: {
    player: "You missed him!",
    enemy: "He missed you!",
  },
  soulSuckDeath: {
    player: (greatPowerName: string) =>  `The ${greatPowerName} has eaten your eternal soul! Your existence is ended and all you will be is nothingness, not even sorrow remains.`,
    enemy: (greatPowerName: string) =>  `Miraculously, Christos vanquished the Great Power ${greatPowerName}, praise be to the dead sun.`,
  },
} as const;

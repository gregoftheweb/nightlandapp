export const gameState = {
    player: {
      name: "Christos",
      shortName: "christos",
      hp: 100,
      maxHP: 100,
      position: { row: 9, col: 5 }, // Bottom-middle of 10x10 grid
      description: "One of the humans from the Last Redoubt.",
      initiative: 10,
      lastComment: "",
      attack: 4, // fists
      ac: 14, // Base AC: 10 (unarmored) + 4 (light armor or natural toughness)
      inventory: [],
      maxInventorySize: 10,
      weapons: [
        {
          id: "weapon-discos-001",
          equipped: true,
        },
      ],
      maxWeaponsSize: 2,
      isHidden: false,
      hideTurns: 0,
      soulKey: "7C6368627E64",
    },
    currentLevel: 1,
    gameBoardSize: { rows: 10, cols: 10 },
  };
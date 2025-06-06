// modules/level1State.ts
export const level1State = {
    id: 1,
    name: "The Outer Wastes",
    description:
      "A barren plain beyond the Last Redoubt, haunted by whispers and unseen eyes.",
    monsters: [
      {
        name: "Abhuman",
        shortName: "abhuman",
        hp: 20,
        position: { row: 0, col: 0 },
        description:
          "Abhuman. Created from corrupted human stock forgotten eons ago. Their hatred of humans is bone deep and drives them to kill.",
        active: false,
        type: "regular",
        initiative: 5,
        maxInstances: 6,
        moveRate: 2,
        spawnRate: 38,
        spawnChance: 0.2,
        attack: 5,
        ac: 12,
        soulKey: "686365627E64",
      },
      {
        name: "Night Hound",
        shortName: "nighthound",
        hp: 20,
        position: { row: 0, col: 0 },
        description:
          "Night Hound. Voracious hunters of the Night Land. They savor the taste of human flesh.",
        active: false,
        type: "regular",
        initiative: 5,
        maxInstances: 3,
        moveRate: 2,
        spawnRate: 38,
        spawnChance: 0.2,
        attack: 8,
        ac: 13,
        soulKey: "646369627E64",
      },
    ],
    greatPowers: [
      {
        name: "Watcher of the Southeast",
        shortName: "watcherse",
        hp: 200,
        position: { row: 350, col: 198 },
        size: { width: 4, height: 4 },
        description:
          "One of the great powers and a source of great evil. It watches the Last Redoubt, silent, for Aeons.",
        active: true,
        type: "greatPower",
        initiative: 5,
        maxInstances: 1,
        moveRate: 0,
        spawnRate: 0,
        spawnChance: 0,
        attack: 5,
      },
    ],
    objects: [
      {
        name: "The Last Redoubt",
        shortName: "redoubt",
        position: { row: 395, col: 198 },
        size: { width: 4, height: 4 },
        description:
          "The last haven of mankind save one. It protects millions of souls from the horrors of the Nightland.",
        active: true,
        type: "object",
        maxInstances: 1,
      },
      {
        name: "River of Shadows",
        shortName: "river",
        position: { row: 330, col: 175 },
        size: { width: 20, height: 20 },
        description:
          "A vast, dark river snakes through the Outer Wastes, its shimmering waters whispering of ancient secrets.",
        active: true,
        type: "object",
        maxInstances: 1,
        effects: [
          {
            type: "hide",
            duration: 10,
          },
        ],
        collisionMask: [
          { row: 1, col: 0, width: 1, height: 1 },
          { row: 2, col: 0, width: 2, height: 1 },
          { row: 3, col: 1, width: 3, height: 2 },
          { row: 2, col: 4, width: 4, height: 2 },
          { row: 3, col: 8, width: 1, height: 2 },
          { row: 3, col: 9, width: 1, height: 3 },
          { row: 5, col: 10, width: 2, height: 2 },
          { row: 6, col: 12, width: 2, height: 3 },
          { row: 9, col: 13, width: 2, height: 1 },
          { row: 10, col: 14, width: 4, height: 1 },
          { row: 11, col: 17, width: 2, height: 1 },
          { row: 12, col: 17, width: 2, height: 3 },
          { row: 15, col: 18, width: 2, height: 5 },
        ],
      },
      {
        name: "Cursed Totem",
        shortName: "cursedTotem",
        position: { row: 340, col: 60 },
        size: { width: 4, height: 4 },
        description:
          "A twisted relic that calls forth the horrors of the Night Land.",
        active: true,
        lastTrigger: 0,
        type: "object",
        maxInstances: 1,
        effects: [
          {
            type: "swarm",
            monsterType: "Abhuman",
            count: 6,
            range: 18,
          },
        ],
      },
      {
        name: "Petrified Willow",
        shortName: "petWillow",
        position: { row: 385, col: 195 },
        size: { width: 4, height: 4 },
        description:
          "Old woman willow is last tree in the Night Land, now a petrified husk, but it's drooping branches offer sancuary. It was once a great power, now merely a pocket of hope.",
        active: true,
        type: "object",
        maxInstances: 1,
        effects: [
          {
            type: "hide",
            duration: 10,
          },
        ],
      },
    ],
    items: [
      {
        name: "Maguffin Rock",
        shortName: "maguffinRock",
        position: { row: 388, col: 200 },
        description: "A peculiar stone that hums with an unknown energy.",
        active: true,
        type: "item",
        collectible: true,
        splash: {
          image: require("../assets/sadprincess.png"),
          text: "sweet sweet sweet",
        },
      },
      {
        name: "Short Sword",
        shortName: "shortsword",
        position: { row: 387, col: 202 },
        description:
          "A simple blade forged in the Last Redoubt, sharp and reliable against the lesser horrors.",
        active: true,
        type: "weapon",
        damage: 10,
        collectible: true,
        weaponId: "weapon-shortsword-002",
        size: { width: 1, height: 1 },
      },
    ],
    pools: [
      {
        id: 1,
        position: { row: 380, col: 5 },
      },
    ],
    poolsTemplate: {
      name: "Pool of Peace",
      shortName: "poolOfPeace",
      size: { width: 4, height: 4 },
      description: "A tranquil pool that restores vitality.",
      active: true,
      type: "object",
      maxInstances: 5,
      effects: [
        {
          type: "heal",
          amount: 20,
        },
        {
          type: "hide",
          duration: 10,
        },
      ],
    },
    footsteps: [
      { id: 1, position: { row: 393, col: 195 }, direction: 250 },
      { id: 2, position: { row: 393, col: 179 }, direction: 250 },
      { id: 3, position: { row: 381, col: 120 }, direction: 250 },
      { id: 35, position: { row: 381, col: 40 }, direction: 250 },
      { id: 4, position: { row: 373, col: 5 }, direction: 310 },
      { id: 5, position: { row: 350, col: 10 }, direction: 0 },
      { id: 6, position: { row: 330, col: 37 }, direction: 40 },
      { id: 65, position: { row: 330, col: 60 }, direction: 50 },
      { id: 7, position: { row: 330, col: 90 }, direction: 50 },
      { id: 75, position: { row: 325, col: 150 }, direction: 50 },
      { id: 8, position: { row: 315, col: 222 }, direction: 50 },
      { id: 9, position: { row: 285, col: 266 }, direction: 50 },
      { id: 10, position: { row: 265, col: 333 }, direction: 30 },
      { id: 11, position: { row: 250, col: 390 }, direction: 310 },
      { id: 12, position: { row: 245, col: 333 }, direction: 250 },
      { id: 13, position: { row: 230, col: 266 }, direction: 270 },
      { id: 14, position: { row: 230, col: 222 }, direction: 270 },
      { id: 15, position: { row: 200, col: 90 }, direction: 270 },
      { id: 16, position: { row: 175, col: 10 }, direction: 310 },
      { id: 17, position: { row: 150, col: 10 }, direction: 0 },
      { id: 18, position: { row: 125, col: 37 }, direction: 40 },
      { id: 19, position: { row: 110, col: 90 }, direction: 50 },
      { id: 20, position: { row: 110, col: 222 }, direction: 50 },
      { id: 21, position: { row: 90, col: 266 }, direction: 50 },
      { id: 22, position: { row: 70, col: 333 }, direction: 30 },
      { id: 23, position: { row: 50, col: 390 }, direction: 310 },
      { id: 24, position: { row: 30, col: 333 }, direction: 250 },
      { id: 26, position: { row: 10, col: 215 }, direction: 310 },
    ],
    footstepsTemplate: {
      name: "Footsteps of Persius",
      shortName: "footstepsPersius",
      size: { width: 2, height: 2 },
      description:
        "You discover the faint tracks of your friend Persius in the dry dust of the Nightland. Your hope is forlorn, but meager as it is, there is some left that he might live..",
      active: true,
      type: "object",
      maxInstances: 100,
    },
  };
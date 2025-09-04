//config/levels.ts
import {
  Level,
  Position,
  LevelObjectInstance,
  LevelMonsterInstance,
  GreatPower,
} from "./types";
import { buildings, weapons } from "./objects";
import { monsters } from "./monsters";
import { poolTemplates } from "./poolTemplates";

// Import images (consolidate from level1State.ts)
import redoubtIMG from "@assets/images/redoubt.png";
import riverIMG from "@assets/images/river1.png";
import cursedTotemIMG from "@assets/images/cursedtotem.png";
import petrifiedWillowIMG from "@assets/images/petrifiedWillow.png";
import maguffinRockIMG from "@assets/images/maguffinRock.png";
import shortSwordIMG from "@assets/images/shortSword.png";
import potionIMG from "@assets/images/potion.png";
import sanctuaryPoolImg from "@assets/images/poolofpeace.png";
import poisonPoolImg from "@assets/images/poolofpeace.png";
import abhumanIMG from "@assets/images/abhuman.png";
import night_houndIMG from "@assets/images/nighthound4.png";
import watcher_seIMG from "@assets/images/watcherse.png";

// Helper function to create object instances from templates
const createObjectInstance = (
  objectId: number,
  position: Position,
  overrides: Partial<LevelObjectInstance> = {}
): LevelObjectInstance => {
  const template = buildings[objectId];
  if (!template) {
    throw new Error(`Object template ${objectId} not found`);
  }

  return {
    id: `${template.shortName}_${position.row}_${position.col}`,
    templateId: objectId,
    position,
    active: true,
    shortName: template.shortName,
    category: template.category,
    name: template.name,
    description: template.description,
    image: template.image,
    size: template.size || {
      width: template.width || 1,
      height: template.height || 1,
    },
    ...overrides,
  };
};

// Helper function to create monster instances from templates
const createMonsterInstance = (
  monsterShortName: string,
  position: Position,
  overrides: Partial<LevelMonsterInstance> = {}
): LevelMonsterInstance => {
  const template = monsters.find((m) => m.shortName === monsterShortName);
  if (!template) {
    throw new Error(`Monster template ${monsterShortName} not found`);
  }

  return {
    id: `${monsterShortName}_${position.row}_${position.col}`,
    templateId: monsterShortName,
    position,
    active: true,
    currentHP: template.hp ?? 10,
    hp: template.hp ?? 10,
    maxHP: template.maxHP ?? template.hp ?? 10,
    shortName: template.shortName,
    category: template.category,
    name: template.name,
    description: template.description,
    image: template.image,
    attack: template.attack ?? 0,
    ac: template.ac ?? 0,
    moveRate: template.moveRate ?? 1,
    soulKey: template.soulKey ?? "000000",
    initiative: template.initiative ?? 0,
    spawnRate: template.spawnRate,
    spawnChance: template.spawnChance,
    maxInstances: template.maxInstances,
    spawned: false,
    ...overrides,
  };
};

// Helper function to create GreatPower instances
const createGreatPower = (
  template: Partial<GreatPower>,
  position: Position,
  overrides: Partial<GreatPower> = {}
): GreatPower => {
  return {
    shortName: template.shortName || "unknown",
    name: template.name || "Unnamed Power",
    category: template.category || "greatPower",
    image: template.image,
    position,
    size: template.size || { width: 1, height: 1 },
    active: template.active ?? true,
    hp: template.hp ?? 100,
    maxHP: template.maxHP ?? 100,
    attack: template.attack ?? 0,
    ac: template.ac ?? 0,
    moveRate: template.moveRate ?? 1,
    soulKey: template.soulKey || "000000",
    awakened: template.awakened ?? false,
    awakenCondition: template.awakenCondition || "player_within_range",
    awakenRange: template.awakenRange ?? 0,
    ...overrides,
  };
};

export const levels: Record<string, Level> = {
  "1": {
    id: "1",
    name: "The Outer Wastes",
    description: "Your first venture into the eternal darkness surrounding the Last Redoubt.",
    boardSize: { width: 400, height: 400 },
    playerSpawn: { row: 395, col: 200 },
    ambientLight: 0.2,
    weatherEffect: null,
    backgroundMusic: "nightland_ambient",
    items: [
      {
        shortName: "healthPotion",
        category: "consumable",
        name: "Health Potion",
        image: potionIMG,
        position: { row: 375, col: 195 },
        size: { width: 1, height: 1 },
        active: true,
        type: "consumable",
        collectible: true,
        healAmount: 25,
      },
      {
        shortName: "ironSword",
        category: "weapon",
        name: "Iron Sword",
        image: shortSwordIMG, // Updated from level1State.ts
        position: { row: 380, col: 200 },
        size: { width: 1, height: 1 },
        active: true,
        type: "weapon",
        collectible: true,
        weaponId: "ironSword",
        damage: 8,
        hitBonus: 1,
      },
    ],
    monsters: [
      createMonsterInstance("abhuman", { row: 385, col: 205 }, { image: abhumanIMG }), // Added image
      createMonsterInstance("abhuman", { row: 150, col: 200 }, { image: abhumanIMG }), // Added image
      createMonsterInstance("night_hound", { row: 200, col: 300 }, { 
        currentHP: 25,
        image: night_houndIMG, // Added image
      }),
    ],
    objects: [
      createObjectInstance(100, { row: 396, col: 198 }, { image: redoubtIMG }), // Updated image
    ],
    pools: [
      {
        shortName: "heal_pool",
        name: "Sanctuary Pool",
        position: { row: 200, col: 200 },
        image: sanctuaryPoolImg, // Updated from level1State.ts
        usesRemaining: 3,
        effects: [{ name: "heal", type: "heal", magnitude: 50 }],
      },
      {
        shortName: "poison_pool",
        position: { row: 250, col: 250 },
        image: poisonPoolImg, // Updated from level1State.ts
        effects: [{ name: "poison", type: "damage", magnitude: 15, duration: 5000 }],
      },
    ],
    poolTemplates: poolTemplates,
    greatPowers: [
      createGreatPower(
        {
          shortName: "watcherse",
          name: "The Watcher of the South East",
          category: "GreatPower",
          image: watcher_seIMG, // Updated from level1State.ts
          hp: 1000,
          maxHP: 1000,
          attack: 50,
          ac: 25,
          moveRate: 0,
          soulKey: "str:25,dex:10,con:25,int:20,wis:20,cha:25",
          awakened: false,
          awakenCondition: "player_within_range",
          awakenRange: 10,
        },
        { row: 100, col: 350 }
      ),
    ],
    bossEncounter: {
      triggerId: "watcherse_awakened",
      name: "Confronting the Watcher",
      description: "Face the ancient guardian in combat.",
      type: "combat",
      boardSize: { width: 50, height: 50 },
      playerSpawn: { row: 45, col: 25 },
      objectives: [
        { type: "defeat_boss", target: "watcherse", description: "Defeat the Watcher" },
      ],
      rewards: [
        { type: "experience", value: 500 },
        { type: "item", itemId: "watcher_fragment" },
      ],
      timeLimit: 300000,
    },
    completionConditions: [
      {
        type: "reach_position",
        position: { row: 10, col: 200 },
        description: "Reach the northern border",
      },
      {
        type: "collect_item",
        itemId: "ironSword",
        description: "Find the iron sword",
      },
    ],
    footsteps: [
      {
        id: 1,
        position: { row: 395, col: 200 },
        direction: 0,
        templateId: "footstepsPersius",
      },
      // ... all other footsteps from level1State.ts ...
      {
        id: 26,
        position: { row: 10, col: 215 },
        direction: 310,
        templateId: "footstepsPersius",
      },
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
    spawnZones: [
      {
        id: "northern_wastes",
        area: {
          topLeft: { row: 0, col: 0 },
          bottomRight: { row: 100, col: 400 },
        },
        monsterTypes: ["abhuman", "night_hound"],
        spawnRate: 0.1,
        maxMonsters: 5,
        minPlayerDistance: 20,
      },
    ],
  },
  "2": {
    id: "2",
    name: "The Watching Grounds",
    description:
      "Venture deeper into the Nightland where ancient eyes follow your every move.",
    boardSize: { width: 600, height: 500 },
    playerSpawn: { row: 590, col: 50 },
    requiredLevel: 2,
    recommendedLevel: 3,
    experienceReward: 250,
    ambientLight: 0.15,
    weatherEffect: "mist",
    backgroundMusic: "watching_grounds",
    items: [     
    ],
    monsters: [
      createMonsterInstance("night_hound", { row: 200, col: 200 }),
      createMonsterInstance("night_hound", { row: 250, col: 300 }),
      createMonsterInstance("watcher_se", { row: 300, col: 400 }),
    ],
    objects: [],
    pools: [
      {
        shortName: "poison_pool", // References Poison Pool template
        position: { row: 150, col: 150 },
        image: "assets/pools/custom_poison_swamp.png", // Override image
      },
    ],
    poolTemplates: poolTemplates,
    greatPowers: [],
    bossEncounter: {
      triggerId: "level_completion",
      name: "The Night Hunt",
      description: "Survive waves of night creatures.",
      type: "survival",
      boardSize: { width: 30, height: 30 },
      playerSpawn: { row: 15, col: 15 },
      objectives: [
        {
          type: "survive_waves",
          waves: 3,
          description: "Survive 3 waves of enemies",
        },
      ],
      rewards: [
        { type: "experience", value: 750 },
        { type: "item", itemId: "night_cloak" },
      ],
      timeLimit: 600000,
    },
    completionConditions: [
      {
        type: "defeat_all_monsters",
        description: "Defeat all monsters in the area",
      },
      {
        type: "reach_position",
        position: { row: 50, col: 550 },
        description: "Reach the eastern exit",
      },
    ],
    footsteps: [],
    footstepsTemplate: {
      name: "defaultFootstep",
      shortName: "defaultFootstep",
      size: { width: 1, height: 1 },
      description: "Default footstep template",
      active: true,
      type: "trail",
      maxInstances: 150,
      decayTime: 90000,
    },
    spawnZones: [
      {
        id: "mist_valleys",
        area: {
          topLeft: { row: 100, col: 100 },
          bottomRight: { row: 400, col: 500 },
        },
        monsterTypes: ["night_hound"],
        spawnRate: 0.2,
        maxMonsters: 8,
        minPlayerDistance: 15,
      },
    ],
  },
};
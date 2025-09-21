//config/levels.ts
import {
  Level,
  Position,
  LevelObjectInstance,
  LevelMonsterInstance,
  GreatPower,
} from "./types";
import { buildings, weapons } from "./objects";
import { getMonsterTemplate, getGreatPowerTemplate } from "./monsters";
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

// Helper function to create monster spawn configs
const createMonsterSpawnConfig = (
  monsterShortName: string,
  position: Position,
  spawnOverrides?: {
    spawnRate?: number;
    spawnChance?: number;
    maxInstances?: number;
  }
): LevelMonsterInstance => {
  const template = getMonsterTemplate(monsterShortName);
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
    // Use spawn overrides or fall back to template defaults
    spawnRate: spawnOverrides?.spawnRate ?? template.spawnRate,
    spawnChance: spawnOverrides?.spawnChance ?? template.spawnChance,
    maxInstances: spawnOverrides?.maxInstances ?? template.maxInstances,
    spawned: false,
  };
};

// Helper function to create GreatPower instances for levels
const createGreatPowerForLevel = (
  shortName: string,
  position: Position,
  overrides: Partial<GreatPower> = {}
): GreatPower => {
  const template = getGreatPowerTemplate(shortName);
  if (!template) {
    throw new Error(`GreatPower template ${shortName} not found`);
  }

  return {
    ...template,
    id: `${shortName}_${position.row}_${position.col}`,
    position,
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
        image: shortSwordIMG,
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
    monsters: [], // No pre-placed monsters for this level, they spawn dynamically
    objects: [
      createObjectInstance(100, { row: 396, col: 198 }, { image: redoubtIMG }),
    ],
    pools: [
      {
        shortName: "heal_pool",
        id:"sanctuary_pool",
        name: "Sanctuary Pool",
        position: { row: 200, col: 200 },
        image: sanctuaryPoolImg,
        effects: [{ type: "heal", description: "config/poolTemplates.ts" }],
      },
      {
        shortName: "poison_pool",
        id:"poison_pool",
        position: { row: 250, col: 250 },
        image: poisonPoolImg,
        effects: [{ type: "poison", description:"poison pool" }],
      },
    ],
    poolTemplates: poolTemplates,
    greatPowers: [
      createGreatPowerForLevel("watcher_se", { row: 100, col: 350 }, {
        hp: 1000,
        maxHP: 1000,
        attack: 50,
        ac: 25,
      }),
    ],
    
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
      id: "footstepsPersius",
      size: { width: 2, height: 2 },
      description:
        "You discover the faint tracks of your friend Persius in the dry dust of the Nightland. Your hope is forlorn, but meager as it is, there is some left that he might live..",
      type: "object",
      maxInstances: 100,
      image: "aassets/images/footprints-blue.png"
    },
    spawnZones: [
      {
        id: "northern_wastes",
        area: {
          topLeft: { row: 0, col: 0 },
          bottomRight: { row: 100, col: 400 },
        },
        monsterTypes: ["abhuman", "night_hound"], // References monster shortNames
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
    items: [],
    monsters: [
      // Pre-placed monsters with custom spawn settings
      createMonsterSpawnConfig("night_hound", { row: 200, col: 200 }),
      createMonsterSpawnConfig("night_hound", { row: 250, col: 300 }),
    ],
    objects: [],
    pools: [
      {
        shortName: "poison_pool",
        id:"poison_pool", 
        position: { row: 150, col: 150 },
        image: "assets/pools/custom_poison_swamp.png", // Override image
      },
    ],
    poolTemplates: poolTemplates,
    greatPowers: [], // No great powers in this level
   
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
      id:"defaultFootstep",
      shortName: "defaultFootstep",
      size: { width: 1, height: 1 },
      description: "Default footstep template",
      image: "assets/images/footprints-blue.png",
      type: "trail",
      maxInstances: 150,
    },
    spawnZones: [
      {
        id: "mist_valleys",
        area: {
          topLeft: { row: 100, col: 100 },
          bottomRight: { row: 400, col: 500 },
        },
        monsterTypes: ["night_hound"], // References monster shortNames
        spawnRate: 0.2,
        maxMonsters: 8,
        minPlayerDistance: 15,
      },
    ],
  },
};
//config/levels.ts
import {
  Level,
  Position,
  LevelObjectInstance,
  LevelMonsterInstance,
  GreatPower,
  Item,
  NonCollisionObject,
} from "./types";
import {
  getBuildingTemplate,
  getWeaponTemplate,
  getConsumableTemplate,
  getCollectibleTemplate,
  getNonCollisionTemplate,
} from "./objects";
import { getMonsterTemplate, getGreatPowerTemplate } from "./monsters";

// Helper function to create object instances from building templates
const createObjectInstance = (
  templateShortName: string,
  position: Position,
  overrides: Partial<LevelObjectInstance> = {}
): LevelObjectInstance => {
  const template = getBuildingTemplate(templateShortName);
  if (!template) {
    throw new Error(`Building template ${templateShortName} not found`);
  }

  return {
    id: `${template.shortName}_${position.row}_${position.col}`,
    templateId: templateShortName,
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
    zIndex: template.zIndex,
    effects: template.effects,
    ...overrides,
  };
};

// Helper function to create item instances from templates
export const createItemInstance = (
  templateShortName: string,
  position: Position,
  overrides: Partial<Item> = {}
): Item => {
  // Try weapon first, then consumable
  let template = getWeaponTemplate(templateShortName);
  let itemType: "weapon" | "consumable" | "collectible" = "weapon";

  if (!template) {
    template = getConsumableTemplate(templateShortName);
    itemType = "consumable";
  }

  if (!template) {
    template = getCollectibleTemplate(templateShortName);
    itemType = "collectible";
  }

  if (!template) {
    throw new Error(`Item template ${templateShortName} not found`);
  }

  const baseItem: Item = {
    shortName: template.shortName,
    category: template.category,
    name: template.name,
    description: template.description,
    image: template.image,
    position,
    size: template.size || { width: 1, height: 1 },
    active: true,
    type: itemType,
    collectible: true,
    id: `${template.shortName}_${position.row}_${position.col}`,
    effects: template.effects,
  };

  // Add specific properties based on type
  if (itemType === "weapon") {
    baseItem.weaponId = template.shortName;
    baseItem.damage = template.damage;
    baseItem.hitBonus = template.hitBonus;
  } else if (itemType === "consumable" && template.effects) {
    const healEffect = template.effects.find((e) => e.type === "heal");
    if (healEffect) {
      baseItem.healAmount = healEffect.value;
    }
  }
  console.log("adding images:", baseItem.image);
  return {
    ...baseItem,
    ...overrides,
  };
};

// Helper function to create monster spawn configs - WITH SPAWN SETTINGS
const createMonsterInstance = (
  monsterShortName: string,
  spawnRate: number,
  spawnChance: number,
  maxInstances: number,
  position: Position = { row: 0, col: 0 }
): LevelMonsterInstance => {
  const template = getMonsterTemplate(monsterShortName);
  if (!template) {
    throw new Error(`Monster template ${monsterShortName} not found`);
  }

  return {
    id: `${monsterShortName}_spawn_config`,
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
    // SPAWN CONFIGURATION - SET PER LEVEL
    spawnRate,
    spawnChance,
    maxInstances,
    spawned: false,
  };
};




const createNonCollisionObject = (
  templateName: string,
  position: Position,
  rotation: number,
  overrides: Partial<NonCollisionObject> = {}
): NonCollisionObject => {
  const template = getNonCollisionTemplate(templateName);
  if (!template) {
    throw new Error(`NonCollisionObject template ${templateName} not found`);
  }

  return {
    id: `${template.shortName}_${position.row}_${position.col}_${rotation}`,
    position,
    rotation,
    ...template,
    ...overrides,
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
    name: "The Dark Outer Wastes",
    description:
      "The only lands known by the Monstruwacans, all else is beyond they skill and ken.",
    boardSize: { width: 400, height: 400 },
    playerSpawn: { row: 395, col: 200 },
    ambientLight: 0.2,
    weatherEffect: null,
    backgroundMusic: "nightland_ambient",

    // ITEMS - Created from templates with specific positions
    items: [
      createItemInstance("healthPotion", { row: 395, col: 195 }),
      createItemInstance("ironSword", { row: 380, col: 200 }),
      createItemInstance("maguffinRock", { row: 390, col: 210 }),
    ],

    // MONSTERS - Individual spawn configurations per level
    monsters: [
      createMonsterInstance("abhuman", 0.1, 0.2, 2),
      createMonsterInstance("night_hound", 0.04, 0.15, 3),
    ],

    // OBJECTS - Buildings and structures (including pools)
    objects: [
      createObjectInstance("redoubt", { row: 390, col: 198 }),
      createObjectInstance("healingPool", { row: 375, col: 20 }),
      createObjectInstance("poisonPool", { row: 250, col: 250 }),
      createObjectInstance("cursedTotem", { row: 385, col: 210 }),
    ],
     nonCollisionObjects: [
      // Start
       createNonCollisionObject('footsteps',{ row: 391, col: 195 }, 290), // straight

      // Moving westward (decreasing col)
      createNonCollisionObject('footsteps', { row: 385, col: 175 }, 280),
      createNonCollisionObject('footsteps', { row: 380, col: 155 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 135 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 115 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 95 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 75 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 55 }, 270),
      createNonCollisionObject('footsteps', { row: 380, col: 35 }, 270),
      // Arriving near pool


 createNonCollisionObject('river', { row: 360, col: 195 }, 0, {
    canTap: false, // Override to disable tapping
    width: 22, // Make it huge
    height: 15,
  }),
      



    ],
    // GREAT POWERS - Boss-level entities
    greatPowers: [
      createGreatPowerForLevel(
        "watcher_se",
        { row: 380, col: 190 },
        {
          hp: 1000,
          maxHP: 1000,
          attack: 50,
          ac: 25,
        }
      ),
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

    // DIFFERENT SPAWN SETTINGS FOR LEVEL 2
    monsters: [
      createMonsterInstance("night_hound", 0.25, 0.4, 6),
      createMonsterInstance("abhuman", 0.1, 0.15, 1),
    ],

    // OBJECTS - Buildings including pools
    objects: [createObjectInstance("poisonPool", { row: 150, col: 150 })],

    greatPowers: [],

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
  },
};

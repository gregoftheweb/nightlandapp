// config/objects.ts
import { GameObject, NonCollisionObject } from "./types";

import redoubtImg from "@assets/images/redoubt.png";
import riverIMG from "@assets/images/river1.png";
import cursedTotemIMG from "@assets/images/cursedtotem.png";
import petrifiedWillowIMG from "@assets/images/petrifiedWillow.png";
import maguffinRockIMG from "@assets/images/maguffinRock.png";
import shortSwordIMG from "@assets/images/shortSword.png";
import potionIMG from "@assets/images/potion.png";
import sanctuaryPoolImg from "@assets/images/poolofpeace.png";
import footprintsIMG from "@assets/images/footprints-blue.png";
import aeroWreckageIMG from "@assets/images/aero-wreckage.png";

// WEAPONS TEMPLATES - Pure templates without position data
export const weapons: Record<string, GameObject> = {
  discos: {
    shortName: "discos",
    category: "weapon",
    name: "Discos",
    description:
      "The weapon of man. A spinning disc of the Earth Current on a staff of some length, attuned to the man himself.",
    damage: 10,
    hitBonus: 2,
    type: "melee",
    weaponType: "melee",
    range: 1,
    active: true,
  },
  ironSword: {
    shortName: "ironSword",
    category: "weapon",
    name: "Iron Sword",
    description: "A sturdy iron blade, well-balanced and sharp.",
    image: shortSwordIMG,
    damage: 8,
    hitBonus: 1,
    type: "melee",
    weaponType: "melee",
    range: 1,
    active: true,
  },
  valkyries_bow: {
    shortName: "valkyries_bow",
    category: "weapon",
    name: "Valkyrie's Bow",
    description:
      "A legendary bow crafted by the Valkyries, it fires arrows of pure light that never miss their mark.",
    damage: 8,
    hitBonus: 3,
    type: "weapon",
    weaponType: "ranged",
    range: 10,
    active: true,
    projectileColor: "#0ce9e9ff", // Bright cyan arrow
  },
  shurikens: {
    shortName: "shurikens",
    category: "weapon",
    name: "Shurikens",
    description:
      "Razor-sharp throwing stars forged in the Last Redoubt. Swift and deadly from a distance.",
    damage: 6,
    hitBonus: 1,
    type: "weapon",
    weaponType: "ranged",
    range: 6,
    active: true,
    projectileColor: "#C0C0C0", // Silvery steel
  },
};

// CONSUMABLES TEMPLATES
export const consumables: Record<string, GameObject> = {
  healthPotion: {
    shortName: "healthPotion",
    category: "consumable",
    name: "Health Potion",
    description: "A red potion that restores health when consumed.",
    type: "consumable",
    image: potionIMG,
    active: true,
    effects: [
      {
        type: "heal",
        value: 25,
      },
    ],
  },
};

export const collectible: Record<string, GameObject> = {
  maguffinRock: {
    shortName: "maguffinRock",
    category: "collectible",
    name: "Maguffin Rock",
    description: "A mysterious rock formation with unknown properties.",
    type: "collectible",
    image: maguffinRockIMG,
    active: true,
    zIndex: 0,
  },
};

export const nonCollisionTemplates: Record<string, Omit<NonCollisionObject, 'id' | 'position' | 'rotation'>> = {
  footsteps: {
    shortName: "footsteps",
    name: "Footsteps of Persius",
    description: "Faint tracks of Persius lie before you, leading you onward in the gloomy dust.",
    width: 2,
    height: 2,
    image: footprintsIMG,
    zIndex: 1,
    type: 'footstep',
    canTap: true,
    active: true,
  },
  river: {
    shortName: "river",
    name: "Ancient River",
    description: "A dried riverbed from ages past.",
    width: 2,
    height: 2,
    image: riverIMG,
    zIndex: 0,
    type: 'river',
    canTap: false,
    active: true,
    collisionEffects: [
      {
        type: "heal",
        value: 5,
        description: "The cool river water refreshes you.",
      }
    ],
  },
};



// BUILDINGS TEMPLATES - Pure templates without position data
export const buildings: Record<string, GameObject> = {
  redoubt: {
    shortName: "redoubt",
    category: "building",
    name: "The Last Redoubt",
    description: "The Last home of the remnant of Mankind.",
    width: 8,
    height: 8,
    image: redoubtImg,
    active: true,
    zIndex: 0,
    effects: [
      {
        type: "recuperate",
        value: 10,
      },
      {
        type: "hide",
      },
    ],
  },
  river: {
    shortName: "river",
    category: "building",
    name: "Ancient River",
    description: "A dried riverbed from ages past.",
    width: 2,
    height: 6,
    image: riverIMG,
    active: true,
    zIndex: 0,
  },
  cursedTotem: {
    shortName: "cursedTotem",
    category: "building",
    name: "Cursed Totem",
    description: "An ancient totem radiating malevolent energy.",
    width: 4,
    height: 8,
    image: cursedTotemIMG,
    active: true,
    zIndex: 1,
    effects: [
      {
        type: "swarm",
        monsterType: "abhuman",
        count: 4,
        range: 12,
      },
    ],
  },
  petrifiedWillow: {
    shortName: "petrifiedWillow",
    category: "building",
    name: "Petrified Willow",
    description: "A once-living tree, now turned to stone.",
    width: 3,
    height: 3,
    image: petrifiedWillowIMG,
    active: true,
    zIndex: 0,
  },
  healingPool: {
    shortName: "healingPool",
    category: "building",
    name: "Healing Pool",
    description: "A serene pool of restorative waters.",
    width: 4,
    height: 4,
    image: sanctuaryPoolImg,
    active: true,
    zIndex: 0,
    effects: [
      {
        type: "recuperate",
        value: 10,
      },
      {
        type: "hide",
      },
    ],
  },
  poisonPool: {
    shortName: "poisonPool",
    category: "building",
    name: "Poison Pool",
    description: "A bubbling pool of toxic sludge.",
    width: 2,
    height: 2,
    image: sanctuaryPoolImg,
    active: true,
    zIndex: 0,
    effects: [
      {
        type: "poison",
        value: 10,
      },
    ],
  },
  aeroWreckage: {
    shortName: "aeroWreckage",
    category: "building",
    name: "Aero-Wreckage",
    description: "The twisted remnants of a long-lost crashed aerocraft from a forgotten age of the Redoubt. Ancient metal and strange devices lie scattered among the wreckage, relics of a time when humanity soared above the Night Land.",
    width: 4,
    height: 4,
    image: aeroWreckageIMG,
    active: true,
    zIndex: 0,
    effects: [
      {
        type: "hide",
      },
    ],
  },
};

// UTILITY FUNCTIONS TO GET TEMPLATES
export const getWeaponTemplate = (
  shortName: string
): GameObject | undefined => {
  return weapons[shortName];
};

export const getBuildingTemplate = (
  shortName: string
): GameObject | undefined => {
  return buildings[shortName];
};

export const getConsumableTemplate = (
  shortName: string
): GameObject | undefined => {
  return consumables[shortName];
};

export const getCollectibleTemplate = (
  shortName: string
): GameObject | undefined => {
  return collectible[shortName];
};

export const getItemTemplate = (shortName: string): GameObject | undefined => {
  return weapons[shortName] || consumables[shortName];
};


export const getNonCollisionTemplate = (shortName: string) => {
  return nonCollisionTemplates[shortName];
};



// Get all templates combined (useful for lookups)
export const getAllObjectTemplates = (): Record<string, GameObject> => {
  return {
    ...weapons,
    ...consumables,
    ...buildings,
  };
};

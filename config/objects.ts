// config/objects.ts
import { GameObject } from "./types";

import redoubtImg from "@assets/images/redoubt.png";
import riverIMG from "@assets/images/river1.png";
import cursedTotemIMG from "@assets/images/cursedtotem.png";
import petrifiedWillowIMG from "@assets/images/petrifiedWillow.png";
import maguffinRockIMG from "@assets/images/maguffinRock.png";
import shortSwordIMG from "@assets/images/shortSword.png";
import potionIMG from "@assets/images/potion.png";
import sanctuaryPoolImg from "@assets/images/poolofpeace.png";

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
    range: 1,
    active: true,
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

// BUILDINGS TEMPLATES - Pure templates without position data
export const buildings: Record<string, GameObject> = {
  redoubt: {
    shortName: "redoubt",
    category: "building",
    name: "The Last Redoubt",
    description: "The Last home of the remnant of Mankind.",
    width: 6,
    height: 6,
    image: redoubtImg,
    active: true,
    zIndex: 0,
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
    width: 1,
    height: 2,
    image: cursedTotemIMG,
    active: true,
    zIndex: 1,
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

// Get all templates combined (useful for lookups)
export const getAllObjectTemplates = (): Record<string, GameObject> => {
  return {
    ...weapons,
    ...consumables,
    ...buildings,
  };
};

// config/objects.ts
import { GameObject } from './types';

import redoubtImg from "@assets/images/redoubt.png";

// Weapons
export const weapons: Record<number, GameObject> = {
  1: {
    shortName: "discos",
    category: "weapon",
    name: "Discos",
    description:
      "The weapon of man. A spinning disc of the Earth Current on a staff of some length, attuned to the man himself.",
    damage: 10,
    hitBonus: 2,
    type: "melee",
    range: 1,
   
    active: true, // Weapon is active by default
  },
};

// Buildings

export const buildings: Record<number, GameObject> = {
  100: {
    shortName: "redoubt",
    category: "building",
    name: "The Last Redoubt",
    description: "The Last home of the remnant of Mankind.",
    width: 4,
    height: 4,
    image: redoubtImg, // ✅ pass the imported image
    position: { row: 396, col: 198 },
    active: true,
    zIndex: 0,
  },
};
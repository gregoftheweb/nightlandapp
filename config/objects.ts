// config/objects.ts
import { GameObject } from './types';

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
    image: null, // No image since it can never be dropped
    active: true, // Weapon is active by default
  },
};

// Buildings
export const buildings: Record<number, GameObject> = {
  100: {
    shortName: "redoubt",
    category: "building",
    name: "The Last Redoubt",
    description:
      "The great pyramid, the fortress of all remaining mankind, rising high into the eternal night.",
    width: 4,
    height: 4,
    image: "@assets/images/redoubt.png",
    position: { row: 396, col: 198 }, // Default position, overridden by level
    active: true, // Building is active by default
  },
};
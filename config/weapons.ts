// config/weapons.ts
// Centralized weapon definitions - single source of truth for all weapons in the game

import { Item } from "./types";

/**
 * Complete weapon catalog for the game.
 * Each weapon is a full Item definition with:
 * - Unique ID
 * - Display name and description
 * - Combat stats (damage, hitBonus)
 * - Weapon type (melee/ranged)
 * - Visual properties (projectileColor for ranged weapons)
 */
export const weaponsCatalog: Item[] = [
  {
    id: "weapon-discos-001",
    category: "weapon",
    shortName: "discos",
    name: "Discos",
    description:
      "Physically paired with Christos, powered by the Earth Current. This is a pole arm with a spinning blue disc of death for the evil monsters of the Night Land.",
    damage: 10,
    hitBonus: 2,
    effects: [],
    type: "weapon",
    weaponType: "melee",
    collectible: true,
  },
  {
    id: "weapon-shortsword-002",
    category: "weapon",
    shortName: "shortsword",
    name: "Short Sword",
    description:
      "A simple blade forged in the Last Redoubt, sharp and reliable against the lesser horrors.",
    damage: 6,
    hitBonus: 0,
    effects: [],
    type: "weapon",
    weaponType: "melee",
    collectible: true,
  },
  {
    id: "weapon-valkyries-bow-001",
    category: "weapon",
    shortName: "valkyries_bow",
    name: "Valkyrie's Bow",
    description:
      "A legendary bow crafted by the Valkyries, it fires arrows of pure light that never miss their mark.",
    damage: 8,
    hitBonus: 3,
    effects: [],
    type: "weapon",
    weaponType: "ranged",
    collectible: true,
    projectileColor: "#0ce9e9ff", // Bright cyan arrow
  },
  {
    id: "weapon-shurikens-001",
    category: "weapon",
    shortName: "shurikens",
    name: "Shurikens",
    description:
      "Razor-sharp throwing stars forged in the Last Redoubt. Swift and deadly from a distance.",
    damage: 6,
    hitBonus: 1,
    effects: [],
    type: "weapon",
    weaponType: "ranged",
    collectible: true,
    projectileColor: "#C0C0C0", // Silvery steel
  },
  {
    id: "weapon-lazer-pistol-001",
    category: "weapon",
    shortName: "lazer_pistol",
    name: "Lazer Pistol",
    description:
      "A high-tech energy weapon salvaged from the aerowreckage. Fires concentrated beams of orange light.",
    damage: 7,
    hitBonus: 2,
    effects: [],
    type: "weapon",
    weaponType: "ranged",
    collectible: true,
    projectileColor: "#ff7a00", // Bright orange laser bolt
    projectileLengthPx: 32, // Longer laser bolt (vs default 12px)
    projectileThicknessPx: 4, // Slightly thicker (vs default 3px)
    projectileGlow: true, // Add glow effect
  },
];

/**
 * Get a weapon by its unique ID
 * @param weaponId - The weapon's unique identifier (e.g., "weapon-discos-001")
 * @returns The weapon item or undefined if not found
 */
export const getWeaponById = (weaponId: string): Item | undefined => {
  return weaponsCatalog.find((weapon) => weapon.id === weaponId);
};

/**
 * Get a weapon by its short name
 * @param shortName - The weapon's short name (e.g., "discos", "valkyries_bow")
 * @returns The weapon item or undefined if not found
 */
export const getWeaponByShortName = (shortName: string): Item | undefined => {
  return weaponsCatalog.find((weapon) => weapon.shortName === shortName);
};

/**
 * Get all melee weapons
 * @returns Array of melee weapon items
 */
export const getMeleeWeapons = (): Item[] => {
  return weaponsCatalog.filter((weapon) => weapon.weaponType === "melee");
};

/**
 * Get all ranged weapons
 * @returns Array of ranged weapon items
 */
export const getRangedWeapons = (): Item[] => {
  return weaponsCatalog.filter((weapon) => weapon.weaponType === "ranged");
};

/**
 * Get all available weapon IDs
 * @returns Array of weapon IDs
 */
export const getAllWeaponIds = (): string[] => {
  return weaponsCatalog.map((weapon) => weapon.id!);
};

// config/weapons.ts
// Centralized weapon definitions - single source of truth for all weapons in the game

import { Item } from './types'

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
    kind: 'item',
    id: 'weapon-discos-001',
    category: 'weapon',
    shortName: 'discos',
    name: 'Discos',
    description:
      'Every boy of the Pyramid is given a Discos upon his naming day, wrought by a process the artisans themselves no longer fully understand — the knowledge is old, and much of it has been lost to the slow dying of the world. Each weapon is bound to its bearer alone, tempered in some archaic rite until it seems almost to think. It is why a boy scarce grown can stand against the horrors of the Night Land bare-handed but for this — the Discos knows its wielder, and does not let him fall easily.',
    damageMod: 0,
    hitBonus: 0,
    effects: [],
    type: 'weapon',
    weaponType: 'melee',
    collectible: true,
  },
  {
    kind: 'item',
    id: 'weapon-valkyries-bow-001',
    category: 'weapon',
    shortName: 'valkyries_bow',
    name: "Valkyrie's Bow",
    description:
      'Named for the Valkyries, a company of women warriors now near-legend, who broke the siege of the Pyramid in an age few living souls remember. This bow is one of the last relics of that war, kept within the Last Redoubt as a thing half weapon, half memory. Its string and shaft are infused with the Earth Current itself, and every arrow it looses burns a pale, unmistakable blue as it flies.',
    damageMod: 1,
    hitBonus: -1,
    range: 22,
    breaksHide: 'always',
    effects: [],
    type: 'weapon',
    weaponType: 'ranged',
    collectible: true,
    projectileColor: '#0ce9e9ff', // Bright cyan arrow
  },
  {
    kind: 'item',
    id: 'weapon-shurikens-001',
    category: 'weapon',
    shortName: 'shurikens',
    name: 'Shurikens',
    description:
      "Small, flat blades of honed grey steel, favored by those who move through the dark places close to the Redoubt's walls — scouts, watchers, and those who would rather not be seen at all. They carry no great story, only a practiced hand and a short, certain throw. What they lack in reach, they make up in how rarely they miss.",
    damageMod: -1,
    hitBonus: 3,
    range: 12,
    breaksHide: 'never',
    effects: [],
    type: 'weapon',
    weaponType: 'ranged',
    collectible: true,
    projectileColor: '#C0C0C0', // Silvery steel
  },
  {
    kind: 'item',
    id: 'weapon-lazer-pistol-001',
    category: 'weapon',
    shortName: 'lazer_pistol',
    name: 'Lazer Pistol',
    description:
      'A strange and gaudy thing to find in the Night Land — sleek, chromed, utterly unlike the hand-wrought weapons of the Pyramid. No one can say where it came from or what hand shaped it. It fires searing blasts of hot orange light with a sound like a held breath released, and whatever its origin, it means business.',
    damageMod: 3,
    hitBonus: 2,
    range: 30,
    breaksHide: 'always',
    effects: [],
    type: 'weapon',
    weaponType: 'ranged',
    collectible: true,
    projectileColor: '#ff7a00', // Bright orange laser bolt
    projectileLengthPx: 32, // Longer laser bolt (vs default 12px)
    projectileThicknessPx: 4, // Slightly thicker (vs default 3px)
    projectileGlow: true, // Add glow effect
  },
  {
    kind: 'item',
    id: 'weapon-earth-current-bolter-001',
    category: 'weapon',
    shortName: 'earth_current_bolter',
    name: 'Earth-Current Bolter',
    description:
      "A channeling rod of the old science, built to draw the Earth Current up through its length and loose it as a bolt of raw, humming force. Those who carry one speak of a faint warmth in the grip, as though the world's last living pulse ran through the weapon and, for a moment, through the one who holds it.",
    damageMod: 5,
    hitBonus: 3,
    range: 36,
    breaksHide: 'always',
    effects: [],
    type: 'weapon',
    weaponType: 'ranged',
    collectible: true,
    projectileColor: '#F4D35E',
    projectileLengthPx: 38,
    projectileThicknessPx: 5,
    projectileGlow: true,
  },
  {
    kind: 'item',
    id: 'weapon-voidglass-needler-001',
    category: 'weapon',
    shortName: 'voidglass_needler',
    name: 'Voidglass Needler',
    description:
      'Its ammunition is grown, not forged — thin needles of a black glass said to have cooled somewhere beyond the light of any redoubt, in the true dark between the stars the Night Land has long since swallowed. It is a precise, patient weapon, better suited to a steady hand than a desperate one, and it rarely wastes what little Earth Current it is given.',
    damageMod: 6,
    hitBonus: 5,
    range: 40,
    breaksHide: { chance: 0.5 },
    effects: [],
    type: 'weapon',
    weaponType: 'ranged',
    collectible: true,
    projectileColor: '#7B2CBF',
    projectileLengthPx: 28,
    projectileThicknessPx: 2,
    projectileGlow: true,
    projectileSpeedMultiplier: 1.6,
  },
  {
    kind: 'item',
    id: 'weapon-cinder-wrought-torch-001',
    category: 'weapon',
    shortName: 'cinder_wrought_torch',
    name: 'Cinder-Wrought Torch',
    description:
      "Forged in fires that are said to answer to the Salamander himself, this weapon does not so much fire as unleash — a gout of searing cinder-light that scorches whatever stands in its path. It is a brute's tool, ill-suited to careful aim, but nothing struck true by the Torch stands back up.",
    damageMod: 9,
    hitBonus: -1,
    range: 24,
    breaksHide: 'always',
    effects: [],
    type: 'weapon',
    weaponType: 'ranged',
    collectible: true,
    projectileColor: '#FF3D00',
    projectileLengthPx: 44,
    projectileThicknessPx: 7,
    projectileGlow: true,
  },
]

/**
 * Get a weapon by its unique ID
 * @param weaponId - The weapon's unique identifier (e.g., "weapon-discos-001")
 * @returns The weapon item or undefined if not found
 */
export const getWeaponById = (weaponId: string): Item | undefined => {
  return weaponsCatalog.find((weapon) => weapon.id === weaponId)
}

/**
 * Get a weapon by its short name
 * @param shortName - The weapon's short name (e.g., "discos", "valkyries_bow")
 * @returns The weapon item or undefined if not found
 */
export const getWeaponByShortName = (shortName: string): Item | undefined => {
  return weaponsCatalog.find((weapon) => weapon.shortName === shortName)
}

/**
 * Get all melee weapons
 * @returns Array of melee weapon items
 */
export const getMeleeWeapons = (): Item[] => {
  return weaponsCatalog.filter((weapon) => weapon.weaponType === 'melee')
}

/**
 * Get all ranged weapons
 * @returns Array of ranged weapon items
 */
export const getRangedWeapons = (): Item[] => {
  return weaponsCatalog.filter((weapon) => weapon.weaponType === 'ranged')
}

/**
 * Get all available weapon IDs
 * @returns Array of weapon IDs
 */
export const getAllWeaponIds = (): string[] => {
  return weaponsCatalog.map((weapon) => weapon.id!)
}

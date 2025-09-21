// config/monsters.ts
import { Monster, GreatPower } from './types';

import abhumanIMG from "@assets/images/abhuman.png";
import night_houndIMG from "@assets/images/nighthound4.png";
import watcher_seIMG from "@assets/images/watcherse.png";

// -------------------- REGULAR MONSTERS --------------------
export const monsters: Monster[] = [
  {
    shortName: 'abhuman',
    category: 'regular',
    name: 'Abhuman',
    description: 'Mutated humanoid with brute strength.',
    image: abhumanIMG,
    position: { row: 0, col: 0 }, // Default position, will be set during spawning
    active: true,
    hp: 12,
    maxHP: 12,
    attack: 5,
    ac: 12,
    moveRate: 2,
    spawnRate: 0.2,
    spawnChance: 0.3,
    maxInstances: 2,
    soulKey: 'str:16,dex:10,con:14,int:8,wis:8,cha:6',
  },
  {
    shortName: 'night_hound',
    category: 'regular',
    name: 'Night Hound',
    description: 'Swift, feral beast that hunts in packs.',
    image: night_houndIMG,
    position: { row: 0, col: 0 }, // Default position, will be set during spawning
    active: true,
    hp: 30,
    maxHP: 30,
    attack: 6,
    ac: 14,
    moveRate: 2,
    spawnRate: 0.2,
    spawnChance: 0.1,
    maxInstances: 15,
    soulKey: 'str:12,dex:16,con:12,int:6,wis:10,cha:8',
  },
];

// -------------------- GREAT POWERS --------------------
export const greatPowers: GreatPower[] = [
  {
    id: 'watcher_se',
    shortName: 'watcher_se',
    category: 'greatPower',
    name: 'Watcher of the South East',
    description: 'An ancient guardian with mystical powers that watches over the southeastern wastes.',
    image: watcher_seIMG,
    position: { row: 0, col: 0 }, // Will be set per level
    active: true,
    hp: 150,
    maxHP: 150,
    attack: 15,
    ac: 16,
    awakened: false,
    awakenCondition: 'player_within_range',
    soulKey: 'str:18,dex:12,con:16,int:14,wis:14,cha:12',
  },
];

// -------------------- HELPER FUNCTIONS --------------------

// Get monster template by shortName
export const getMonsterTemplate = (shortName: string): Monster | undefined => {
  return monsters.find(monster => monster.shortName === shortName);
};

// Get great power template by shortName
export const getGreatPowerTemplate = (shortName: string): GreatPower | undefined => {
  return greatPowers.find(power => power.shortName === shortName);
};

// Get all monster shortNames for validation
export const getAvailableMonsterTypes = (): string[] => {
  return monsters.map(monster => monster.shortName);
};

// Get all great power shortNames for validation
export const getAvailableGreatPowerTypes = (): string[] => {
  return greatPowers.map(power => power.shortName);
};
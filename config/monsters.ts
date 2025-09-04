// config/monsters.ts
import { Monster, Position } from './types';

import abhumanIMG from "@assets/images/abhuman.png";
import night_houndIMG from "@assets/images/nighthound4.png";
import watcher_seIMG from "@assets/images/watcherse.png";

export const monsters: Monster[] = [
  {
    shortName: 'abhuman',
    category: 'regular',
    name: 'Abhuman',
    description: 'Mutated humanoid with brute strength.',
    image: abhumanIMG,
    position: { row: 0, col: 0 },
    active: true,
    hp: 50,
    maxHP: 50,
    attack: 8,
    ac: 12,
    moveRate: 1,
    spawnRate: 1,
    spawnChance: 1,
    maxInstances: 10,
    soulKey: 'str:16,dex:10,con:14,int:8,wis:8,cha:6',
  },
  {
    shortName: 'night_hound',
    category: 'regular',
    name: 'Night Hound',
    description: 'Swift, feral beast that hunts in packs.',
    image: night_houndIMG,
    position: { row: 0, col: 0 },
    active: true,
    hp: 30,
    maxHP: 30,
    attack: 6,
    ac: 14,
    moveRate: 2,
    spawnRate: 0,
    spawnChance: 0,
    maxInstances: 15,
    soulKey: 'str:12,dex:16,con:12,int:6,wis:10,cha:8',
  },
  {
    shortName: 'watcher_se',
    category: 'greatPower',
    name: 'Watcher of the South East',
    description: 'An ancient guardian with mystical powers.',
    image: watcher_seIMG,
    position: { row: 0, col: 0 },
    active: true,
    hp: 150,
    maxHP: 150,
    attack: 15,
    ac: 16,
    moveRate: 1,
    spawnRate: 0,
    spawnChance: 0,
    maxInstances: 1,
    soulKey: 'str:18,dex:12,con:16,int:14,wis:14,cha:12',
  },

];
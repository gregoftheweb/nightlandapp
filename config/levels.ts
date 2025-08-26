// config/levels.ts
import { Level, Position, Monster } from './types';
import { buildings, weapons } from './objects';
import { monsters } from './monsters';

export const levels: Record<string, Level> = {
  "1": {
    id: "1",
    name: "The Nightland - First Steps",
    boardSize: { width: 400, height: 400 },
    playerSpawn: { row: 395, col: 200 },
    items: [
      {
        shortName: "healthPotion",
        category: "consumable", // Added
        name: "Health Potion",
        image: "potion.png",
        position: { row: 350, col: 180 },
        size: { width: 1, height: 1 },
        active: true,
        type: "consumable",
        collectible: true,
      },
      {
        shortName: "ironSword",
        category: "weapon", // Added
        name: "Iron Sword",
        image: "sword.png",
        position: { row: 300, col: 250 },
        size: { width: 1, height: 1 },
        active: true,
        type: "weapon",
        collectible: true,
        weaponId: "ironSword",
      },
    ],
    monsters: [
      {
        ...monsters.find(m => m.shortName === "abhuman") || {}, // Changed from "orc" to "abhuman"
        id: "abhuman-1",
        position: { row: 0, col: 0 },
        active: false,
      } as Monster,
    ],
    objects: [
      {
        ...buildings[100], // Changed from buildings.redoubt to buildings[100]
        shortName: "redoubt",
        position: { row: 390, col: 195 },
        active: true,
      },
    ],
    pools: [
      {
        position: { row: 200, col: 200 },
        effects: [
          { type: "heal", value: 50 },
          { type: "hide", value: 5 },
        ],
      },
    ],
    greatPowers: [
      {
        shortName: "watcherse",
        category: "greatPower", // Added
        name: "The Watcher of the South East",
        image: "watcher.png",
        position: { row: 100, col: 350 },
        size: { width: 3, height: 3 },
        active: true,
        hp: 1000,
        maxHP: 1000,
        attack: 50,
        ac: 25,
        moveRate: 0,
        soulKey: "str:25,dex:10,con:25,int:20,wis:20,cha:25",
      },
    ],
  },
};
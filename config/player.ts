// config/player.ts
import { Player } from './types';
import { weapons } from './objects';

export const playerConfig: Player = {
  name: "Christos",
  id: "christos",
  image: "christos.png",
  position: { row: 395, col: 200 }, // Default spawn, overridden by level
  hp: 100,
  maxHP: 100,
  ac: 10, // Base AC before DEX modifier
  attack: 4, // Unarmed attack
  isHidden: false,
  hideTurns: 0,
  inventory: [],
  weapons: weapons[1] ? [{ id: weapons[1].shortName, equipped: true }] : [],
  soulKey: "str:15,dex:14,con:13,int:12,wis:11,cha:10", // D&D style attributes
  moveSpeed: 1,
};

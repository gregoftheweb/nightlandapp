// config/player.ts
import { Player } from "./types";
import { weapons } from "./objects";
import christosIMG from "@assets/images/christos.png";

export const playerConfig: Player = {
  name: "Christos",
  shortName: "christos",
  id: "christos",
  description: "One of the humans from the Last Redoubt.",
  lastComment: "",
  image: christosIMG,
  hp: 100,
  maxHP: 100,
  position: { row: 395, col: 200 },
  moveSpeed: 1,
  initiative: 10,
  attack: 4,
  ac: 14,
  inventory: [],
  maxInventorySize: 10,
  weapons: [
    {
      id: "weapon-discos-001",
      equipped: true,
    },
  ],
  maxWeaponsSize: 4,
  isHidden: false,
  hideTurns: 0,
  soulKey: "7C6368627E64",
};

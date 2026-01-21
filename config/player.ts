// config/player.ts
import { Player } from './types'
import { weapons } from './objects'
import christosIMG from '@assets/images/christos.png'

export const playerConfig: Player = {
  name: 'Christos',
  shortName: 'christos',
  id: 'christos',
  description:
    'A brave hero from the Last Redoubt. He ventures on a hopeless quest to rescue is brother - Persius.',
  lastComment: '',
  image: christosIMG,
  hp: 100,
  maxHP: 100,
  position: { row: 395, col: 200 },
  zIndex: 500,
  moveSpeed: 1,
  initiative: 10,
  attack: 8,
  ac: 14,
  inventory: [],
  maxInventorySize: 10,
  weapons: [
    {
      id: 'weapon-discos-001',
      equipped: true,
    },
  ],
  maxWeaponsSize: 4,
  meleeWeaponId: 'weapon-discos-001', // Fixed melee weapon (Discos)
  equippedRangedWeaponId: 'weapon-valkyries-bow-001', // Default equipped ranged weapon
  rangedWeaponInventoryIds: ['weapon-valkyries-bow-001', 'weapon-shurikens-001'], // Starting ranged weapons
  isHidden: false,
  hideTurns: 0,
  soulKey: '7C6368627E64',
}

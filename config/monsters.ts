// config/monsters.ts
import { MonsterTemplateV2, GreatPowerTemplateV2 } from './types'

import abhumanIMG from '@assets/images/sprites/monsters/abhuman.webp'
import night_houndIMG from '@assets/images/sprites/monsters/nighthound4.webp'
import watcher_seIMG from '@assets/images/sprites/monsters/watcherse.webp'

// -------------------- REGULAR MONSTERS --------------------
// Base monster templates - Static definitions without runtime state
export const monsterTemplates: MonsterTemplateV2[] = [
  {
    kind: 'monster',
    shortName: 'abhuman',
    category: 'regular',
    name: 'Abhuman',
    description: 'Mutated humanoid with brute strength.',
    image: abhumanIMG,
    maxHP: 12,
    attack: 5,
    ac: 12,
    moveRate: 2,
  },
  {
    kind: 'monster',
    shortName: 'night_hound',
    category: 'regular',
    name: 'Night Hound',
    description: 'Swift, feral beast that hunts in packs.',
    image: night_houndIMG,
    maxHP: 30,
    attack: 6,
    ac: 14,
    moveRate: 2,
  },
]

// -------------------- GREAT POWERS --------------------
// V2 Templates - Static definitions without runtime state
export const greatPowerTemplates: GreatPowerTemplateV2[] = [
  {
    kind: 'greatPower',
    shortName: 'watcher_se',
    category: 'greatPower',
    name: 'Watcher of the South East',
    description:
      'An ancient guardian with mystical powers that watches over the southeastern wastes.',
    image: watcher_seIMG,
    width: 6,
    height: 6,
    maxHP: 150,
    attack: 15,
    ac: 16,
    effects: [
      {
        type: 'soulsuck',
      },
    ],
    awakenCondition: 'player_within_range',
  },
]

// -------------------- HELPER FUNCTIONS --------------------

// Get monster template by shortName
export const getMonsterTemplate = (shortName: string): MonsterTemplateV2 | undefined => {
  return monsterTemplates.find((monster) => monster.shortName === shortName)
}

// Get great power template by shortName (V2)
export const getGreatPowerTemplate = (shortName: string): GreatPowerTemplateV2 | undefined => {
  return greatPowerTemplates.find((power) => power.shortName === shortName)
}

// Get all monster shortNames for validation
export const getAvailableMonsterTypes = (): string[] => {
  return monsterTemplates.map((monster) => monster.shortName)
}

// Get all great power shortNames for validation
export const getAvailableGreatPowerTypes = (): string[] => {
  return greatPowerTemplates.map((power) => power.shortName)
}

// Get monster templates as a Map for hydration
export const getMonsterTemplateMap = (): Map<string, MonsterTemplateV2> => {
  return new Map(monsterTemplates.map((template) => [template.shortName, template]))
}

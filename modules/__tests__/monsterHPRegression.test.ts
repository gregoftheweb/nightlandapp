/**
 * Regression tests for monster HP field consistency
 * 
 * Ensures that after migrating to MonsterTemplateV2:
 * - Runtime monsters always have both hp and maxHP
 * - hp is never null/undefined
 * - Ranged targeting and combat can find valid HP values
 */
import { createMonsterFromTemplate } from '../monsterUtils'
import { hydrateMonster, hydratedMonsterToMonster } from '../hydration'
import { getMonsterTemplate } from '../../config/monsters'
import { MonsterInstance } from '../../config/types'

describe('Monster HP Regression Tests', () => {
  describe('createMonsterFromTemplate', () => {
    it('should create monsters with valid hp and maxHP', () => {
      const position = { row: 10, col: 15 }
      const monster = createMonsterFromTemplate('abhuman', position)

      expect(monster).not.toBeNull()
      expect(monster?.hp).toBeDefined()
      expect(monster?.hp).not.toBeNull()
      expect(monster?.maxHP).toBeDefined()
      expect(monster?.maxHP).not.toBeNull()
      expect(typeof monster?.hp).toBe('number')
      expect(typeof monster?.maxHP).toBe('number')
      expect(monster?.hp).toBeGreaterThan(0)
      expect(monster?.maxHP).toBeGreaterThan(0)
    })

    it('should set hp equal to maxHP for new monsters', () => {
      const position = { row: 10, col: 15 }
      const monster = createMonsterFromTemplate('abhuman', position)

      expect(monster?.hp).toBe(monster?.maxHP)
    })

    it('should handle all monster types correctly', () => {
      const position = { row: 10, col: 15 }
      const monsterTypes = ['abhuman', 'night_hound']

      for (const type of monsterTypes) {
        const monster = createMonsterFromTemplate(type, position)

        expect(monster).not.toBeNull()
        expect(monster?.hp).toBeDefined()
        expect(monster?.hp).not.toBeNull()
        expect(monster?.maxHP).toBeDefined()
        expect(monster?.maxHP).not.toBeNull()
        expect(typeof monster?.hp).toBe('number')
        expect(typeof monster?.maxHP).toBe('number')
      }
    })
  })

  describe('hydratedMonsterToMonster normalization', () => {
    it('should set hp to maxHP when currentHP is undefined', () => {
      const template = getMonsterTemplate('abhuman')
      expect(template).toBeDefined()

      // Create instance with undefined currentHP (simulating old data)
      const instance: MonsterInstance = {
        id: 'test-monster-1',
        templateId: 'abhuman',
        position: { row: 10, col: 10 },
        currentHP: undefined as any, // Simulate missing currentHP
      }

      const hydrated = hydrateMonster(template!, instance)
      const monster = hydratedMonsterToMonster(hydrated)

      // Should normalize to maxHP
      expect(monster.hp).toBe(template!.maxHP)
      expect(monster.maxHP).toBe(template!.maxHP)
    })

    it('should preserve currentHP when it is defined', () => {
      const template = getMonsterTemplate('abhuman')
      expect(template).toBeDefined()

      const instance: MonsterInstance = {
        id: 'test-monster-2',
        templateId: 'abhuman',
        position: { row: 10, col: 10 },
        currentHP: 5, // Damaged monster
      }

      const hydrated = hydrateMonster(template!, instance)
      const monster = hydratedMonsterToMonster(hydrated)

      expect(monster.hp).toBe(5)
      expect(monster.maxHP).toBe(template!.maxHP)
    })

    it('should handle zero HP correctly', () => {
      const template = getMonsterTemplate('abhuman')
      expect(template).toBeDefined()

      const instance: MonsterInstance = {
        id: 'test-monster-3',
        templateId: 'abhuman',
        position: { row: 10, col: 10 },
        currentHP: 0, // Dead monster
      }

      const hydrated = hydrateMonster(template!, instance)
      const monster = hydratedMonsterToMonster(hydrated)

      expect(monster.hp).toBe(0)
      expect(monster.maxHP).toBe(template!.maxHP)
    })
  })

  describe('combat and targeting compatibility', () => {
    it('should allow filtering living monsters by hp > 0', () => {
      const position = { row: 10, col: 15 }
      const monster1 = createMonsterFromTemplate('abhuman', position)
      const monster2 = createMonsterFromTemplate('night_hound', position)

      expect(monster1).not.toBeNull()
      expect(monster2).not.toBeNull()

      const monsters = [monster1!, monster2!]
      const livingMonsters = monsters.filter((m) => m.hp > 0)

      expect(livingMonsters).toHaveLength(2)
      expect(livingMonsters[0].hp).toBeGreaterThan(0)
      expect(livingMonsters[1].hp).toBeGreaterThan(0)
    })

    it('should support common combat checks', () => {
      const position = { row: 10, col: 15 }
      const monster = createMonsterFromTemplate('abhuman', position)

      expect(monster).not.toBeNull()
      expect(monster?.hp).toBeDefined()
      expect(monster?.maxHP).toBeDefined()

      // Common combat checks that should work
      expect(monster!.hp > 0).toBe(true) // Is alive
      expect(monster!.hp <= monster!.maxHP).toBe(true) // HP within bounds
      expect(monster!.active !== false && monster!.position).toBeTruthy() // Has position
    })
  })
})

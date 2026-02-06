/**
 * Regression tests for monster HP field consistency
 * 
 * Ensures that after migrating to MonsterTemplate:
 * - Runtime monsters always have both currentHP and maxHP
 * - currentHP is never null/undefined
 * - Ranged targeting and combat can find valid HP values
 */
import { createMonsterFromTemplate } from '../monsterUtils'
import { hydrateMonster } from '../hydration'
import { getMonsterTemplate } from '../../config/monsters'
import { MonsterInstance } from '../../config/types'

describe('Monster HP Regression Tests', () => {
  describe('createMonsterFromTemplate', () => {
    it('should create monsters with valid currentHP and maxHP', () => {
      const position = { row: 10, col: 15 }
      const monster = createMonsterFromTemplate('abhuman', position)

      expect(monster).not.toBeNull()
      expect(monster?.currentHP).toBeDefined()
      expect(monster?.currentHP).not.toBeNull()
      expect(monster?.maxHP).toBeDefined()
      expect(monster?.maxHP).not.toBeNull()
      expect(typeof monster?.currentHP).toBe('number')
      expect(typeof monster?.maxHP).toBe('number')
      expect(monster?.currentHP).toBeGreaterThan(0)
      expect(monster?.maxHP).toBeGreaterThan(0)
    })

    it('should set currentHP equal to maxHP for new monsters', () => {
      const position = { row: 10, col: 15 }
      const monster = createMonsterFromTemplate('abhuman', position)

      expect(monster?.currentHP).toBe(monster?.maxHP)
    })

    it('should handle all monster types correctly', () => {
      const position = { row: 10, col: 15 }
      const monsterTypes = ['abhuman', 'night_hound']

      for (const type of monsterTypes) {
        const monster = createMonsterFromTemplate(type, position)

        expect(monster).not.toBeNull()
        expect(monster?.currentHP).toBeDefined()
        expect(monster?.currentHP).not.toBeNull()
        expect(monster?.maxHP).toBeDefined()
        expect(monster?.maxHP).not.toBeNull()
        expect(typeof monster?.currentHP).toBe('number')
        expect(typeof monster?.maxHP).toBe('number')
      }
    })
  })

  describe('hydrateMonster with currentHP', () => {
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

      expect(hydrated.currentHP).toBe(5)
      expect(hydrated.maxHP).toBe(template!.maxHP)
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

      expect(hydrated.currentHP).toBe(0)
      expect(hydrated.maxHP).toBe(template!.maxHP)
    })
  })

  describe('combat and targeting compatibility', () => {
    it('should allow filtering living monsters by currentHP > 0', () => {
      const position = { row: 10, col: 15 }
      const monster1 = createMonsterFromTemplate('abhuman', position)
      const monster2 = createMonsterFromTemplate('night_hound', position)

      expect(monster1).not.toBeNull()
      expect(monster2).not.toBeNull()

      const monsters = [monster1!, monster2!]
      const livingMonsters = monsters.filter((m) => m.currentHP > 0)

      expect(livingMonsters).toHaveLength(2)
      expect(livingMonsters[0].currentHP).toBeGreaterThan(0)
      expect(livingMonsters[1].currentHP).toBeGreaterThan(0)
    })

    it('should support common combat checks', () => {
      const position = { row: 10, col: 15 }
      const monster = createMonsterFromTemplate('abhuman', position)

      expect(monster).not.toBeNull()
      expect(monster?.currentHP).toBeDefined()
      expect(monster?.maxHP).toBeDefined()

      // Common combat checks that should work
      expect(monster!.currentHP > 0).toBe(true) // Is alive
      expect(monster!.currentHP <= monster!.maxHP).toBe(true) // HP within bounds
      expect(monster!.position).toBeTruthy() // Has position
    })
  })
})

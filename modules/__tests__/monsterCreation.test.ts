/**
 * Unit tests for monster creation using template/instance/hydration pattern
 *
 * Tests verify that:
 * - createMonsterFromTemplate uses the MonsterTemplate + MonsterInstance pattern
 * - Hydrated monsters (RuntimeMonster) are returned correctly
 * - Monster instances have proper IDs, positions, and currentHP
 */
import { createMonsterFromTemplate } from '../monsterUtils'
import { RuntimeMonster } from '../../config/types'

describe('Monster Creation', () => {
  describe('createMonsterFromTemplate', () => {
    it('should create a monster from abhuman template', () => {
      const position = { row: 10, col: 15 }
      const monster = createMonsterFromTemplate('abhuman', position)

      expect(monster).not.toBeNull()
      expect(monster?.shortName).toBe('abhuman')
      expect(monster?.name).toBe('Abhuman')
      expect(monster?.position).toEqual(position)
      expect(monster?.currentHP).toBe(12) // Abhuman starts with 12 HP
      expect(monster?.maxHP).toBe(12)
      expect(monster?.attack).toBe(5)
      expect(monster?.ac).toBe(12)
      expect(monster?.moveRate).toBe(2)
      expect(monster?.id).toContain('abhuman-') // Should have unique ID
    })

    it('should create a monster from night_hound template', () => {
      const position = { row: 20, col: 25 }
      const monster = createMonsterFromTemplate('night_hound', position)

      expect(monster).not.toBeNull()
      expect(monster?.shortName).toBe('night_hound')
      expect(monster?.name).toBe('Night Hound')
      expect(monster?.position).toEqual(position)
      expect(monster?.currentHP).toBe(30) // Night Hound starts with 30 HP
      expect(monster?.maxHP).toBe(30)
      expect(monster?.attack).toBe(6)
      expect(monster?.ac).toBe(14)
      expect(monster?.moveRate).toBe(2)
    })

    it('should return null for unknown template', () => {
      const position = { row: 5, col: 5 }
      const monster = createMonsterFromTemplate('unknown_monster', position)

      expect(monster).toBeNull()
    })

    it('should create monsters with unique IDs', () => {
      const position = { row: 10, col: 10 }
      const monster1 = createMonsterFromTemplate('abhuman', position)
      const monster2 = createMonsterFromTemplate('abhuman', position)

      expect(monster1?.id).not.toBe(monster2?.id)
    })

    it('should create monsters that are compatible with RuntimeMonster type', () => {
      const position = { row: 10, col: 10 }
      const monster = createMonsterFromTemplate('abhuman', position)

      // Should have all required RuntimeMonster properties
      expect(monster).toHaveProperty('id')
      expect(monster).toHaveProperty('position')
      expect(monster).toHaveProperty('currentHP')
      expect(monster).toHaveProperty('maxHP')
      expect(monster).toHaveProperty('attack')
      expect(monster).toHaveProperty('ac')
      expect(monster).toHaveProperty('moveRate')
      expect(monster).toHaveProperty('shortName')
      expect(monster).toHaveProperty('name')
      expect(monster).toHaveProperty('category')

      // Type check - should be assignable to RuntimeMonster
      const monsterVar: RuntimeMonster | null = monster
      expect(monsterVar).not.toBeNull()
    })

    it('should set currentHP to template max HP on creation', () => {
      const position = { row: 10, col: 10 }
      const abhuman = createMonsterFromTemplate('abhuman', position)
      const nightHound = createMonsterFromTemplate('night_hound', position)

      // Both should start at full HP
      expect(abhuman?.currentHP).toBe(abhuman?.maxHP)
      expect(nightHound?.currentHP).toBe(nightHound?.maxHP)
    })
  })
})

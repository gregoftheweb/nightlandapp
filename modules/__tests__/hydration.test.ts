/**
 * Unit tests for hydration module
 * 
 * Tests verify that:
 * - Templates and instances merge correctly
 * - Instance properties override template defaults
 * - Required fields are present in hydrated entities
 * - Batch hydration works correctly
 */
import {
  hydrateObject,
  hydrateMonster,
  hydrateObjects,
  hydrateMonsters,
} from '../hydration'
import {
  GameObjectTemplate,
  MonsterTemplate,
  ObjectInstance,
  MonsterInstance,
} from '../../config/types'

describe('hydration module', () => {
  describe('hydrateObject', () => {
    it('should merge template and instance correctly', () => {
      const template: GameObjectTemplate = {
        shortName: 'test-building',
        category: 'building',
        name: 'Test Building',
        description: 'A test building',
        zIndex: 1,
        rotation: 0,
      }

      const instance: ObjectInstance = {
        id: 'test-building-1',
        templateId: 'test-building',
        position: { row: 5, col: 10 },
      }

      const hydrated = hydrateObject(template, instance)

      expect(hydrated.id).toBe('test-building-1')
      expect(hydrated.templateId).toBe('test-building')
      expect(hydrated.position).toEqual({ row: 5, col: 10 })
      expect(hydrated.shortName).toBe('test-building')
      expect(hydrated.name).toBe('Test Building')
      expect(hydrated.active).toBe(true)
      expect(hydrated.zIndex).toBe(1)
      expect(hydrated.rotation).toBe(0)
    })

    it('should allow instance to override template properties', () => {
      const template: GameObjectTemplate = {
        shortName: 'rotatable-building',
        category: 'building',
        name: 'Rotatable Building',
        rotation: 0,
        zIndex: 1,
      }

      const instance: ObjectInstance = {
        id: 'rotatable-building-1',
        templateId: 'rotatable-building',
        position: { row: 3, col: 7 },
        rotation: 90, // Override template rotation
        zIndex: 5, // Override template zIndex
      }

      const hydrated = hydrateObject(template, instance)

      expect(hydrated.rotation).toBe(90) // Instance override
      expect(hydrated.zIndex).toBe(5) // Instance override
    })

    it('should include instance-specific properties', () => {
      const template: GameObjectTemplate = {
        shortName: 'chest',
        category: 'building',
        name: 'Chest',
      }

      const instance: ObjectInstance = {
        id: 'chest-1',
        templateId: 'chest',
        position: { row: 1, col: 1 },
        interactable: true,
        interactionType: 'chest',
        locked: true,
        keyRequired: 'silver-key',
      }

      const hydrated = hydrateObject(template, instance)

      expect(hydrated.interactable).toBe(true)
      expect(hydrated.interactionType).toBe('chest')
      expect(hydrated.locked).toBe(true)
      expect(hydrated.keyRequired).toBe('silver-key')
    })
  })

  describe('hydrateMonster', () => {
    it('should merge monster template and instance correctly', () => {
      const template: MonsterTemplate = {
        shortName: 'test-monster',
        category: 'monster',
        name: 'Test Monster',
        hp: 50,
        maxHP: 50,
        attack: 10,
        ac: 12,
        moveRate: 1,
        soulKey: '000001',
      }

      const instance: MonsterInstance = {
        id: 'test-monster-1',
        templateId: 'test-monster',
        position: { row: 15, col: 20 },
        currentHP: 30, // Damaged
      }

      const hydrated = hydrateMonster(template, instance)

      expect(hydrated.id).toBe('test-monster-1')
      expect(hydrated.templateId).toBe('test-monster')
      expect(hydrated.position).toEqual({ row: 15, col: 20 })
      expect(hydrated.shortName).toBe('test-monster')
      expect(hydrated.name).toBe('Test Monster')
      expect(hydrated.hp).toBe(50) // Template max HP
      expect(hydrated.maxHP).toBe(50)
      expect(hydrated.currentHP).toBe(30) // Instance current HP
      expect(hydrated.attack).toBe(10)
      expect(hydrated.ac).toBe(12)
    })

    it('should include spawn state from instance', () => {
      const template: MonsterTemplate = {
        shortName: 'spawnable-monster',
        category: 'monster',
        name: 'Spawnable Monster',
        hp: 40,
        maxHP: 40,
        attack: 8,
        ac: 10,
        moveRate: 2,
        soulKey: '000002',
      }

      const instance: MonsterInstance = {
        id: 'spawnable-monster-1',
        templateId: 'spawnable-monster',
        position: { row: 8, col: 12 },
        currentHP: 40,
        spawned: true,
        spawnZoneId: 'zone-1',
      }

      const hydrated = hydrateMonster(template, instance)

      expect(hydrated.spawned).toBe(true)
      expect(hydrated.spawnZoneId).toBe('zone-1')
    })
  })

  describe('hydrateObjects', () => {
    it('should batch hydrate multiple objects', () => {
      const templates = new Map<string, GameObjectTemplate>([
        [
          'building-a',
          {
            shortName: 'building-a',
            category: 'building',
            name: 'Building A',
            zIndex: 1,
          },
        ],
        [
          'building-b',
          {
            shortName: 'building-b',
            category: 'building',
            name: 'Building B',
            zIndex: 2,
          },
        ],
      ])

      const instances: ObjectInstance[] = [
        {
          id: 'building-a-1',
          templateId: 'building-a',
          position: { row: 1, col: 1 },
        },
        {
          id: 'building-b-1',
          templateId: 'building-b',
          position: { row: 2, col: 2 },
        },
      ]

      const hydrated = hydrateObjects(templates, instances)

      expect(hydrated).toHaveLength(2)
      expect(hydrated[0].name).toBe('Building A')
      expect(hydrated[0].position).toEqual({ row: 1, col: 1 })
      expect(hydrated[1].name).toBe('Building B')
      expect(hydrated[1].position).toEqual({ row: 2, col: 2 })
    })

    it('should throw error if template not found', () => {
      const templates = new Map<string, GameObjectTemplate>()
      const instances: ObjectInstance[] = [
        {
          id: 'missing-1',
          templateId: 'missing-building',
          position: { row: 1, col: 1 },
        },
      ]

      expect(() => hydrateObjects(templates, instances)).toThrow(
        'Template not found: missing-building'
      )
    })
  })

  describe('hydrateMonsters', () => {
    it('should batch hydrate multiple monsters', () => {
      const templates = new Map<string, MonsterTemplate>([
        [
          'monster-a',
          {
            shortName: 'monster-a',
            category: 'monster',
            name: 'Monster A',
            hp: 30,
            maxHP: 30,
            attack: 5,
            ac: 8,
            moveRate: 1,
            soulKey: '000003',
          },
        ],
        [
          'monster-b',
          {
            shortName: 'monster-b',
            category: 'monster',
            name: 'Monster B',
            hp: 50,
            maxHP: 50,
            attack: 10,
            ac: 12,
            moveRate: 2,
            soulKey: '000004',
          },
        ],
      ])

      const instances: MonsterInstance[] = [
        {
          id: 'monster-a-1',
          templateId: 'monster-a',
          position: { row: 5, col: 5 },
          currentHP: 20,
        },
        {
          id: 'monster-b-1',
          templateId: 'monster-b',
          position: { row: 10, col: 10 },
          currentHP: 50,
        },
      ]

      const hydrated = hydrateMonsters(templates, instances)

      expect(hydrated).toHaveLength(2)
      expect(hydrated[0].name).toBe('Monster A')
      expect(hydrated[0].currentHP).toBe(20)
      expect(hydrated[1].name).toBe('Monster B')
      expect(hydrated[1].currentHP).toBe(50)
    })

    it('should throw error if monster template not found', () => {
      const templates = new Map<string, MonsterTemplate>()
      const instances: MonsterInstance[] = [
        {
          id: 'missing-1',
          templateId: 'missing-monster',
          position: { row: 1, col: 1 },
          currentHP: 10,
        },
      ]

      expect(() => hydrateMonsters(templates, instances)).toThrow(
        'Template not found: missing-monster'
      )
    })
  })
})

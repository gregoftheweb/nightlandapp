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
  hydrateObjects,
  hydrateMonster,
  hydrateGreatPower,
  hydrateMonsters,
  hydrateGreatPowers,
} from '../hydration'
import {
  GameObjectTemplate,
  ObjectInstance,
  MonsterTemplate,
  MonsterInstance,
  GreatPowerTemplate,
  GreatPowerInstance,
} from '../../config/types'

describe('hydration module', () => {
  describe('hydrateObject', () => {
    it('should merge template and instance correctly', () => {
      const template: GameObjectTemplate = {
        kind: 'object',
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
        kind: 'object',
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
        kind: 'object',
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
        kind: 'monster',
        shortName: 'test-monster',
        category: 'monster',
        name: 'Test Monster',
        maxHP: 50,
        attack: 10,
        ac: 12,
        moveRate: 1,
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
      expect(hydrated.maxHP).toBe(50)
      expect(hydrated.currentHP).toBe(30) // Instance current HP
      expect(hydrated.attack).toBe(10)
      expect(hydrated.ac).toBe(12)
    })

    it('should include spawn state from instance', () => {
      const template: MonsterTemplate = {
        kind: 'monster',
        shortName: 'spawnable-monster',
        category: 'monster',
        name: 'Spawnable Monster',
        maxHP: 40,
        attack: 8,
        ac: 10,
        moveRate: 2,
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
            kind: 'object',
            shortName: 'building-a',
            category: 'building',
            name: 'Building A',
            zIndex: 1,
          },
        ],
        [
          'building-b',
          {
            kind: 'object',
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

  describe('hydrateMonsters (legacy compatibility)', () => {
    it('should batch hydrate multiple monsters', () => {
      const templates = new Map<string, MonsterTemplate>([
        [
          'monster-a',
          {
            kind: 'monster',
            shortName: 'monster-a',
            category: 'monster',
            name: 'Monster A',
            maxHP: 30,
            attack: 5,
            ac: 8,
            moveRate: 1,
          },
        ],
        [
          'monster-b',
          {
            kind: 'monster',
            shortName: 'monster-b',
            category: 'monster',
            name: 'Monster B',
            maxHP: 50,
            attack: 10,
            ac: 12,
            moveRate: 2,
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

  // ===== Hydration Tests =====

  describe('hydrateMonster', () => {
    it('should merge monster template and instance correctly', () => {
      const template: MonsterTemplate = {
        kind: 'monster',
        shortName: 'test-monster-v2',
        category: 'monster',
        name: 'Test Monster V2',
        maxHP: 60,
        attack: 12,
        ac: 14,
        moveRate: 2,
      }

      const instance: MonsterInstance = {
        id: 'test-monster-v2-1',
        templateId: 'test-monster-v2',
        position: { row: 20, col: 25 },
        currentHP: 40, // Damaged
      }

      const hydrated = hydrateMonster(template, instance)

      expect(hydrated.id).toBe('test-monster-v2-1')
      expect(hydrated.templateId).toBe('test-monster-v2')
      expect(hydrated.position).toEqual({ row: 20, col: 25 })
      expect(hydrated.shortName).toBe('test-monster-v2')
      expect(hydrated.name).toBe('Test Monster V2')
      expect(hydrated.maxHP).toBe(60)
      expect(hydrated.currentHP).toBe(40)
      expect(hydrated.attack).toBe(12)
      expect(hydrated.ac).toBe(14)
    })

    it('should include UI and combat slots from instance', () => {
      const template: MonsterTemplate = {
        kind: 'monster',
        shortName: 'combat-monster-v2',
        category: 'monster',
        name: 'Combat Monster V2',
        maxHP: 50,
        attack: 10,
        ac: 12,
        moveRate: 1,
      }

      const instance: MonsterInstance = {
        id: 'combat-monster-v2-1',
        templateId: 'combat-monster-v2',
        position: { row: 10, col: 15 },
        currentHP: 50,
        uiSlot: 1,
        inCombatSlot: true,
      }

      const hydrated = hydrateMonster(template, instance)

      expect(hydrated.uiSlot).toBe(1)
      expect(hydrated.inCombatSlot).toBe(true)
    })

    it('should allow instance to override template zIndex', () => {
      const template: MonsterTemplate = {
        kind: 'monster',
        shortName: 'z-monster-v2',
        category: 'monster',
        name: 'Z Monster V2',
        maxHP: 30,
        attack: 5,
        ac: 8,
        moveRate: 1,
        zIndex: 10,
      }

      const instance: MonsterInstance = {
        id: 'z-monster-v2-1',
        templateId: 'z-monster-v2',
        position: { row: 5, col: 5 },
        currentHP: 30,
        zIndex: 20, // Override
      }

      const hydrated = hydrateMonster(template, instance)

      expect(hydrated.zIndex).toBe(20)
    })
  })

  describe('hydrateGreatPower', () => {
    it('should merge great power template and instance correctly', () => {
      const template: GreatPowerTemplate = {
        kind: 'greatPower',
        shortName: 'great-power-v2',
        category: 'greatpower',
        name: 'Great Power V2',
        maxHP: 100,
        attack: 20,
        ac: 18,
        awakenCondition: 'defeat_all_monsters',
      }

      const instance: GreatPowerInstance = {
        id: 'great-power-v2-1',
        templateId: 'great-power-v2',
        position: { row: 30, col: 30 },
        currentHP: 80,
        awakened: false,
      }

      const hydrated = hydrateGreatPower(template, instance)

      expect(hydrated.id).toBe('great-power-v2-1')
      expect(hydrated.templateId).toBe('great-power-v2')
      expect(hydrated.position).toEqual({ row: 30, col: 30 })
      expect(hydrated.shortName).toBe('great-power-v2')
      expect(hydrated.name).toBe('Great Power V2')
      expect(hydrated.maxHP).toBe(100)
      expect(hydrated.currentHP).toBe(80)
      expect(hydrated.attack).toBe(20)
      expect(hydrated.ac).toBe(18)
      expect(hydrated.awakened).toBe(false)
      expect(hydrated.awakenCondition).toBe('defeat_all_monsters')
    })

    it('should handle awakened state in instance', () => {
      const template: GreatPowerTemplate = {
        kind: 'greatPower',
        shortName: 'awakened-power-v2',
        category: 'greatpower',
        name: 'Awakened Power V2',
        maxHP: 150,
        attack: 25,
        ac: 20,
        awakenCondition: 'player_reaches_position',
      }

      const instance: GreatPowerInstance = {
        id: 'awakened-power-v2-1',
        templateId: 'awakened-power-v2',
        position: { row: 40, col: 40 },
        currentHP: 150,
        awakened: true, // Awakened
      }

      const hydrated = hydrateGreatPower(template, instance)

      expect(hydrated.awakened).toBe(true)
    })
  })

  describe('hydrateMonsters', () => {
    it('should batch hydrate multiple monsters', () => {
      const templates = new Map<string, MonsterTemplate>([
        [
          'monster-v2-a',
          {
            kind: 'monster',
            shortName: 'monster-v2-a',
            category: 'monster',
            name: 'Monster V2 A',
            maxHP: 40,
            attack: 8,
            ac: 10,
            moveRate: 1,
          },
        ],
        [
          'monster-v2-b',
          {
            kind: 'monster',
            shortName: 'monster-v2-b',
            category: 'monster',
            name: 'Monster V2 B',
            maxHP: 60,
            attack: 12,
            ac: 14,
            moveRate: 2,
          },
        ],
      ])

      const instances: MonsterInstance[] = [
        {
          id: 'monster-v2-a-1',
          templateId: 'monster-v2-a',
          position: { row: 8, col: 8 },
          currentHP: 30,
        },
        {
          id: 'monster-v2-b-1',
          templateId: 'monster-v2-b',
          position: { row: 16, col: 16 },
          currentHP: 60,
        },
      ]

      const hydrated = hydrateMonsters(templates, instances)

      expect(hydrated).toHaveLength(2)
      expect(hydrated[0].name).toBe('Monster V2 A')
      expect(hydrated[0].currentHP).toBe(30)
      expect(hydrated[1].name).toBe('Monster V2 B')
      expect(hydrated[1].currentHP).toBe(60)
    })

    it('should throw error if monster template not found', () => {
      const templates = new Map<string, MonsterTemplate>()
      const instances: MonsterInstance[] = [
        {
          id: 'missing-v2-1',
          templateId: 'missing-monster-v2',
          position: { row: 1, col: 1 },
          currentHP: 10,
        },
      ]

      expect(() => hydrateMonsters(templates, instances)).toThrow(
        'Template not found: missing-monster-v2'
      )
    })
  })

  describe('hydrateGreatPowers', () => {
    it('should batch hydrate multiple great powers', () => {
      const templates = new Map<string, GreatPowerTemplate>([
        [
          'power-v2-a',
          {
            kind: 'greatPower',
            shortName: 'power-v2-a',
            category: 'greatpower',
            name: 'Power V2 A',
            maxHP: 100,
            attack: 20,
            ac: 18,
            awakenCondition: 'condition_a',
          },
        ],
        [
          'power-v2-b',
          {
            kind: 'greatPower',
            shortName: 'power-v2-b',
            category: 'greatpower',
            name: 'Power V2 B',
            maxHP: 120,
            attack: 22,
            ac: 20,
            awakenCondition: 'condition_b',
          },
        ],
      ])

      const instances: GreatPowerInstance[] = [
        {
          id: 'power-v2-a-1',
          templateId: 'power-v2-a',
          position: { row: 50, col: 50 },
          currentHP: 90,
          awakened: false,
        },
        {
          id: 'power-v2-b-1',
          templateId: 'power-v2-b',
          position: { row: 60, col: 60 },
          currentHP: 120,
          awakened: true,
        },
      ]

      const hydrated = hydrateGreatPowers(templates, instances)

      expect(hydrated).toHaveLength(2)
      expect(hydrated[0].name).toBe('Power V2 A')
      expect(hydrated[0].currentHP).toBe(90)
      expect(hydrated[0].awakened).toBe(false)
      expect(hydrated[1].name).toBe('Power V2 B')
      expect(hydrated[1].currentHP).toBe(120)
      expect(hydrated[1].awakened).toBe(true)
    })

    it('should throw error if great power template not found', () => {
      const templates = new Map<string, GreatPowerTemplate>()
      const instances: GreatPowerInstance[] = [
        {
          id: 'missing-power-v2-1',
          templateId: 'missing-power-v2',
          position: { row: 1, col: 1 },
          currentHP: 100,
          awakened: false,
        },
      ]

      expect(() => hydrateGreatPowers(templates, instances)).toThrow(
        'Template not found: missing-power-v2'
      )
    })
  })
})
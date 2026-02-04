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
  hydrateMonsterV2,
  hydrateGreatPowerV2,
  hydrateMonstersV2,
  hydrateGreatPowersV2,
  hydratedGreatPowerV2ToGreatPower,
} from '../hydration'
import {
  GameObjectTemplate,
  ObjectInstance,
  MonsterTemplateV2,
  MonsterInstanceV2,
  GreatPowerTemplateV2,
  GreatPowerInstanceV2,
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

  describe('hydrateMonsterV2 (legacy compatibility)', () => {
    it('should merge monster template and instance correctly', () => {
      const template: MonsterTemplateV2 = {
        kind: 'monster',
        shortName: 'test-monster',
        category: 'monster',
        name: 'Test Monster',
        maxHP: 50,
        attack: 10,
        ac: 12,
        moveRate: 1,
      }

      const instance: MonsterInstanceV2 = {
        id: 'test-monster-1',
        templateId: 'test-monster',
        position: { row: 15, col: 20 },
        currentHP: 30, // Damaged
      }

      const hydrated = hydrateMonsterV2(template, instance)

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
      const template: MonsterTemplateV2 = {
        kind: 'monster',
        shortName: 'spawnable-monster',
        category: 'monster',
        name: 'Spawnable Monster',
        maxHP: 40,
        attack: 8,
        ac: 10,
        moveRate: 2,
      }

      const instance: MonsterInstanceV2 = {
        id: 'spawnable-monster-1',
        templateId: 'spawnable-monster',
        position: { row: 8, col: 12 },
        currentHP: 40,
        spawned: true,
        spawnZoneId: 'zone-1',
      }

      const hydrated = hydrateMonsterV2(template, instance)

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

  describe('hydrateMonstersV2 (legacy compatibility)', () => {
    it('should batch hydrate multiple monsters', () => {
      const templates = new Map<string, MonsterTemplateV2>([
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

      const instances: MonsterInstanceV2[] = [
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

      const hydrated = hydrateMonstersV2(templates, instances)

      expect(hydrated).toHaveLength(2)
      expect(hydrated[0].name).toBe('Monster A')
      expect(hydrated[0].currentHP).toBe(20)
      expect(hydrated[1].name).toBe('Monster B')
      expect(hydrated[1].currentHP).toBe(50)
    })

    it('should throw error if monster template not found', () => {
      const templates = new Map<string, MonsterTemplateV2>()
      const instances: MonsterInstanceV2[] = [
        {
          id: 'missing-1',
          templateId: 'missing-monster',
          position: { row: 1, col: 1 },
          currentHP: 10,
        },
      ]

      expect(() => hydrateMonstersV2(templates, instances)).toThrow(
        'Template not found: missing-monster'
      )
    })
  })

  // ===== V2 Hydration Tests =====

  describe('hydrateMonsterV2', () => {
    it('should merge monster template V2 and instance V2 correctly', () => {
      const template: MonsterTemplateV2 = {
        kind: 'monster',
        shortName: 'test-monster-v2',
        category: 'monster',
        name: 'Test Monster V2',
        maxHP: 60,
        attack: 12,
        ac: 14,
        moveRate: 2,
      }

      const instance: MonsterInstanceV2 = {
        id: 'test-monster-v2-1',
        templateId: 'test-monster-v2',
        position: { row: 20, col: 25 },
        currentHP: 40, // Damaged
      }

      const hydrated = hydrateMonsterV2(template, instance)

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

    it('should include UI and combat slots from instance V2', () => {
      const template: MonsterTemplateV2 = {
        kind: 'monster',
        shortName: 'combat-monster-v2',
        category: 'monster',
        name: 'Combat Monster V2',
        maxHP: 50,
        attack: 10,
        ac: 12,
        moveRate: 1,
      }

      const instance: MonsterInstanceV2 = {
        id: 'combat-monster-v2-1',
        templateId: 'combat-monster-v2',
        position: { row: 10, col: 15 },
        currentHP: 50,
        uiSlot: 1,
        inCombatSlot: true,
      }

      const hydrated = hydrateMonsterV2(template, instance)

      expect(hydrated.uiSlot).toBe(1)
      expect(hydrated.inCombatSlot).toBe(true)
    })

    it('should allow instance V2 to override template zIndex', () => {
      const template: MonsterTemplateV2 = {
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

      const instance: MonsterInstanceV2 = {
        id: 'z-monster-v2-1',
        templateId: 'z-monster-v2',
        position: { row: 5, col: 5 },
        currentHP: 30,
        zIndex: 20, // Override
      }

      const hydrated = hydrateMonsterV2(template, instance)

      expect(hydrated.zIndex).toBe(20)
    })
  })

  describe('hydrateGreatPowerV2', () => {
    it('should merge great power template V2 and instance V2 correctly', () => {
      const template: GreatPowerTemplateV2 = {
        kind: 'greatPower',
        shortName: 'great-power-v2',
        category: 'greatpower',
        name: 'Great Power V2',
        maxHP: 100,
        attack: 20,
        ac: 18,
        awakenCondition: 'defeat_all_monsters',
      }

      const instance: GreatPowerInstanceV2 = {
        id: 'great-power-v2-1',
        templateId: 'great-power-v2',
        position: { row: 30, col: 30 },
        currentHP: 80,
        awakened: false,
      }

      const hydrated = hydrateGreatPowerV2(template, instance)

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

    it('should handle awakened state in instance V2', () => {
      const template: GreatPowerTemplateV2 = {
        kind: 'greatPower',
        shortName: 'awakened-power-v2',
        category: 'greatpower',
        name: 'Awakened Power V2',
        maxHP: 150,
        attack: 25,
        ac: 20,
        awakenCondition: 'player_reaches_position',
      }

      const instance: GreatPowerInstanceV2 = {
        id: 'awakened-power-v2-1',
        templateId: 'awakened-power-v2',
        position: { row: 40, col: 40 },
        currentHP: 150,
        awakened: true, // Awakened
      }

      const hydrated = hydrateGreatPowerV2(template, instance)

      expect(hydrated.awakened).toBe(true)
    })
  })

  describe('hydrateMonstersV2', () => {
    it('should batch hydrate multiple monsters V2', () => {
      const templates = new Map<string, MonsterTemplateV2>([
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

      const instances: MonsterInstanceV2[] = [
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

      const hydrated = hydrateMonstersV2(templates, instances)

      expect(hydrated).toHaveLength(2)
      expect(hydrated[0].name).toBe('Monster V2 A')
      expect(hydrated[0].currentHP).toBe(30)
      expect(hydrated[1].name).toBe('Monster V2 B')
      expect(hydrated[1].currentHP).toBe(60)
    })

    it('should throw error if monster template V2 not found', () => {
      const templates = new Map<string, MonsterTemplateV2>()
      const instances: MonsterInstanceV2[] = [
        {
          id: 'missing-v2-1',
          templateId: 'missing-monster-v2',
          position: { row: 1, col: 1 },
          currentHP: 10,
        },
      ]

      expect(() => hydrateMonstersV2(templates, instances)).toThrow(
        'Template not found: missing-monster-v2'
      )
    })
  })

  describe('hydrateGreatPowersV2', () => {
    it('should batch hydrate multiple great powers V2', () => {
      const templates = new Map<string, GreatPowerTemplateV2>([
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

      const instances: GreatPowerInstanceV2[] = [
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

      const hydrated = hydrateGreatPowersV2(templates, instances)

      expect(hydrated).toHaveLength(2)
      expect(hydrated[0].name).toBe('Power V2 A')
      expect(hydrated[0].currentHP).toBe(90)
      expect(hydrated[0].awakened).toBe(false)
      expect(hydrated[1].name).toBe('Power V2 B')
      expect(hydrated[1].currentHP).toBe(120)
      expect(hydrated[1].awakened).toBe(true)
    })

    it('should throw error if great power template V2 not found', () => {
      const templates = new Map<string, GreatPowerTemplateV2>()
      const instances: GreatPowerInstanceV2[] = [
        {
          id: 'missing-power-v2-1',
          templateId: 'missing-power-v2',
          position: { row: 1, col: 1 },
          currentHP: 100,
          awakened: false,
        },
      ]

      expect(() => hydrateGreatPowersV2(templates, instances)).toThrow(
        'Template not found: missing-power-v2'
      )
    })
  })

  describe('hydratedGreatPowerV2ToGreatPower', () => {
    it('should convert HydratedGreatPowerV2 to GreatPower format', () => {
      const template: GreatPowerTemplateV2 = {
        kind: 'greatPower',
        shortName: 'test-power',
        category: 'greatPower',
        name: 'Test Power',
        description: 'A test great power',
        maxHP: 500,
        attack: 25,
        ac: 20,
        awakenCondition: 'player_nearby',
      }

      const instance: GreatPowerInstanceV2 = {
        id: 'test-power-1',
        templateId: 'test-power',
        position: { row: 100, col: 100 },
        currentHP: 450,
        awakened: true,
      }

      const hydrated = hydrateGreatPowerV2(template, instance)
      const greatPower = hydratedGreatPowerV2ToGreatPower(hydrated)

      expect(greatPower.id).toBe('test-power-1')
      expect(greatPower.position).toEqual({ row: 100, col: 100 })
      expect(greatPower.hp).toBe(450) // currentHP mapped to hp
      expect(greatPower.maxHP).toBe(500)
      expect(greatPower.attack).toBe(25)
      expect(greatPower.ac).toBe(20)
      expect(greatPower.awakened).toBe(true)
      expect(greatPower.awakenCondition).toBe('player_nearby')
      expect(greatPower.active).toBe(true) // Default runtime state
    })

    it('should normalize null/undefined currentHP to maxHP', () => {
      const template: GreatPowerTemplateV2 = {
        kind: 'greatPower',
        shortName: 'power-with-null-hp',
        category: 'greatPower',
        name: 'Power with Null HP',
        maxHP: 300,
        attack: 15,
        ac: 18,
        awakenCondition: 'player_in_range',
      }

      const instance: GreatPowerInstanceV2 = {
        id: 'power-1',
        templateId: 'power-with-null-hp',
        position: { row: 50, col: 50 },
        currentHP: null as any, // Simulate null currentHP
        awakened: false,
      }

      const hydrated = hydrateGreatPowerV2(template, instance)
      const greatPower = hydratedGreatPowerV2ToGreatPower(hydrated)

      expect(greatPower.hp).toBe(300) // Should default to maxHP
    })

    it('should preserve optional fields from template', () => {
      const template: GreatPowerTemplateV2 = {
        kind: 'greatPower',
        shortName: 'power-with-extras',
        category: 'greatPower',
        name: 'Power with Extras',
        maxHP: 400,
        attack: 20,
        ac: 19,
        awakenCondition: 'always',
        width: 8,
        height: 8,
        effects: [{ type: 'soulsuck' }],
      }

      const instance: GreatPowerInstanceV2 = {
        id: 'power-extras-1',
        templateId: 'power-with-extras',
        position: { row: 75, col: 75 },
        currentHP: 400,
        awakened: false,
      }

      const hydrated = hydrateGreatPowerV2(template, instance)
      const greatPower = hydratedGreatPowerV2ToGreatPower(hydrated)

      expect(greatPower.width).toBe(8)
      expect(greatPower.height).toBe(8)
      expect(greatPower.effects).toEqual([{ type: 'soulsuck' }])
    })
  })
})
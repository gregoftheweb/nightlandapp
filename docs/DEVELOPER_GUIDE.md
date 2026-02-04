# Night Land App - Architecture & Developer Guide

## Overview

This guide documents the architectural patterns for the Night Land game and provides guidelines for maintaining clean separation between configuration and runtime state.

---

## Architecture Principles

### 1. Separation of Concerns

**Config Layer** (`config/*`)

- Static game data (weapon stats, monster stats, level definitions)
- Tuning values (spawn rates, damage multipliers, heal rates)
- Templates (building types, item types, etc.)
- **NEVER** contains runtime state

**Runtime Layer** (`modules/*`)

- Game state initialization
- State mutations via reducers
- Game systems (combat, movement, turns, effects)
- References config data but doesn't duplicate it

**Constants Layer** (`constants/*`)

- UI constants (HUD height, timing values)
- Magic numbers extracted for clarity
- Values that truly never change

### 2. Single Source of Truth

Each piece of data should have **one authoritative source**:

```typescript
// ✅ GOOD: Reference config
import { gameConfig } from '../config/gameConfig'

const state = {
  gridWidth: gameConfig.grid.width, // References config
  gridHeight: gameConfig.grid.height,
}

// ❌ BAD: Duplicate data
const state = {
  gridWidth: 400, // Hardcoded duplicate!
  gridHeight: 400,
}
```

### 3. No Circular Dependencies

**Import Hierarchy:**

```
modules/* → config/* → config/types.ts
    ↓           ↓
constants/*  (can't import modules)
```

---

## File Organization

### Current Structure (After Refactoring)

```
/config
  ├── weapons.ts          # Weapon catalog (RECENTLY ADDED)
  ├── monsters.ts         # Monster templates
  ├── player.ts           # Player config
  ├── objects.ts          # Buildings, consumables, collectibles
  ├── levels.ts           # Level definitions & factories
  ├── gameConfig.ts       # Tuning values (grid, combat, UI, audio, save)
  └── types.ts            # Shared TypeScript types

/constants
  ├── Game.ts             # UI, timing, combat, spawn constants
  └── Colors.ts           # Color palette

/modules
  ├── gameState.ts        # State initialization (CLEANED)
  ├── reducers.ts         # State mutations
  ├── combat.ts           # Combat system
  ├── movement.ts         # Movement system
  ├── turnManager.ts      # Turn system
  ├── effects.ts          # Effects system
  └── ...other systems
```

---

## What Goes Where?

### Adding New Config Data

| Type of Data  | Where It Goes          | Example                                   |
| ------------- | ---------------------- | ----------------------------------------- |
| Weapon stats  | `config/weapons.ts`    | damage, hitBonus, projectileColor         |
| Monster stats | `config/monsters.ts`   | hp, attack, ac, moveRate                  |
| Level data    | `config/levels.ts`     | monsters, items, objects, spawn zones     |
| Game tuning   | `config/gameConfig.ts` | maxAttackers, gridSize, healRate          |
| UI constants  | `constants/Game.ts`    | HUD_HEIGHT, MOVEMENT_INTERVAL             |
| Runtime state | `modules/gameState.ts` | player position, combat status, inventory |

### Decision Tree

```
Is this data that changes during gameplay?
├─ YES → Runtime State (modules/gameState.ts or reducers.ts)
└─ NO → Is it a tuning/balance value?
    ├─ YES → Config (config/gameConfig.ts or specific config file)
    └─ NO → Is it a UI/timing constant?
        ├─ YES → Constants (constants/Game.ts)
        └─ NO → Probably belongs in config/*
```

---

## Common Patterns

### Pattern 1: Config + Runtime Instance

```typescript
// config/monsters.ts - TEMPLATE
export const monsters: MonsterTemplateV2[] = [
  {
    shortName: 'abhuman',
    maxHP: 12,
    attack: 5,
    // ... static template data
  },
]

// modules/gameState.ts - RUNTIME INSTANCE
import { levels } from '../config/levels'

const state = {
  monsters: levelConfig.monsters || [], // Runtime instances
  // These will have positions, current HP, etc.
}
```

### Pattern 2: Centralized Tuning

```typescript
// config/gameConfig.ts - AUTHORITATIVE
export const gameConfig = {
  combat: {
    maxAttackers: 4,
  },
  grid: {
    width: 400,
    height: 400,
  },
}

// modules/gameState.ts - REFERENCE
import { gameConfig } from '../config/gameConfig'

const state = {
  maxAttackers: gameConfig.combat.maxAttackers, // ✅
  gridWidth: gameConfig.grid.width, // ✅
}
```

### Pattern 3: Factory Functions

```typescript
// config/levels.ts - FACTORY
export const createItemInstance = (
  templateShortName: string,
  position: Position,
  overrides: Partial<Item> = {}
): Item => {
  const template = getWeaponTemplate(templateShortName)
  return {
    ...template,
    position,
    id: `${template.shortName}_${position.row}_${position.col}`,
    ...overrides,
  }
}
```

---

## Recent Changes (2026-01-17)

### What Was Refactored

1. **Weapons Extraction**
   - Created `config/weapons.ts` with `weaponsCatalog`
   - Removed 55+ lines of hardcoded weapons from `gameState.ts`
   - Added helper functions: `getWeaponById`, `getWeaponByShortName`, etc.

2. **Config Consolidation**
   - `gridWidth/gridHeight` now reference `gameConfig.grid.width/height`
   - `maxAttackers` now references `gameConfig.combat.maxAttackers`
   - `saveVersion` now references `gameConfig.save.version`

### Impact

- ✅ No breaking changes (all exports remain the same)
- ✅ Single source of truth for weapons
- ✅ Easier to balance game (edit one file)
- ✅ Better separation of concerns

---

## Best Practices

### DO ✅

```typescript
// Import and reference config
import { weaponsCatalog } from '../config/weapons'
import { gameConfig } from '../config/gameConfig'

const state = {
  weapons: weaponsCatalog,
  maxAttackers: gameConfig.combat.maxAttackers,
}
```

### DON'T ❌

```typescript
// Hardcode config values
const state = {
  weapons: [{ id: "weapon-1", damage: 10, ... }],  // ❌ Hardcoded
  maxAttackers: 4,  // ❌ Magic number
};
```

### Adding a New Weapon

```typescript
// 1. Add to config/weapons.ts
export const weaponsCatalog: Item[] = [
  // ... existing weapons
  {
    id: 'weapon-flamethrower-003',
    category: 'weapon',
    shortName: 'flamethrower',
    name: 'Flamethrower',
    description: 'A weapon that spews fire.',
    damage: 15,
    hitBonus: 1,
    type: 'weapon',
    weaponType: 'ranged',
    collectible: true,
    projectileColor: '#FF4500',
  },
]

// 2. That's it! The weapon is now available throughout the game
```

### Adding a New Config Value

```typescript
// 1. Add to config/gameConfig.ts
export const gameConfig = {
  // ... existing config
  experience: {
    baseXP: 100,
    multiplierPerLevel: 1.5,
  },
}

// 2. Reference in gameState or systems
import { gameConfig } from '../config/gameConfig'

const calculateXPNeeded = (level: number) => {
  return (
    gameConfig.experience.baseXP * Math.pow(gameConfig.experience.multiplierPerLevel, level - 1)
  )
}
```

---

## Testing Strategy

### Unit Tests

Test runtime logic separately from config:

```typescript
// modules/__tests__/selfHealing.test.ts
const createMockGameState = (playerHP: number, turnsPerHitPoint: number = 5): GameState => {
  // Mock state with config values as parameters
  // This allows testing different config scenarios
}
```

### Integration Tests

Test that config values flow correctly:

```typescript
test('should use weapons from weaponsCatalog', () => {
  const state = createInitialGameState()
  expect(state.weapons).toBe(weaponsCatalog)
  expect(state.weapons.length).toBeGreaterThan(0)
})
```

---

## Future Improvements

### Potential Additions (Not Implemented Yet)

1. **Progression System**
   - Create `config/progression.ts`
   - Define XP curves, level caps, stat growth

2. **AI Behavior Trees**
   - Create `config/ai.ts`
   - Define monster behavior patterns

3. **Loot Tables**
   - Create `config/loot.ts`
   - Define drop rates, item pools

4. **Balance Sheet**
   - Create `config/balance.ts`
   - Consolidate all numeric tuning in one place

### Migration Path

If you want to add these:

```typescript
// config/progression.ts
export const progressionConfig = {
  xpCurve: {
    baseXP: 100,
    exponent: 1.5,
  },
  levelCap: 50,
  statGrowth: {
    hpPerLevel: 10,
    attackPerLevel: 1,
  },
}
```

---

## Troubleshooting

### "Cannot find module" Errors

Make sure imports use correct relative paths:

```typescript
// From modules/* to config/*
import { weaponsCatalog } from '../config/weapons'

// From config/* to config/*
import { Item } from './types'
```

### Circular Dependencies

If you get circular import errors:

1. Check the import hierarchy (modules → config → types)
2. Extract shared types to `config/types.ts`
3. Never import from `modules/*` in `config/*`

### State Not Updating

Make sure you're mutating state via reducers:

```typescript
// ✅ GOOD
dispatch({ type: 'UPDATE_PLAYER', payload: { hp: newHP } })

// ❌ BAD
state.player.hp = newHP // Direct mutation!
```

---

## Quick Reference

### Key Files

| File                   | Purpose           | What to Add         |
| ---------------------- | ----------------- | ------------------- |
| `config/weapons.ts`    | Weapon catalog    | New weapons         |
| `config/monsters.ts`   | Monster templates | New monsters        |
| `config/gameConfig.ts` | Tuning values     | Balance changes     |
| `config/levels.ts`     | Level definitions | New levels          |
| `modules/gameState.ts` | State init        | Runtime state shape |
| `modules/reducers.ts`  | State mutations   | New actions         |

### Helper Functions

```typescript
// Weapons
getWeaponById(id: string): Item | undefined
getWeaponByShortName(name: string): Item | undefined
getMeleeWeapons(): Item[]
getRangedWeapons(): Item[]

// Monsters
getMonsterTemplate(shortName: string): MonsterTemplateV2 | undefined
getGreatPowerTemplate(shortName: string): GreatPower | undefined

// Objects
getBuildingTemplate(shortName: string): GameObject | undefined
getWeaponTemplate(shortName: string): GameObject | undefined
getConsumableTemplate(shortName: string): GameObject | undefined
```

---

## Summary

This architecture provides:

- ✅ Clear separation between config and runtime state
- ✅ Single source of truth for all data
- ✅ Easy to modify game balance
- ✅ Maintainable and scalable structure
- ✅ No circular dependencies

When in doubt: **Config data goes in `config/*`, runtime state goes in `modules/*`**.

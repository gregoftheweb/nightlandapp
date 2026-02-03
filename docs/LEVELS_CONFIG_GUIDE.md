# Levels Configuration Quick Reference

A developer's guide to working with the improved levels configuration system.

---

## Table of Contents

1. [Adding a New Level](#adding-a-new-level)
2. [Creating Spawn Tables](#creating-spawn-tables)
3. [Defining Biome Presets](#defining-biome-presets)
4. [Type Reference](#type-reference)
5. [Common Patterns](#common-patterns)
6. [Validation](#validation)

---

## Adding a New Level

### Step 1: Add the Level ID

```typescript
// config/levelTypes.ts
export type LevelId = '1' | '2' | '3' // Add "3"
```

### Step 2: Define the Level

```typescript
// config/levels.ts
export const levels: Record<LevelId, Level> = {
  '1': {
    /* ... */
  },
  '2': {
    /* ... */
  },

  // Add new level
  '3': {
    id: '3',
    name: 'Cursed Forest',
    description: 'A dark forest shrouded in ash.',
    boardSize: { width: 500, height: 500 },
    playerSpawn: { row: 480, col: 250 },

    // Use biome preset (optional)
    biome: 'cursed_forest',

    // Or set manually
    ambientLight: 0.1,
    weatherEffect: 'ash_fall',
    backgroundMusic: 'nightland_ambient',
    turnsPerHitPoint: 5,

    // Entities
    items: [createItemInstance('healthPotion', { row: 450, col: 250 })],

    monsters: loadSpawnTable('wasteland_common', createMonsterInstance),

    objects: [createObjectInstance('cursedTotem', { row: 300, col: 250 })],

    // Optional
    nonCollisionObjects: [],
    greatPowers: [],

    completionConditions: [
      {
        type: 'reach_position',
        position: { row: 50, col: 250 },
        description: 'Escape the forest',
      },
    ],
  },
}
```

### Step 3: Update Validation Array

```typescript
// config/levels.ts (end of file)
;[levels['1'], levels['2'], levels['3']].forEach(validateLevel)
```

---

## Creating Spawn Tables

### Define a New Spawn Table

```typescript
// config/levelPresets.ts

// 1. Add the ID type
export type SpawnTableId =
  | 'wasteland_common'
  | 'forest_common' // NEW
  | 'forest_boss' // NEW

// 2. Define the spawn config
export const SPAWN_TABLES: Record<SpawnTableId, SpawnConfig[]> = {
  wasteland_common: [
    /* ... */
  ],

  forest_common: [
    { monsterShortName: 'cursed_tree', spawnRate: 0.05, maxInstances: 4 },
    { monsterShortName: 'ash_wraith', spawnRate: 0.03, maxInstances: 2 },
  ],

  forest_boss: [{ monsterShortName: 'forest_guardian', spawnRate: 0.01, maxInstances: 1 }],
}
```

### Use the Spawn Table

```typescript
// config/levels.ts
"3": {
  monsters: loadSpawnTable("forest_common", createMonsterInstance),
  // ...
}
```

### Override Individual Monster Properties

If you need level-specific monster tweaks:

```typescript
"3": {
  monsters: [
    ...loadSpawnTable("forest_common", createMonsterInstance),
    // Add level-specific monster
    createMonsterInstance("unique_boss", 0.5, 1),
  ],
}
```

---

## Defining Biome Presets

### Add a New Biome

```typescript
// config/levelTypes.ts
export type BiomeId = 'dark_wastes' | 'cursed_forest' | 'frozen_wastes' // NEW

// config/levelPresets.ts
export const BIOME_PRESETS: Record<BiomeId, BiomePreset> = {
  dark_wastes: {
    /* ... */
  },
  cursed_forest: {
    /* ... */
  },

  frozen_wastes: {
    ambientLight: 0.25,
    weatherEffect: null,
    defaultMusic: 'nightland_ambient',
    description: 'Icy plains with better visibility.',
    palette: {
      tint: '#E0F0FF', // Bluish tint (future use)
    },
  },
}
```

### Use Biome in Level

```typescript
"4": {
  id: "4",
  name: "Frozen Wastes",
  biome: "frozen_wastes",  // Auto-applies preset
  // Override if needed:
  backgroundMusic: "combat_theme",  // Override default
}
```

---

## Type Reference

### Level IDs

```typescript
type LevelId = "1" | "2" | "3" | ...;
```

### Biome IDs

```typescript
type BiomeId = 'dark_wastes' | 'watching_grounds' | 'cursed_forest' | 'ancient_ruins'
```

### Weather Effects

```typescript
type WeatherEffect = 'clear' | 'mist' | 'ash_fall' | 'blood_rain' | null
```

### Music Tracks

```typescript
type MusicTrackId = 'nightland_ambient' | 'watching_grounds' | 'combat_theme' | 'boss_theme'
```

### Lighting Presets

```typescript
type LightingPreset = 'pitch_black' | 'very_dim' | 'dim' | 'moderate' | 'bright'

// Numeric values
LIGHTING_VALUES = {
  pitch_black: 0.05,
  very_dim: 0.1,
  dim: 0.15,
  moderate: 0.2,
  bright: 0.3,
}
```

### Spawn Table IDs

```typescript
type SpawnTableId =
  | 'wasteland_common'
  | 'wasteland_rare'
  | 'wasteland_boss'
  | 'grounds_common'
  | 'grounds_rare'
```

---

## Common Patterns

### Pattern 1: Reuse Spawn Table with Additional Monsters

```typescript
monsters: [
  ...loadSpawnTable("wasteland_common", createMonsterInstance),
  createMonsterInstance("special_enemy", 0.05, 1),
],
```

### Pattern 2: Use Biome with Overrides

```typescript
{
  id: "5",
  name: "Cursed Ruins",
  biome: "ancient_ruins",  // Base preset
  ambientLight: 0.15,      // Override to be darker
  // weatherEffect and music from biome
}
```

### Pattern 3: Level Progression Chain

```typescript
"4": {
  requiredLevel: 3,      // Must be level 3 to enter
  recommendedLevel: 4,   // Recommended for level 4
  experienceReward: 300, // XP on completion
}
```

### Pattern 4: Create Path with Footsteps

```typescript
nonCollisionObjects: [
  createNonCollisionObject('footsteps', { row: 100, col: 100 }, 0),
  createNonCollisionObject('footsteps', { row: 95, col: 100 }, 0),
  createNonCollisionObject('footsteps', { row: 90, col: 100 }, 0),
  // ... more footsteps
]
```

### Pattern 5: Complex River with Collision Mask

```typescript
nonCollisionObjects: [
  createNonCollisionObject('river', { row: 200, col: 100 }, 0, {
    width: 20,
    height: 10,
    collisionMask: [
      { row: 0, col: 0, width: 5, height: 2 },
      { row: 2, col: 3, width: 8, height: 1 },
      // ... more collision zones
    ],
    collisionEffects: [
      {
        type: 'heal',
        value: 5,
        description: 'The river heals you.',
      },
    ],
  }),
]
```

---

## Validation

### Automatic Validation

All levels are validated on module load. Validation checks:

- Player spawn is within board bounds
- Objects are within board bounds

### Add Custom Validation

```typescript
// config/levelHelpers.ts

export function validateLevel(level: Level): void {
  // Existing validations...

  // Add new validation
  if (level.completionConditions && level.completionConditions.length === 0) {
    console.warn(`Level ${level.id}: No completion conditions defined`)
  }

  // Check for overlapping objects (future)
  // validateNoOverlaps(level.objects);
}
```

### Manual Level Lookup

```typescript
// Type-safe lookup
import { getLevel } from '@config/levels'

const level = getLevel('1') // Type-safe, throws if not found

// Direct access (also type-safe now)
import { levels } from '@config/levels'
const level = levels['1'] // TypeScript validates ID
```

---

## Helpers Reference

### createLevel()

```typescript
import { createLevel } from '@config/levelHelpers'

const level = createLevel({
  id: '3',
  name: 'Test Level',
  boardSize: { width: 400, height: 400 },
  playerSpawn: { row: 200, col: 200 },
  biome: 'dark_wastes', // Optional
  items: [],
  monsters: [],
  objects: [],
})
```

### loadSpawnTable()

```typescript
import { loadSpawnTable } from '@config/levelHelpers'

const monsters = loadSpawnTable('wasteland_common', createMonsterInstance)
```

### validateLevel()

```typescript
import { validateLevel } from '@config/levelHelpers'

validateLevel(myLevel) // Throws on validation error
```

### getLevel()

```typescript
import { getLevel } from '@config/levels'

const level = getLevel('1') // Type-safe
```

---

## Tips & Best Practices

### ✅ Do

- Use spawn tables for reusable encounter groups
- Use biome presets for consistent theming
- Add completion conditions to every level
- Validate coordinates are within bounds
- Use type-safe `getLevel()` for lookups
- Comment unusual positioning or special logic

### ❌ Don't

- Hardcode magic numbers - use named constants
- Duplicate spawn configs - create a spawn table
- Skip validation - always validate new levels
- Use plain strings for IDs - use typed IDs
- Import runtime state into config files

---

## Example: Complete New Level

```typescript
// 1. Add to levelTypes.ts
export type LevelId = "1" | "2" | "3";

// 2. Optionally add spawn table to levelPresets.ts
export const SPAWN_TABLES = {
  level3_encounters: [
    { monsterShortName: "shadow_beast", spawnRate: 0.06, maxInstances: 4 },
    { monsterShortName: "abhuman", spawnRate: 0.02, maxInstances: 2 },
  ],
};

// 3. Add level to levels.ts
"3": {
  id: "3",
  name: "Shadow Valley",
  description: "A valley consumed by darkness.",
  boardSize: { width: 600, height: 600 },
  playerSpawn: { row: 580, col: 300 },

  requiredLevel: 2,
  recommendedLevel: 3,
  experienceReward: 250,

  biome: "cursed_forest",

  items: [
    createItemInstance("healthPotion", { row: 500, col: 300 }),
    createItemInstance("ironSword", { row: 450, col: 250 }),
  ],

  monsters: loadSpawnTable("level3_encounters", createMonsterInstance),

  objects: [
    createObjectInstance("healingPool", { row: 300, col: 300 }),
  ],

  nonCollisionObjects: [],

  greatPowers: [],

  completionConditions: [
    {
      type: "defeat_all_monsters",
      description: "Clear the valley of all threats",
    },
    {
      type: "reach_position",
      position: { row: 50, col: 300 },
      description: "Find the northern exit",
    },
  ],
},

// 4. Update validation
[levels["1"], levels["2"], levels["3"]].forEach(validateLevel);
```

---

## Questions?

For architectural questions, see:

- `LEVELS_CONFIG_AUDIT.md` - Full audit report
- `LEVELS_REFACTOR_COMPARISON.md` - Before/after comparison
- `ARCHITECTURE_REVIEW.md` - Overall architecture guidelines

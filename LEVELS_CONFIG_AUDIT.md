# Levels.ts Configuration Audit & Recommendations

**Date:** 2026-01-17  
**Reviewer:** Senior TypeScript Game-Architecture Reviewer  
**Scope:** `config/levels.ts` structure, scalability, and clean separation of config vs runtime state

---

## 1. FINDINGS

### 1.1 Shape & Readability Issues

#### ✅ Strengths

- Clear helper functions (`createObjectInstance`, `createItemInstance`, `createMonsterInstance`, etc.)
- Template-based approach separates concerns between templates (in `objects.ts`, `monsters.ts`) and instances
- Position-based unique IDs prevent collisions
- Consistent use of templates across all entity types

#### ❌ Issues Found

**Issue 1: Magic String IDs**

- **Location:** Line 184: `export const levels: Record<string, Level>`
- **Problem:** Level IDs are plain strings (`"1"`, `"2"`), not typed/validated
- **Impact:** Typos like `levels["3"]` won't be caught at compile time
- **Example:**
  ```typescript
  // Current - no type safety
  const level = levels['typo'] // undefined at runtime
  ```

**Issue 2: Duplicated Configuration Patterns**

- **Location:** Lines 196, 351 - `turnsPerHitPoint: 5` repeated in both levels
- **Location:** Lines 206-208, 357-359 - Monster spawn patterns are inline and duplicated
- **Problem:** Common values (ambient light defaults, healing rates, spawn rate patterns) are not extracted
- **Impact:** Changing global defaults requires editing multiple levels

**Issue 3: Inline Complex Objects**

- **Location:** Lines 278-307 - Large river collision mask defined inline
- **Problem:** Complex collision masks and effect arrays buried in level config
- **Impact:** Hard to reuse, test, or validate collision patterns

**Issue 4: Inconsistent Field Presence**

- **Location:** Level "1" has `requiredLevel`, `recommendedLevel`, `experienceReward` missing
- **Location:** Level "2" has these fields present
- **Problem:** Optional fields not clearly documented as optional vs required
- **Impact:** Unclear which fields are needed for level progression

**Issue 5: Non-Collision Objects Array Size**

- **Location:** Lines 218-274 - 57 footstep objects with repetitive patterns
- **Problem:** Large array of similar objects creates noise
- **Impact:** Hard to visualize the path, difficult to edit

### 1.2 Normalization & Reuse Issues

**Missing Abstractions:**

1. **Biome/Theme Templates** - No concept of biome presets
   - Each level manually sets `ambientLight`, `weatherEffect`, `backgroundMusic`
   - Should have: `BiomePreset` with these bundled

2. **Encounter Tables** - Spawn configs are inline
   - Monster spawn rates/maxInstances defined per level
   - Should have: Named spawn presets like `"wasteland_common"`, `"wasteland_rare"`

3. **Lighting Presets** - Magic numbers for ambient light
   - `0.2`, `0.15` with no semantic meaning
   - Should have: Named constants like `LIGHT_DIM = 0.15`, `LIGHT_MODERATE = 0.2`

4. **Path Patterns** - Footsteps are manually positioned
   - Should have: Path generator helper or path templates

5. **Level Defaults** - No base template
   - Each level repeats common fields
   - Should have: `createLevel()` with defaults

### 1.3 Validation & Safety Issues

**Missing Type Safety:**

1. **No LevelId Type**

   ```typescript
   // Current
   export const levels: Record<string, Level> = { "1": {...} };

   // Should be
   export type LevelId = "1" | "2" | "3";
   export const levels: Record<LevelId, LevelConfig> = { "1": {...} };
   ```

2. **No BiomeId/PresetIds**
   - Weather effects are `string | null` - should be enum
   - Music IDs are strings - should be typed catalog

3. **No Runtime Validation**
   - Template lookups can return `undefined`
   - No validation that level data is complete
   - Monster/item template IDs not validated at build time

**Safety Concerns:**

1. **Template Lookup Failures**

   ```typescript
   // Line 26-29: throws at runtime
   const template = getBuildingTemplate(templateShortName)
   if (!template) throw new Error(`Building template ${templateShortName} not found`)
   ```

   - Good: Fails fast
   - Bad: Happens at initialization, could fail on production load

2. **Position Overlaps Not Validated**
   - No check if two objects occupy same position
   - No validation that spawn positions are within board bounds

### 1.4 Determinism & Progression Issues

**RNG & Spawning:**

- **Good:** Spawn rates are explicit decimals (`0.04`, `0.02`)
- **Missing:** No seed configuration for deterministic runs
- **Missing:** No difficulty curve documentation

**Progression:**

- Level "2" has `requiredLevel: 2`, `recommendedLevel: 3`
- Level "1" doesn't have these - unclear if intentional
- No documentation of intended progression path

**Tuning:**

- Spawn rates are scattered - hard to balance
- No central tuning file for encounter difficulty

### 1.5 Performance & Load Strategy

**Current State:**

- All levels loaded at module import time
- Both levels are small (~380 LOC total)
- All templates fetched eagerly

**Performance Analysis:**

- ✅ **OK for now:** 2 levels is trivial
- ⚠️ **Future concern:** If expanding to 50+ levels, need lazy loading
- ✅ **Good:** Template separation already enables code splitting

**Recommendations:**

1. Keep current approach until 10+ levels
2. When scaling, use dynamic imports:
   ```typescript
   const loadLevel = async (id: LevelId) => {
     const module = await import(`./levels/${id}.ts`)
     return module.level
   }
   ```

### 1.6 Import Analysis

**Dependencies:**

```typescript
import { ... } from "./types";      // ✅ Config types - good
import { ... } from "./objects";    // ✅ Templates - good
import { ... } from "./monsters";   // ✅ Templates - good
```

**No runtime imports - EXCELLENT ✅**

- No circular dependencies detected
- Config depends on types, not runtime state
- Clean separation maintained

---

## 2. PROPOSED IMPROVED STRUCTURE

### 2.1 File Organization

```
config/
├── types.ts                 # Core type definitions (existing)
├── gameConfig.ts            # Global tuning values (existing)
├── objects.ts               # Entity templates (existing)
├── monsters.ts              # Monster templates (existing)
├── weapons.ts               # Weapon catalog (existing)
├── player.ts                # Player config (existing)
│
├── levelTypes.ts            # NEW: Level-specific types & IDs
├── levelPresets.ts          # NEW: Biomes, lighting, spawn tables
├── levelHelpers.ts          # NEW: Factory functions with defaults
├── levels.ts                # IMPROVED: Cleaner level definitions
│
└── (future)
    ├── levels/
    │   ├── 1.ts             # Individual level files (when 10+ levels)
    │   ├── 2.ts
    │   └── index.ts
```

### 2.2 Key Type Definitions

**levelTypes.ts:**

```typescript
// Strict level identifiers
export type LevelId = '1' | '2'

// Biome/theme presets
export type BiomeId = 'dark_wastes' | 'watching_grounds' | 'cursed_forest' | 'ancient_ruins'

// Weather effects enum
export type WeatherEffect = 'clear' | 'mist' | 'ash_fall' | 'blood_rain' | null

// Lighting presets
export type LightingPreset = 'pitch_black' | 'very_dim' | 'dim' | 'moderate' | 'bright'

// Music track IDs
export type MusicTrackId = 'nightland_ambient' | 'watching_grounds' | 'combat_theme' | 'boss_theme'

// Spawn table IDs for reusable encounter groups
export type SpawnTableId =
  | 'wasteland_common'
  | 'wasteland_rare'
  | 'wasteland_boss'
  | 'grounds_common'
  | 'grounds_rare'

// Level configuration with stronger types
export interface LevelConfig extends Omit<Level, 'id'> {
  id: LevelId
  biome?: BiomeId
  weatherEffect: WeatherEffect
  backgroundMusic: MusicTrackId
  lighting?: LightingPreset
}
```

**levelPresets.ts:**

```typescript
import { LightingPreset, BiomeId, SpawnTableId, LevelMonsterInstance } from './levelTypes'

// Lighting value mappings
export const LIGHTING_VALUES: Record<LightingPreset, number> = {
  pitch_black: 0.05,
  very_dim: 0.1,
  dim: 0.15,
  moderate: 0.2,
  bright: 0.3,
}

// Biome presets bundle common settings
export interface BiomePreset {
  ambientLight: number
  weatherEffect: WeatherEffect
  defaultMusic: MusicTrackId
  palette?: {
    fog?: string
    tint?: string
  }
}

export const BIOME_PRESETS: Record<BiomeId, BiomePreset> = {
  dark_wastes: {
    ambientLight: 0.2,
    weatherEffect: null,
    defaultMusic: 'nightland_ambient',
  },
  watching_grounds: {
    ambientLight: 0.15,
    weatherEffect: 'mist',
    defaultMusic: 'watching_grounds',
  },
  cursed_forest: {
    ambientLight: 0.1,
    weatherEffect: 'ash_fall',
    defaultMusic: 'nightland_ambient',
  },
  ancient_ruins: {
    ambientLight: 0.25,
    weatherEffect: null,
    defaultMusic: 'nightland_ambient',
  },
}

// Reusable spawn configurations
export type SpawnConfig = {
  monsterShortName: string
  spawnRate: number
  maxInstances: number
}

export const SPAWN_TABLES: Record<SpawnTableId, SpawnConfig[]> = {
  wasteland_common: [
    { monsterShortName: 'abhuman', spawnRate: 0.04, maxInstances: 3 },
    { monsterShortName: 'night_hound', spawnRate: 0.02, maxInstances: 2 },
  ],
  wasteland_rare: [
    { monsterShortName: 'abhuman', spawnRate: 0.015, maxInstances: 1 },
    { monsterShortName: 'night_hound', spawnRate: 0.1, maxInstances: 6 },
  ],
  wasteland_boss: [],
  grounds_common: [
    { monsterShortName: 'night_hound', spawnRate: 0.1, maxInstances: 6 },
    { monsterShortName: 'abhuman', spawnRate: 0.015, maxInstances: 1 },
  ],
  grounds_rare: [],
}

// Common level defaults
export const LEVEL_DEFAULTS = {
  turnsPerHitPoint: 5,
  requiredLevel: 1,
  recommendedLevel: 1,
  experienceReward: 100,
  ambientLight: 0.2,
  weatherEffect: null as WeatherEffect,
  backgroundMusic: 'nightland_ambient' as MusicTrackId,
}
```

**levelHelpers.ts:**

```typescript
import { Level, LevelMonsterInstance } from './types'
import { LevelConfig, SpawnTableId, BiomeId } from './levelTypes'
import { BIOME_PRESETS, SPAWN_TABLES, LEVEL_DEFAULTS } from './levelPresets'
import { createMonsterInstance } from './levels' // Import existing helper

// Create level with defaults and biome presets
export function createLevel(
  config: Partial<LevelConfig> & {
    id: string
    name: string
    boardSize: { width: number; height: number }
    playerSpawn: Position
  }
): LevelConfig {
  const biome = config.biome ? BIOME_PRESETS[config.biome] : undefined

  return {
    ...LEVEL_DEFAULTS,
    ...config,
    // Override with biome if specified
    ...(biome && {
      ambientLight: biome.ambientLight,
      weatherEffect: biome.weatherEffect,
      backgroundMusic: config.backgroundMusic || biome.defaultMusic,
    }),
    items: config.items || [],
    monsters: config.monsters || [],
    objects: config.objects || [],
    greatPowers: config.greatPowers || [],
  } as LevelConfig
}

// Load monsters from spawn table
export function loadSpawnTable(tableId: SpawnTableId): LevelMonsterInstance[] {
  const configs = SPAWN_TABLES[tableId]
  return configs.map((cfg) =>
    createMonsterInstance(cfg.monsterShortName, cfg.spawnRate, cfg.maxInstances)
  )
}

// Validate level config at module load time
export function validateLevel(level: LevelConfig): void {
  const { boardSize, playerSpawn } = level

  if (playerSpawn.row < 0 || playerSpawn.row >= boardSize.height) {
    throw new Error(`Level ${level.id}: playerSpawn.row out of bounds`)
  }
  if (playerSpawn.col < 0 || playerSpawn.col >= boardSize.width) {
    throw new Error(`Level ${level.id}: playerSpawn.col out of bounds`)
  }

  // Validate objects are within bounds
  for (const obj of level.objects) {
    if (obj.position.row < 0 || obj.position.row >= boardSize.height) {
      throw new Error(`Level ${level.id}: Object ${obj.id} out of bounds`)
    }
  }

  // Could add more validations:
  // - Check for position overlaps
  // - Validate template IDs exist
  // - Check completion conditions are achievable
}
```

### 2.3 Example Refactored Level

**levels.ts (improved):**

```typescript
import { createLevel, loadSpawnTable, validateLevel } from './levelHelpers'
import { LevelId, LevelConfig } from './levelTypes'
import {
  createObjectInstance,
  createItemInstance,
  createGreatPowerForLevel,
  createNonCollisionObject,
} from './levels' // existing helpers

export const levels: Record<LevelId, LevelConfig> = {
  '1': createLevel({
    id: '1',
    name: 'The Dark Outer Wastes',
    description: 'The only lands known by the Monstruwacans...',
    boardSize: { width: 400, height: 400 },
    playerSpawn: { row: 395, col: 200 },
    biome: 'dark_wastes', // Auto-sets ambientLight, weather, music

    items: [
      createItemInstance('healthPotion', { row: 395, col: 195 }),
      createItemInstance('ironSword', { row: 380, col: 200 }),
      createItemInstance('maguffinRock', { row: 390, col: 210 }),
    ],

    // Use spawn table instead of inline config
    monsters: loadSpawnTable('wasteland_common'),

    objects: [
      createObjectInstance('redoubt', { row: 390, col: 198 }),
      createObjectInstance('healingPool', { row: 375, col: 20 }),
      createObjectInstance('poisonPool', { row: 250, col: 250 }),
      createObjectInstance('cursedTotem', { row: 385, col: 220 }),
      createObjectInstance('aeroWreckage', { row: 340, col: 298 }),
    ],

    // Keep existing nonCollisionObjects as-is for now
    // (Could extract path generation later)
    nonCollisionObjects: [
      // ... footsteps array ...
    ],

    greatPowers: [
      createGreatPowerForLevel(
        'watcher_se',
        { row: 380, col: 180 },
        {
          hp: 1000,
          maxHP: 1000,
          attack: 50,
          ac: 25,
        }
      ),
    ],

    completionConditions: [
      {
        type: 'reach_position',
        position: { row: 10, col: 200 },
        description: 'Reach the northern border',
      },
      {
        type: 'collect_item',
        itemId: 'ironSword',
        description: 'Find the iron sword',
      },
    ],
  }),

  '2': createLevel({
    id: '2',
    name: 'The Watching Grounds',
    description: 'Venture deeper into the Nightland...',
    boardSize: { width: 600, height: 500 },
    playerSpawn: { row: 590, col: 50 },
    requiredLevel: 2,
    recommendedLevel: 3,
    experienceReward: 250,
    biome: 'watching_grounds', // Auto-sets ambientLight, weather, music

    items: [],
    monsters: loadSpawnTable('grounds_common'),
    objects: [createObjectInstance('poisonPool', { row: 150, col: 150 })],
    greatPowers: [],

    completionConditions: [
      {
        type: 'defeat_all_monsters',
        description: 'Defeat all monsters in the area',
      },
      {
        type: 'reach_position',
        position: { row: 50, col: 550 },
        description: 'Reach the eastern exit',
      },
    ],
  }),
}

// Validate all levels at module load
Object.values(levels).forEach(validateLevel)

// Type-safe level lookup
export function getLevel(id: LevelId): LevelConfig {
  return levels[id]
}
```

---

## 3. REFACTOR PLAN (Incremental Steps)

### Phase 1: Add Type Safety (Non-Breaking)

**Goal:** Strengthen types without changing runtime behavior

**Step 1.1:** Create `levelTypes.ts`

- Add `LevelId`, `BiomeId`, `WeatherEffect`, `MusicTrackId` types
- Export from config/types.ts for backwards compatibility
- **Risk:** None - purely additive
- **Validation:** `tsc --noEmit`

**Step 1.2:** Update `levels.ts` export signature

```typescript
// Change
export const levels: Record<string, Level> = { ... };
// To
export const levels: Record<LevelId, Level> = { ... };
```

- **Risk:** Low - consumers already use correct IDs
- **Validation:** Compile check

**Step 1.3:** Add type-safe getLevel helper

```typescript
export function getLevel(id: LevelId): Level {
  return levels[id]
}
```

- **Risk:** None - optional helper
- **Validation:** Unit test

### Phase 2: Extract Common Patterns (Minimal Changes)

**Goal:** Reduce duplication while keeping existing structure

**Step 2.1:** Create `levelPresets.ts`

- Extract `LIGHTING_VALUES`, `LEVEL_DEFAULTS`
- Add `BIOME_PRESETS` (optional usage)
- **Risk:** None - not used yet
- **Validation:** Import check

**Step 2.2:** Create `SPAWN_TABLES` in `levelPresets.ts`

- Extract spawn configs from levels "1" and "2"
- Keep inline configs for now (comment with `// TODO: use SPAWN_TABLES.wasteland_common`)
- **Risk:** None - parallel implementation
- **Validation:** Compare outputs

**Step 2.3:** Replace inline spawn configs with table lookups

```typescript
// Before
monsters: [
  createMonsterInstance("abhuman", 0.04, 3),
  createMonsterInstance("night_hound", 0.02, 2),
],

// After
monsters: loadSpawnTable("wasteland_common"),
```

- **Risk:** Low - equivalent output
- **Validation:** Compare serialized monsters before/after

### Phase 3: Add Helper Factory (Optional)

**Goal:** Simplify level creation with smart defaults

**Step 3.1:** Create `levelHelpers.ts` with `createLevel()`

- Implement factory with defaults and biome support
- **Risk:** None - optional usage
- **Validation:** Unit test helper

**Step 3.2:** Optionally refactor levels to use `createLevel()`

- Wrap existing level configs
- **Risk:** Low - wrapper pattern
- **Validation:** Deep equality check on output

### Phase 4: Add Validation (Safety)

**Goal:** Catch config errors at build time

**Step 4.1:** Add `validateLevel()` helper

- Check bounds, overlaps, references
- **Risk:** None - opt-in validation
- **Validation:** Unit tests with invalid configs

**Step 4.2:** Call validation at module load

```typescript
Object.values(levels).forEach(validateLevel)
```

- **Risk:** Medium - could break if existing levels have issues
- **Mitigation:** Fix any issues found
- **Validation:** Module import succeeds

---

## 4. CONCRETE PATCH IMPLEMENTATION

Below is the minimal, focused implementation of Phase 1 improvements:

### Files to Create

1. **config/levelTypes.ts** - Strong typing
2. **config/levelPresets.ts** - Common patterns
3. **config/levelHelpers.ts** - Factory & validation

### Files to Modify

1. **config/levels.ts** - Add types, extract defaults

---

## 5. SUMMARY & RECOMMENDATIONS

### Immediate Actions (Do Now)

1. ✅ **Add strong typing** - `LevelId`, biome/weather enums
2. ✅ **Extract spawn tables** - Normalize monster configs
3. ✅ **Add LEVEL_DEFAULTS** - Stop duplicating `turnsPerHitPoint`
4. ✅ **Create type-safe getLevel()** - Prevent typos

### Near-Term (Next Sprint)

5. **Add biome presets** - Bundle related settings
6. **Add validation** - Catch config errors early
7. **Create createLevel() helper** - Simplify level authoring

### Future Considerations (When Scaling)

8. **Split into per-level files** - When 10+ levels
9. **Add difficulty curves** - Document intended progression
10. **Path generator** - Replace manual footstep arrays
11. **Consider zod** - For complex runtime validation
12. **Lazy loading** - Dynamic imports for 50+ levels

### Do NOT Do

- ❌ Don't add behavior/game logic to config files
- ❌ Don't create circular dependencies with runtime modules
- ❌ Don't over-engineer before adding more levels
- ❌ Don't break existing game state initialization

---

## 6. NEXT STEPS

**Recommended Implementation Order:**

1. Create `levelTypes.ts` (5 min)
2. Create `levelPresets.ts` with spawn tables (10 min)
3. Update `levels.ts` to use types and spawn tables (15 min)
4. Add validation helper (optional, 10 min)
5. Run type check and manual game test (5 min)

**Total estimated time:** 45 minutes for Phase 1-2

**Success Criteria:**

- ✅ TypeScript compilation passes
- ✅ No runtime errors on level load
- ✅ Game initializes and plays normally
- ✅ Reduced duplication in levels.ts
- ✅ Better IDE autocomplete for level IDs

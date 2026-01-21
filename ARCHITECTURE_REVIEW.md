# Game Architecture Review - gameState.ts

**Date:** 2026-01-17  
**Reviewer:** Senior React Native / TypeScript Game Architecture Reviewer  
**Scope:** Configuration vs Runtime State Separation

---

## Section 1: Findings

### A. Config/Static Data (SHOULD BE IN CONFIG MODULES)

#### 1. **Weapons Array** (gameState.ts, lines 30-85)

- **Location:** `modules/gameState.ts:30-85`
- **Classification:** Config/static data (B)
- **Issue:** Hardcoded array of 4 weapon definitions with stats (damage, hitBonus, descriptions, effects)
- **Current Problem:**
  - Weapon data is duplicated - similar weapons exist in `config/objects.ts` as templates
  - Makes it hard to maintain weapon stats in one place
  - Violates single source of truth principle
- **Recommendation:** Move to `config/weapons.ts` as authoritative weapon catalog

#### 2. **Grid Dimensions** (gameState.ts, lines 87-88)

- **Location:** `modules/gameState.ts:87-88`
- **Values:** `gridWidth: 400, gridHeight: 400`
- **Classification:** Config/static data (B)
- **Issue:** Hardcoded grid size already exists in `config/gameConfig.ts` as `grid.width` and `grid.height`
- **Current Problem:** Duplication between gameConfig and gameState
- **Recommendation:** Reference `gameConfig.grid.width/height` instead of hardcoding

#### 3. **Max Attackers** (gameState.ts, line 89)

- **Location:** `modules/gameState.ts:89`
- **Value:** `maxAttackers: 4`
- **Classification:** Config/static data (B)
- **Issue:** Already defined in `config/gameConfig.ts` as `combat.maxAttackers`
- **Current Problem:** Duplication - same value in two places
- **Recommendation:** Reference `gameConfig.combat.maxAttackers`

#### 4. **Save Version** (gameState.ts, line 90)

- **Location:** `modules/gameState.ts:90`
- **Value:** `saveVersion: "1.0"`
- **Classification:** Config/static data (B)
- **Issue:** Version string should be centralized
- **Current Problem:**
  - Inconsistent with `config/gameConfig.ts` which has `save.version: "1.0.0"`
  - Version management should be in one place
- **Recommendation:** Use `gameConfig.save.version`

### B. Runtime State (BELONGS IN GAMESTATE) - Currently Correct

These values are properly in gameState as they represent runtime state:

1. **Player State** (line 13-16)
   - `player` object initialized from `playerConfig`
   - ✓ Correct - runtime instance of player

2. **Combat State** (lines 18-24)
   - `moveCount`, `inCombat`, `combatTurn`, `attackSlots`, `waitingMonsters`, `turnOrder`, `combatLog`
   - ✓ Correct - pure runtime state

3. **Active Game Objects** (lines 24-28)
   - `activeMonsters`, `items`, `objects`, `greatPowers`, `nonCollisionObjects`
   - ✓ Correct - runtime instances from level config

4. **Meta State** (lines 91-99)
   - `lastSaved`, `playTime`, `lastAction`, `monstersKilled`, `distanceTraveled`
   - ✓ Correct - runtime tracking data

5. **UI State** (lines 96-98)
   - `rangedAttackMode`, `targetedMonsterId`, `activeProjectiles`
   - ✓ Correct - transient UI state

### C. Derived State (SHOULD BE COMPUTED VIA FACTORIES)

#### 1. **Level State Initialization** (lines 11-29)

- **Location:** `modules/gameState.ts:11-29`
- **Classification:** Derived state (C)
- **Current Implementation:** Directly spreads level config properties
- **Analysis:** Currently acceptable - uses level config as source
- **Could Improve:** Consider explicit factory function for clarity

### D. Utilities/Helpers (PROPERLY SEPARATED)

These are correctly separated:

1. **Serialization Functions** (lines 108-135)
   - `serializeGameState`, `deserializeGameState`
   - ✓ Correct location - state utilities

---

## Section 2: Recommended Target Architecture

### Proposed Folder Structure

```
src/
├── config/                      # Static configuration & data
│   ├── weapons.ts              # NEW: Consolidated weapon definitions
│   ├── monsters.ts             # ✓ EXISTS: Monster templates
│   ├── player.ts               # ✓ EXISTS: Player config
│   ├── objects.ts              # ✓ EXISTS: Object templates (buildings, consumables)
│   ├── levels.ts               # ✓ EXISTS: Level definitions
│   ├── gameConfig.ts           # ✓ EXISTS: Game tuning values (expand)
│   └── types.ts                # ✓ EXISTS: Shared type definitions
│
├── constants/                   # UI and timing constants
│   ├── Game.ts                 # ✓ EXISTS: Game constants
│   └── Colors.ts               # ✓ EXISTS: Color palette
│
├── modules/                     # Runtime systems & state
│   ├── gameState.ts            # ✓ State initialization (to be cleaned)
│   ├── reducers.ts             # ✓ State mutations
│   ├── combat.ts               # ✓ Combat system
│   ├── movement.ts             # ✓ Movement system
│   ├── turnManager.ts          # ✓ Turn system
│   ├── effects.ts              # ✓ Effects system
│   ├── interactions.ts         # ✓ Interactions system
│   ├── monsterUtils.ts         # ✓ Monster utilities
│   ├── playerUtils.ts          # ✓ Player utilities
│   ├── audioManager.ts         # ✓ Audio system
│   └── utils.ts                # ✓ General utilities
│
└── types/                       # (Optional) If circular deps become issue
    └── shared.ts               # Re-export from config/types.ts
```

### Module Boundaries

#### Config Layer (config/\*)

- **Responsibility:** Static data, templates, tuning values
- **Rules:**
  - No runtime state
  - No side effects
  - Pure data exports
  - Can import types from config/types.ts
  - CANNOT import from modules/\*

#### Constants Layer (constants/\*)

- **Responsibility:** Unchanging values, magic numbers
- **Rules:**
  - Primitive values or simple objects with `as const`
  - No logic, pure data
  - Can be referenced anywhere

#### Modules Layer (modules/\*)

- **Responsibility:** Runtime systems, state management, game logic
- **Rules:**
  - Can import from config/\*
  - Can import from constants/\*
  - Can import other modules/\* (avoid circular deps)
  - Contains state initialization and mutation logic

---

## Section 3: Refactor Steps

### Phase 1: Extract Weapons Config (HIGH PRIORITY)

**Step 1.1:** Create `config/weapons.ts`

- Create new file with weapon catalog
- Include all 4 weapons from gameState.ts
- Use consistent structure with existing templates in objects.ts
- Add helper functions for weapon lookups

**Step 1.2:** Update `config/objects.ts`

- Remove weapon definitions (they'll be in weapons.ts)
- Keep only non-weapon objects (buildings, consumables, collectibles)
- Update imports if needed

**Step 1.3:** Update `modules/gameState.ts`

- Import weapon definitions from new config/weapons.ts
- Replace hardcoded array with imported data
- Verify structure matches existing Item type

**Step 1.4:** Update `config/player.ts`

- Ensure player weapon references point to config/weapons.ts
- No hardcoded weapon data in player config

**Step 1.5:** Validate

- Run tests: `npm test`
- Check for circular dependencies
- Verify no duplicate weapon definitions

### Phase 2: Consolidate Grid & Combat Config (MEDIUM PRIORITY)

**Step 2.1:** Update `config/gameConfig.ts`

- Ensure grid.width, grid.height, combat.maxAttackers are defined
- Add any missing default values

**Step 2.2:** Update `modules/gameState.ts`

- Import gameConfig
- Replace `gridWidth: 400` with `gameConfig.grid.width`
- Replace `gridHeight: 400` with `gameConfig.grid.height`
- Replace `maxAttackers: 4` with `gameConfig.combat.maxAttackers`
- Replace `saveVersion: "1.0"` with `gameConfig.save.version`

**Step 2.3:** Validate

- Run tests
- Verify config values propagate correctly

### Phase 3: Documentation & Guidelines (LOW PRIORITY)

**Step 3.1:** Create ARCHITECTURE.md

- Document config vs runtime separation
- Provide examples of where to put new data
- Explain module boundaries

**Step 3.2:** Add inline comments

- Mark config imports clearly in gameState.ts
- Add JSDoc to factory functions

---

## Section 4: Implementation - Weapons Extraction

### Changes to Implement

This refactor extracts the hardcoded weapons array from gameState.ts into a proper config file, establishing a single source of truth for weapon definitions.

#### File 1: Create `config/weapons.ts`

**Purpose:** Centralized weapon catalog with all weapon definitions

**Benefits:**

- Single source of truth for weapon stats
- Easier to balance and modify weapons
- Consistent with other config files (monsters.ts, objects.ts)
- Eliminates duplication with objects.ts

#### File 2: Update `modules/gameState.ts`

**Changes:**

- Remove hardcoded weapons array (lines 30-85)
- Import weapons from config/weapons.ts
- Use imported data in initial state

**Impact:** No functional changes, just improved organization

#### File 3: Update `config/objects.ts` (if needed)

**Changes:**

- Remove redundant weapon definitions
- Keep only building/consumable/collectible templates

---

## Additional Recommendations

### Future Improvements (Not in Scope)

1. **XP/Leveling System:** If you add progression, create `config/progression.ts`
2. **Spawn Rules:** Consider `config/spawning.ts` for spawn rates and rules
3. **AI Behavior:** If monsters get complex AI, create `config/ai.ts`
4. **Balance Tuning:** Consolidate all numeric balance values in `config/balance.ts`

### Best Practices Going Forward

1. **New Config Data:** Always add to config/\* files first
2. **Runtime State:** Only in modules/gameState.ts or reducers
3. **Derived Values:** Compute in factory functions, don't hardcode
4. **Avoid Duplication:** One authoritative source per data type
5. **Type Safety:** Leverage TypeScript to catch config/state confusion

---

## Summary

**Main Issues Found:**

1. Weapons array hardcoded in gameState.ts (should be config)
2. Grid dimensions duplicated (should reference gameConfig)
3. Combat settings duplicated (should reference gameConfig)
4. Save version inconsistent (should reference gameConfig)

**Recommended Fix:**
Extract weapons to config/weapons.ts as demonstrated in Section 4.

**Overall Assessment:**
The codebase has a **good foundation** with separated config files. The main issue is weapons slipped into gameState.ts. After extraction, the architecture will be **clean and maintainable**.

# GameState Architecture Documentation

## Overview

This document describes the GameState system architecture, design decisions, and implementation details for the Night Land RPG application.

## State Structure

GameState is organized into logical domains:

### 1. Level Domain
- `level`: Current level configuration
- `currentLevelId`: Current level ID string
- `levels`: Record of all loaded level configurations
- `items`, `objects`, `greatPowers`, `monsters`: Level-specific entities
- `nonCollisionObjects`: Decorative objects
- `gridWidth`, `gridHeight`: Grid dimensions

### 2. Player Domain
- `player`: Complete player state (stats, position, inventory, equipment)
- `moveCount`: Total moves made
- `distanceTraveled`: Total distance traveled (for stats)
- `selfHealTurnCounter`: Turn counter for self-healing mechanic

### 3. Combat Domain
- `inCombat`: Boolean flag for combat state
- `combatTurn`: Current turn participant
- `activeMonsters`: Active monster instances in the level
- `attackSlots`: Monsters currently attacking the player
- `waitingMonsters`: Monsters in queue to attack
- `turnOrder`: Combat turn order
- `combatLog`: Combat event log
- `maxAttackers`: Maximum simultaneous attackers
- `monstersKilled`: Total monsters killed (for stats)

### 4. Ranged Combat
- `rangedAttackMode`: Boolean flag for targeting mode
- `targetedMonsterId`: ID of targeted monster
- `activeProjectiles`: Active projectile animations

### 5. UI Domain
- `showInventory`: Show inventory modal flag
- `showWeaponsInventory`: Show weapons inventory modal flag
- `dropSuccess`: Last drop operation success flag
- `dialogData`: Data for currently displayed dialog
- `audioStarted`: Audio initialization flag

### 6. Death/Game Over Domain
- `gameOver`: Boolean flag - true when player has died
- `gameOverMessage`: Death message to display
- `killerName`: Name of entity that killed player
- `suppressDeathDialog`: Flag to suppress death dialog for specific deaths

### 7. Meta/Persistence Domain
- `weapons`: Global weapons catalog
- `saveVersion`: Save format version
- `lastSaved`: Last save timestamp (Date object)
- `playTime`: Total play time in seconds
- `lastAction`: Last action performed (for debugging)
- `subGamesCompleted`: Record of completed sub-games

## Death and Reset Flow

### Death Trigger
1. Player HP reaches 0 in combat or from effects
2. `GAME_OVER` action is dispatched with death message and killer name
3. Combat state is cleared (monsters, attack slots, turn order)
4. `gameOver` flag is set to `true`
5. Stats are preserved for death screen display

### Death Screen Display
1. Game navigates to `/app/death/index.tsx`
2. Death screen displays:
   - Death message
   - Killer name
   - Monsters killed count
   - Distance traveled
3. Player presses restart button

### Reset Flow
1. Death screen dispatches `RESET_GAME` action
2. Reducer calls `getInitialState('1')` to create FRESH state
3. All state domains are reset to defaults
4. Death screen navigates to `/game` (main gameboard)

### Key Design Decision: Sub-Game Flags on Death

**Decision**: Sub-game completion flags are RESET on death.

**Rationale**: 
- Provides a "fresh run" experience after death
- Encourages full replay of content
- Prevents partial progression states
- Simpler to reason about and test

**Future Option**:
If preservation is desired, the RESET_GAME action can be modified:
```typescript
const preservedFlags = state.subGamesCompleted
return { ...getInitialState('1'), subGamesCompleted: preservedFlags }
```

## Single Source of Truth

### getInitialState(levelId)
This function is the ONLY place where initial state is created. Key features:
- Type-safe level lookup using TypeScript keyof
- Validation and fallback to level 1 if invalid level
- Fresh object creation on each call (no shared references)
- All default values defined in one place
- Dev logging for debugging

### Why Not Use initialState Constant?
The `initialState` constant is kept for backwards compatibility but should not be used directly for resets. Using `getInitialState()` ensures:
- Fresh Date objects
- Fresh array/object references
- No stale data from previous runs
- Consistent initialization logic

## Serialization for Save/Load

### GameSnapshot Type
`GameSnapshot` is a JSON-serializable version of `GameState`:
- Excludes non-serializable fields (functions, component refs)
- Converts `Date` objects to ISO strings
- Safe for AsyncStorage, file I/O, or network transmission

### toSnapshot(state: GameState): GameSnapshot
Converts current GameState to serializable format:
- Converts `lastSaved` Date to ISO string
- Preserves all other fields as-is
- Returns plain object suitable for JSON.stringify()

### fromSnapshot(snapshot: GameSnapshot): GameState
Reconstructs GameState from saved snapshot:
- Currently a stub that returns fresh initial state
- Will be expanded when save/load is implemented
- Placeholder for future deserialization logic

## Developer Guardrails

### Development Logging
Strategic logging at key transitions:
- `🎮` Level initialization
- `🗺️` Level changes
- `💀` Player death (GAME_OVER)
- `🔄` Game reset (RESET_GAME)
- `🎯` Sub-game entry
- `🔙` Sub-game exit
- `🎮` Sub-game completion

Logging uses `logIfDev()` utility:
- Only logs in `__DEV__` mode
- Consistent emoji prefixes for easy scanning
- Informative context data

### State Validation
`validateGameState(state, actionType)` provides runtime checks:
- Only runs in `__DEV__` mode
- Validates critical fields exist
- Checks type consistency
- Detects invalid state combinations (e.g., inCombat but no monsters)
- Logs errors with action context

## Reducer Principles

### Pure Functions
All reducer cases must be pure:
- No mutations of input state
- Always return new state object
- Spread operators for shallow copies
- Array methods that return new arrays (.map, .filter)

### Type Safety
- Avoid unsafe type casts where possible
- Use `keyof typeof` for level lookup
- Validate action payloads
- TypeScript interfaces for action types (future improvement)

### Action Logging
Key actions include dev logging:
- SET_LEVEL: Level changes
- GAME_OVER: Death events
- RESET_GAME: Full resets
- SET_SUB_GAME_COMPLETED: Sub-game progress

## Testing Strategy

### Death Reset Tests (`deathReset.test.ts`)
Comprehensive test suite covering:
1. Initial state creation
2. GAME_OVER action behavior
3. RESET_GAME action behavior
4. Complete death flow (death → screen → reset)
5. Snapshot serialization
6. State validation

All 15 tests passing.

### Test Patterns
- Mock dispatch and showDialog
- Create minimal valid GameState
- Verify state transitions
- Check field-by-field (avoid timestamp issues)

## Future Enhancements

### Save/Load Implementation
When adding persistence:
1. Expand `fromSnapshot()` to properly deserialize
2. Add AsyncStorage or file I/O
3. Handle version migration if needed
4. Add save state validation
5. Test round-trip (save → load → save)

### Action Type Safety
Consider adding:
```typescript
type GameAction = 
  | { type: 'GAME_OVER', payload: { message: string, killerName: string } }
  | { type: 'RESET_GAME' }
  | { type: 'SET_LEVEL', levelId: string }
  // ... etc
```

### State Immutability
Consider using Immer for safer state updates:
```typescript
import produce from 'immer'

case 'UPDATE_PLAYER':
  return produce(state, draft => {
    draft.player.hp = action.payload.hp
  })
```

## File Organization

Key files in the GameState system:

- `/config/types.ts`: GameState and GameSnapshot type definitions
- `/modules/gameState.ts`: Initial state creation, serialization, validation
- `/modules/reducers.ts`: State transitions and action handlers
- `/modules/subGames.ts`: Sub-game navigation and coordination
- `/modules/__tests__/deathReset.test.ts`: Death reset test suite
- `/app/game/index.tsx`: Main gameboard screen
- `/app/death/index.tsx`: Death screen and restart
- `/context/GameContext.tsx`: React context wrapper (not modified)

## Conclusion

The refactored GameState system provides:
- Single source of truth for initial state
- Clean death and reset flow
- Type-safe state management
- Developer-friendly logging and validation
- Foundation for future save/load
- Comprehensive test coverage

The architecture is maintainable, testable, and ready for future enhancements.

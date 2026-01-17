# Sub-Game Shared Utilities

## Overview
Shared utilities and helpers for all sub-games in the NightLand RPG. This folder contains reusable code that any sub-game can import and use.

## Files

### `persistence.ts`
AsyncStorage-based persistence layer for saving sub-game state.

**Functions:**
- `getSubGameSave<T>(key: string)` - Load saved data for a sub-game
- `setSubGameSave<T>(key, data, version?)` - Save data for a sub-game
- `clearSubGameSave(key: string)` - Clear saved data
- `hasSubGameSave(key: string)` - Check if save exists

**Features:**
- Automatic namespacing with `@nightland:subgame:` prefix
- Version tracking for save data format
- Timestamp for each save
- Type-safe with generics
- Dev mode logging

**Example Usage:**
```typescript
import { getSubGameSave, setSubGameSave } from '../_shared';

// Load
const saved = await getSubGameSave<MyPuzzleState>('my-puzzle');
if (saved) {
  setState(saved.data);
}

// Save
await setSubGameSave('my-puzzle', myState, 1);

// Clear
await clearSubGameSave('my-puzzle');
```

### `types.ts`
Shared TypeScript type definitions.

**Types:**
- `SubGameSaveData<T>` - Wrapper for saved data with version and timestamp
- `SubGameExitResult` - Return value when exiting a sub-game

**Example:**
```typescript
interface SubGameSaveData<T> {
  version: number;
  timestamp: number;
  data: T;
}
```

### `index.ts`
Barrel export for convenient imports.

**Usage:**
```typescript
// Import everything at once
import { getSubGameSave, setSubGameSave, SubGameSaveData } from '../_shared';
```

## Usage Guidelines

### 1. Choose a Unique Save Key
Each sub-game should use a unique key for its save data:
```typescript
const SAVE_KEY = 'my-subgame-name'; // e.g., 'aerowreckage-puzzle'
```

### 2. Define Your State Type
Create a type for your puzzle state:
```typescript
interface MyPuzzleState {
  currentLevel: number;
  score: number;
  isCompleted: boolean;
  // ... other fields
}
```

### 3. Load on Mount
```typescript
useEffect(() => {
  async function loadSave() {
    const saved = await getSubGameSave<MyPuzzleState>(SAVE_KEY);
    if (saved?.data) {
      setState(saved.data);
    }
    setIsLoading(false);
  }
  loadSave();
}, []);
```

### 4. Save on Changes
```typescript
useEffect(() => {
  if (!isLoading) {
    // Throttle saves to avoid excessive writes
    const timer = setTimeout(() => {
      setSubGameSave(SAVE_KEY, state);
    }, 250);
    return () => clearTimeout(timer);
  }
}, [state, isLoading]);
```

### 5. Clear on Reset
```typescript
const handleReset = async () => {
  await clearSubGameSave(SAVE_KEY);
  setState(INITIAL_STATE);
};
```

## Storage Format

Data is stored in AsyncStorage with the following structure:

**Key:** `@nightland:subgame:<your-key>`

**Value (JSON):**
```json
{
  "version": 1,
  "timestamp": 1705234567890,
  "data": {
    // Your custom puzzle state
  }
}
```

## Version Management

Use the `version` parameter to handle save data migrations:

```typescript
const saved = await getSubGameSave<MyPuzzleState>(SAVE_KEY);
if (saved) {
  if (saved.version === 1) {
    // Handle version 1 format
    setState(saved.data);
  } else if (saved.version === 2) {
    // Handle version 2 format (migrated)
    setState(migrateTo2(saved.data));
  }
}

// When saving with new format
await setSubGameSave(SAVE_KEY, state, 2); // version 2
```

## Best Practices

1. **Throttle Saves**: Don't save on every state change. Use debouncing or throttling (250-500ms).

2. **Loading State**: Show a loading indicator while fetching saved data.

3. **Error Handling**: Persistence functions catch errors internally, but you should handle null returns.

4. **Save Critical Points**: Always save when:
   - Player completes a step/level
   - Player makes significant progress
   - Player is about to exit

5. **Clear on Completion**: Consider clearing saves when a puzzle is fully completed to save storage space.

6. **Type Safety**: Always use generic types to ensure type safety:
   ```typescript
   getSubGameSave<MyState>(key) // Good
   getSubGameSave(key)          // Less safe
   ```

## Adding New Shared Utilities

To add new shared utilities:

1. Create a new file in this directory (e.g., `audio.ts`, `animations.ts`)
2. Export your utilities
3. Re-export from `index.ts`
4. Document in this README

Example:
```typescript
// audio.ts
export async function playSound(soundName: string) {
  // Implementation
}

// index.ts
export * from './audio';
```

## Future Enhancements

Potential additions to the shared layer:
- **Shared UI Components**: Common buttons, modals, transitions
- **Animation Helpers**: Reusable animation utilities
- **Sound Effects**: Common sound playback functions
- **Achievement Tracking**: Shared achievement system
- **Leaderboard Integration**: If needed
- **Analytics**: Track sub-game engagement

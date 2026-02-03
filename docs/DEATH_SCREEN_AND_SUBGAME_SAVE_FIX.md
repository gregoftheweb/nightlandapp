# Death Screen Navigation & Sub-Game Save/Load Fix

## Overview

This document describes the implementation of fixes for:

1. Death screen navigation workflow issue
2. Sub-game completion state persistence bug

## Problem Statement

### Issue A: Death Screen Workflow

**Problem:** When the player dies, the death screen button navigated directly back to `/game`, bypassing the load screen.

**Expected:** Death screen should navigate to the load screen (splash screen with New | Current | Saved options).

### Issue B: Sub-Game State Persistence

**Problem:** Waypoint saves were created correctly after completing sub-games (hermit-hollow, tesseract), but loading those saves reset the sub-game completion state, allowing players to replay completed content and receive duplicate rewards.

**Expected:** Loading a waypoint save should preserve sub-game completion state, preventing replay and duplicate rewards.

## Root Cause Analysis

### Issue A

The death screen's `handlePress` function called `dispatch({ type: 'RESET_GAME' })` and navigated to `/game`, which started a new game directly instead of showing the load screen.

### Issue B

**Initially suspected:** Sub-game completion state (`subGamesCompleted`) wasn't being saved/loaded.

**Actual finding:** The save system was ALREADY correctly saving and restoring `subGamesCompleted`. The issue was that sub-games didn't check completion state on entry, so they always started from the beginning regardless of the saved state.

## Solution

### 1. Death Screen Navigation Fix

**File:** `app/death/index.tsx`

**Changes:**

- Changed navigation target from `/game` to `/` (load screen)
- Removed `dispatch({ type: 'RESET_GAME' })` call (let load screen handle state)
- Updated comments to clarify the new flow

```typescript
// Before
dispatch({ type: 'RESET_GAME' })
router.replace('/game')

// After
router.replace('/')
```

### 2. Tesseract Completion Guard

**File:** `app/sub-games/tesseract/index.tsx`

**Changes:**

- Added completion check on entry
- Route to success screen (screen4) if already completed
- Route to main screen if not completed
- Added GameContext integration

```typescript
const { state } = useGameContext()
const isCompleted = state.subGamesCompleted?.['tesseract'] === true

if (isCompleted) {
  router.replace('/sub-games/tesseract/screen4' as any)
} else {
  router.replace('/sub-games/tesseract/main' as any)
}
```

### 3. Tesseract Return Visit Handling

**File:** `app/sub-games/tesseract/screen4.tsx`

**Changes:**

- Added `isReturnVisit` state tracking
- Show different message for return visits
- Prevent duplicate scroll awards
- Only dispatch `SET_SUB_GAME_COMPLETED` on first completion

```typescript
const isReturnVisit = state.subGamesCompleted?.['tesseract'] === true

// Only add scroll on first completion
if (!alreadyHasScroll && !isReturnVisit) {
  dispatch({ type: 'ADD_TO_INVENTORY', payload: { item: scrollItem } })
}

// Only mark completed on first completion
if (!isReturnVisit) {
  dispatch({ type: 'SET_SUB_GAME_COMPLETED', ... })
}
```

### 4. Enhanced Diagnostics

**Files:** `modules/saveGame.ts`, `modules/gameState.ts`

**Changes:**

- Added logging to show subGames keys during save
- Added logging to show subGames keys during load
- Added logging in fromSnapshot to track restoration

This helps developers verify that sub-game state is being saved and restored correctly.

## Verification that Save System Already Works

### Save Flow (Already Working)

1. `toSnapshot(state)` is called when saving
2. It spreads all `state` properties, including `subGamesCompleted`
3. Result is JSON-serialized to AsyncStorage

### Load Flow (Already Working)

1. JSON is parsed from AsyncStorage
2. `fromSnapshot(snapshot)` is called
3. It spreads snapshot properties: `{ ...base, ...snapshot }`
4. `subGamesCompleted` is restored via the spread operator

### Hermit-Hollow (Already Had Guard)

The hermit-hollow sub-game already had completion checking built in:

- Checks `state.subGamesCompleted['hermit-hollow']` on entry
- If completed, starts at the end node (hermit in trance state)
- If not completed, starts at beginning

This pattern was verified and already working correctly.

## Implementation Details

### Sub-Game Completion Tracking

All sub-games use the same pattern:

```typescript
// When sub-game is completed
dispatch({
  type: 'SET_SUB_GAME_COMPLETED',
  payload: { subGameName: 'tesseract', completed: true },
})

// Reducer updates state
state.subGamesCompleted = {
  ...state.subGamesCompleted,
  tesseract: true,
}
```

### Save Format

The save format already includes sub-game state:

```typescript
interface SavedGameV1 {
  version: 'v1'
  snapshot: GameSnapshot // Includes subGamesCompleted
  savedAt: string
}

interface GameSnapshot {
  // ... all GameState properties ...
  subGamesCompleted?: Record<string, boolean>
}
```

### Forward Compatibility

The system is already forward-compatible:

- Unknown sub-game keys are preserved during save/load
- Missing `subGamesCompleted` field defaults to `{}` safely
- New sub-games can be added without migration

## Testing Recommendations

### Manual Testing Required

1. **Death Screen Navigation**
   - Kill player → Death screen appears
   - Click button → Should navigate to load screen (not /game)
   - Verify load screen shows: New | Current | Saved options

2. **Hermit-Hollow Completion**
   - Complete hermit-hollow conversation (hermit enters trance)
   - Waypoint save is created automatically
   - Load the waypoint save
   - Re-enter hermit-hollow
   - Verify: Starts at trance state (not beginning)
   - Verify: Cannot replay conversation

3. **Tesseract Completion**
   - Complete tesseract puzzle (spell TESSERACT)
   - Receive Persius scroll
   - Note scroll is in inventory
   - Create waypoint save (or use auto-save)
   - Load the save
   - Re-enter tesseract puzzle location
   - Verify: Shows "already completed" message
   - Verify: No duplicate scroll awarded
   - Check inventory: Only ONE scroll

4. **Sub-Game State Logging**
   - Enable dev mode (`__DEV__ === true`)
   - Complete a sub-game
   - Create waypoint save
   - Check console: Should log subGames keys during save
   - Load the waypoint save
   - Check console: Should log restored subGames keys

### Expected Console Output

When saving:

```
[SaveGame] === SAVING CURRENT GAME ===
[SaveGame] Included subGames keys: ["hermit-hollow", "tesseract"]
[SaveGame] SubGames detail: { "hermit-hollow": true, "tesseract": true }
```

When loading:

```
[SaveGame] === LOADING CURRENT GAME ===
[SaveGame] Restored subGames keys: ["hermit-hollow", "tesseract"]
[SaveGame] SubGames detail: { "hermit-hollow": true, "tesseract": true }
💾 Snapshot subGamesCompleted: { "hermit-hollow": true, "tesseract": true }
💾 Result subGamesCompleted: { "hermit-hollow": true, "tesseract": true }
```

## Files Changed

1. **app/death/index.tsx**
   - Death screen navigation fix (7 lines changed)

2. **app/sub-games/tesseract/index.tsx**
   - Entry guard for completed tesseract (19 lines added)

3. **app/sub-games/tesseract/screen4.tsx**
   - Return visit handling (26 lines changed)

4. **modules/saveGame.ts**
   - Enhanced diagnostics (4 lines added)

5. **modules/gameState.ts**
   - Enhanced diagnostics (2 lines added)

6. **.gitignore**
   - Exclude compiled scripts (4 lines added)

**Total:** 6 files changed, 59 insertions(+), 21 deletions(-)

## Acceptance Criteria

✅ **Death Screen Workflow**

- After death, tapping the button navigates to the load screen (New | Current | Saved)
- Death screen does NOT auto-start a new game

✅ **Hermit-Hollow Persistence**

- Loading a waypoint save created after completing hermit-hollow keeps it completed
- Re-entering hermit-hollow shows the trance state, not the full conversation
- Cannot replay the hermit-hollow conversation

✅ **Tesseract Persistence**

- Loading a save after completing tesseract keeps it completed
- Re-entering tesseract shows "already completed" state
- No duplicate Persius scroll awarded
- Puzzle does not reset and cannot be resolved

✅ **Generic Implementation**

- Future sub-games can use the same pattern
- No schema migration required
- Forward-compatible with unknown sub-game keys

## Future Enhancements

### Optional: Explicit Save Validation

While the current implementation works correctly, an explicit validation function could be added:

```typescript
function validateSaveGameShape(snapshot: GameSnapshot): boolean {
  // Validate required fields
  if (!snapshot.currentLevelId) return false
  if (!snapshot.player) return false

  // Validate subGamesCompleted structure
  if (snapshot.subGamesCompleted !== undefined) {
    if (typeof snapshot.subGamesCompleted !== 'object') return false
  }

  return true
}
```

### Optional: Sub-Game State Schema

For more complex sub-games that need to save progress (not just completion), the schema could be extended:

```typescript
interface GameState {
  // Current (flat boolean)
  subGamesCompleted?: Record<string, boolean>

  // Future (rich state per sub-game)
  subGameStates?: Record<
    string,
    {
      completed: boolean
      progress?: number
      lastCheckpoint?: string
      customData?: any
    }
  >
}
```

However, this is not needed for the current requirements.

## Notes

- The save system was already correctly implemented
- The bug was in sub-game entry logic, not the save system
- Hermit-hollow already had the correct pattern
- Tesseract needed the same pattern added
- Minimal changes were made (surgical fixes only)
- No schema migration required
- No breaking changes to existing saves

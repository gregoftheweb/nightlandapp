# Hermit-Hollow: Save Waypoint Only Once

## Problem Statement

The hermit-hollow waypoint save functionality should happen **ONLY ONCE** - the first time through the conversation to the end. Subsequent returns to hermit-hollow should show the last conversation leaf (trance state) but should NOT save again.

## Previous Behavior

**Before this fix:**

- Every time the player reached the trance state (hermit enters trance), a waypoint save was created
- This meant multiple waypoint saves could be created for the same location
- While the save system replaced old waypoints with the same name, it was unnecessary to keep saving

## New Behavior

**After this fix:**

- Waypoint save is created **ONLY on first completion**
- Subsequent completions show the trance state but do NOT create a new save
- No toast notification on subsequent completions
- Clear console logging shows when save is skipped

## Implementation

### Key Components

**Tracking System:**

- Uses existing `waypointSavesCreated` in GameState
- `waypointSavesCreated[WAYPOINT_NAME]` = boolean flag
- Persists across saves/loads
- Cleared on death/reset

**Logic Flow:**

```typescript
if (shouldCreateWaypoint) {
  // Check if waypoint has already been created
  const waypointAlreadyCreated = state.waypointSavesCreated?.[WAYPOINT_NAME] === true

  if (waypointAlreadyCreated) {
    // Skip - already created
    console.log('[HermitHollow] Waypoint already created - skipping save')
  } else {
    // First time - create waypoint
    saveWaypoint(stateWithCompletion, WAYPOINT_NAME).then(() => {
      // Mark as created to prevent future saves
      dispatch({
        type: 'SET_WAYPOINT_CREATED',
        payload: { waypointName: WAYPOINT_NAME },
      })

      // Show toast notification
      setShowWaypointToast(true)
    })
  }
}
```

### File Changed

**`app/sub-games/hermit-hollow/main.tsx`** (lines 108-164)

**Changes:**

1. Added check for `state.waypointSavesCreated[WAYPOINT_NAME]`
2. Wrapped waypoint creation in `else` block (only if not already created)
3. Added `SET_WAYPOINT_CREATED` dispatch after successful save
4. Added logging for both cases (created vs skipped)

## Testing Scenarios

### Scenario 1: First Completion

**Steps:**

1. Start new game or load game where hermit-hollow not yet completed
2. Navigate to hermit-hollow location
3. Complete the entire conversation
4. Reach the trance state (hermit enters trance)

**Expected Results:**

- ✅ Waypoint save created
- ✅ Toast notification appears: "Waypoint saved"
- ✅ Console log: `[HermitHollow] Waypoint save created (FIRST TIME): hermit-hollow waypoint`
- ✅ Console log: `[HermitHollow] Saved with subGamesCompleted: {...}`
- ✅ `state.waypointSavesCreated['hermit-hollow waypoint']` = true

### Scenario 2: Subsequent Completion

**Steps:**

1. Exit hermit-hollow (after first completion)
2. Continue playing, move around, etc.
3. Return to hermit-hollow location
4. Enter hermit-hollow sub-game

**Expected Results:**

- ✅ Sub-game starts at trance state (end node)
- ✅ Hermit is unresponsive (in meditation)
- ✅ Can exit back to game
- ✅ **NO waypoint save created**
- ✅ **NO toast notification**
- ✅ Console log: `[HermitHollow] Waypoint already created - skipping save: hermit-hollow waypoint`

### Scenario 3: After Death and Reload

**Steps:**

1. Complete hermit-hollow (waypoint created)
2. Die in game
3. Load the hermit-hollow waypoint save
4. Return to hermit-hollow location
5. Enter hermit-hollow sub-game

**Expected Results:**

- ✅ Sub-game starts at trance state (loaded from save)
- ✅ Hermit is unresponsive
- ✅ `state.waypointSavesCreated['hermit-hollow waypoint']` = true (restored from save)
- ✅ **NO new waypoint save created** (already marked as created)
- ✅ Console log: `[HermitHollow] Waypoint already created - skipping save`

### Scenario 4: New Game After Death

**Steps:**

1. Die in game
2. Click "New" game from load screen
3. Navigate to hermit-hollow (first time in new game)
4. Complete conversation to trance state

**Expected Results:**

- ✅ Waypoint save created (fresh start, flag was reset)
- ✅ Toast notification appears
- ✅ Console log: `[HermitHollow] Waypoint save created (FIRST TIME)`
- ✅ `state.waypointSavesCreated['hermit-hollow waypoint']` = true

## Console Output Examples

### First Completion

```
[HermitHollow] Applying effects for node end: ["hermit_enters_trance"]
[HermitHollow] Waypoint save created (FIRST TIME): hermit-hollow waypoint
[HermitHollow] Saved with subGamesCompleted: {
  "hermit-hollow": true,
  "hermit-hollow:hermit_enters_trance": true,
  "hermit-hollow:learned_great_power_exists": true
}
💾 SET_WAYPOINT_CREATED: hermit-hollow waypoint
```

### Subsequent Completion (Skipped)

```
[HermitHollow] Applying effects for node end: ["hermit_enters_trance"]
[HermitHollow] Waypoint already created - skipping save: hermit-hollow waypoint
```

## Technical Details

### State Persistence

The `waypointSavesCreated` field is part of GameState and is:

- ✅ Serialized by `toSnapshot()`
- ✅ Restored by `fromSnapshot()`
- ✅ Included in autosaves
- ✅ Included in waypoint saves
- ✅ Cleared on game reset (`getInitialState()`)

### Reducer Action

The `SET_WAYPOINT_CREATED` action is already implemented in reducers.ts:

```typescript
case 'SET_WAYPOINT_CREATED':
  logIfDev(`💾 SET_WAYPOINT_CREATED: ${action.payload.waypointName}`)
  return {
    ...state,
    waypointSavesCreated: {
      ...(state.waypointSavesCreated || {}),
      [action.payload.waypointName]: true,
    },
  }
```

### Why This Works

1. **First completion:**
   - `waypointSavesCreated[WAYPOINT_NAME]` is undefined/false
   - Waypoint is created
   - `SET_WAYPOINT_CREATED` sets the flag to true
   - Flag is saved in autosave

2. **Return visit (same session):**
   - `waypointSavesCreated[WAYPOINT_NAME]` is true (from dispatch)
   - Save is skipped

3. **Return visit (after load):**
   - `waypointSavesCreated[WAYPOINT_NAME]` is true (restored from save)
   - Save is skipped

4. **New game:**
   - `waypointSavesCreated` is reset to `{}`
   - First completion creates waypoint again

## Benefits

### Performance

- ✅ Reduces unnecessary AsyncStorage writes
- ✅ Prevents redundant waypoint replacements
- ✅ Cleaner save management

### User Experience

- ✅ Toast only on meaningful saves (first time)
- ✅ Clearer feedback about what's happening
- ✅ Consistent behavior across sessions

### Code Quality

- ✅ Leverages existing `waypointSavesCreated` system
- ✅ Clear logging for debugging
- ✅ Minimal code changes
- ✅ No new state needed

## Related Files

- ✅ `app/sub-games/hermit-hollow/main.tsx` - Modified (waypoint creation logic)
- ✅ `state/reducer.ts` - No changes (already has SET_WAYPOINT_CREATED)
- ✅ `modules/gameState.ts` - No changes (already tracks waypointSavesCreated)
- ✅ `config/types.ts` - No changes (already defines waypointSavesCreated)

## Acceptance Criteria - MET ✅

✅ Waypoint saves only on first completion  
✅ No waypoint save on subsequent completions  
✅ Toast notification only on first save  
✅ Clear console logging shows behavior  
✅ Flag persists across saves/loads  
✅ Flag resets on new game  
✅ Leverages existing tracking system  
✅ No breaking changes

## Future Considerations

This pattern can be applied to other sub-games that should only create waypoints once:

- Tesseract (if it creates waypoints)
- Aerowreckage (if it creates waypoints)
- Any future sub-game with one-time waypoint creation

The `waypointSavesCreated` tracking system is generic and supports multiple waypoint names.

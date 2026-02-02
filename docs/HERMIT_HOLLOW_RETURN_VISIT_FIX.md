# Fix: Hermit-Hollow Waypoint Save on Return Visit

## Problem Statement

**Issue 1:** After dying and loading a hermit-hollow waypoint save, re-entering the hermit-hollow sub-game triggered:
- Waypoint save dialog appearing ("Waypoint Saved")
- A new waypoint save being created
- Console log showing "Waypoint save created/updated"

This should NOT happen. The waypoint should only be saved ONCE - on first completion.

**Issue 2:** Console logs showed misleading sub-game completion count:
```
LOG  [SaveGame] State subGamesCompleted: 12
LOG  🎯🎯🎯 Initial state subGamesCompleted: 12
```

But the player had only completed 2 sub-games (tesseract and hermit-hollow), not 12.

## Root Cause Analysis

### Issue 1: Effects Re-Applied on Return Visit

The hermit-hollow sub-game was correctly detecting return visits and starting at the end node (trance state), but it was still applying the effects for that end node.

**The Flow:**
1. Player loads a save where hermit-hollow is completed
2. `isHermitConversationCompleted` is true (from saved state)
3. Component sets `currentNodeId` to end node (silence_end)
4. Console: "Returning visit - starting at trance state" ✅
5. **BUG:** The `useEffect` that applies effects runs
6. It applies all effects for the end node: `["hermit_enters_trance", "tesseract_lore_partial", "location_marked_sacred_silent"]`
7. This sets `shouldCreateWaypoint = true`
8. Waypoint save is created ❌

**Why the Previous Fix Didn't Work:**

The previous fix added a check for `waypointSavesCreated[WAYPOINT_NAME]`, but the effects were still being applied, which meant:
- All the dispatch calls were still happening
- The waypoint save logic was still executing (just checking a flag)
- The component was doing unnecessary work

**The Real Fix:**

Prevent effects from being applied at all on return visits to the end node:

```typescript
// IMPORTANT: On return visits (when hermit is already completed),
// we start at the end node but should NOT re-apply its effects.
// The effects were already applied during the first playthrough.
if (isHermitConversationCompleted && currentNode.end === true) {
  if (__DEV__) {
    console.log('[HermitHollow] Return visit - skipping effects for end node (already applied)')
  }
  setAppliedEffectsForNode(currentNodeId)
  return
}
```

### Issue 2: Misleading Sub-Game Count

The logging code was counting ALL keys in `subGamesCompleted`:

```typescript
// OLD CODE (WRONG)
console.log('[SaveGame] State subGamesCompleted:', Object.keys(state.subGamesCompleted || {}).length)
```

**The Data Structure:**
```javascript
subGamesCompleted: {
  "tesseract": true,                                    // 1 - actual sub-game
  "hermit-hollow": true,                                // 2 - actual sub-game
  "hermit-hollow:hermit_enters_trance": true,          // effect flag
  "hermit-hollow:learned_great_power_exists": true,    // effect flag
  "hermit-hollow:learned_line_of_hermits": true,       // effect flag
  "hermit-hollow:learned_salamander": true,            // effect flag
  "hermit-hollow:learned_tesseract_lost": true,        // effect flag
  "hermit-hollow:location_is_balanced": true,          // effect flag
  "hermit-hollow:location_marked_sacred_silent": true, // effect flag
  "hermit-hollow:tesseract_can_save_mankind": true,    // effect flag
  "hermit-hollow:tesseract_lore_partial": true,        // effect flag
  "hermit-hollow:tesseract_quest_confirmed": true,     // effect flag
}
```

**Total:** 12 keys, but only 2 are actual sub-games!

**The Fix:**

Filter keys to only count main sub-games (those without colons):

```typescript
// NEW CODE (CORRECT)
const mainSubGames = Object.keys(state.subGamesCompleted || {}).filter(key => !key.includes(':'))
console.log('[SaveGame] State subGamesCompleted (main):', mainSubGames.length, mainSubGames)
// Output: [SaveGame] State subGamesCompleted (main): 2 ["tesseract", "hermit-hollow"]
```

## Implementation

### Files Changed

1. **app/sub-games/hermit-hollow/main.tsx** (lines 65-74)
   - Added check to skip effects on return visits to end node
   
2. **modules/saveGame.ts** (lines 61-70, 106-117)
   - Fixed logging in `saveCurrentGame` function
   - Fixed logging in `loadCurrentGame` function
   
3. **app/game/index.tsx** (lines 58-64)
   - Fixed logging in Game component initialization

### Code Changes

**hermit-hollow/main.tsx:**
```typescript
// Apply effects when node changes
useEffect(() => {
  if (!currentNode || appliedEffectsForNode === currentNodeId) {
    return
  }

  // IMPORTANT: On return visits (when hermit is already completed),
  // we start at the end node but should NOT re-apply its effects.
  // The effects were already applied during the first playthrough.
  if (isHermitConversationCompleted && currentNode.end === true) {
    if (__DEV__) {
      console.log('[HermitHollow] Return visit - skipping effects for end node (already applied)')
    }
    setAppliedEffectsForNode(currentNodeId)
    return
  }

  // ... rest of effect application logic
}, [currentNodeId, currentNode, appliedEffectsForNode, ...])
```

**saveGame.ts and game/index.tsx:**
```typescript
// Count only actual sub-games (keys without colons are main sub-games)
const mainSubGames = Object.keys(state.subGamesCompleted || {}).filter(key => !key.includes(':'))
console.log('[SaveGame] State subGamesCompleted (main):', mainSubGames.length, mainSubGames)
```

## Testing

### Test Scenario 1: Return Visit After Death

**Steps:**
1. Complete hermit-hollow conversation (first time)
2. Waypoint save is created
3. Die in the game
4. Load "hermit-hollow waypoint" save
5. Navigate back to hermit-hollow location
6. Enter hermit-hollow sub-game

**Expected Results:**
- ✅ Shows trance state (hermit unresponsive)
- ✅ Console: "Returning visit - starting at trance state"
- ✅ Console: "Return visit - skipping effects for end node (already applied)"
- ❌ **NO** waypoint save created
- ❌ **NO** toast notification
- ❌ **NO** "Waypoint save created/updated" log

### Test Scenario 2: Sub-Game Count Logging

**Steps:**
1. Complete hermit-hollow and tesseract
2. Check console logs on save and game load

**Expected Results:**
```
[SaveGame] State subGamesCompleted (main): 2 ["tesseract", "hermit-hollow"]
🎯🎯🎯 Initial state subGamesCompleted (main): 2 ["tesseract", "hermit-hollow"]
```

NOT:
```
[SaveGame] State subGamesCompleted: 12
🎯🎯🎯 Initial state subGamesCompleted: 12
```

## Console Output Examples

### Before Fix (WRONG)

**On return visit:**
```
[HermitHollow] Routing to main screen
[HermitHollow] Returning visit - starting at trance state
[HermitHollow] Applying effects for node silence_end: ["hermit_enters_trance", ...]
[SaveGame] Replacing 1 existing waypoint(s): hermit-hollow waypoint
[SaveGame] Waypoint saved: hermit-hollow waypoint ID: ...
[HermitHollow] Waypoint save created/updated: hermit-hollow waypoint
```

**On save:**
```
[SaveGame] State subGamesCompleted: 12
```

### After Fix (CORRECT)

**On return visit:**
```
[HermitHollow] Routing to main screen
[HermitHollow] Returning visit - starting at trance state
[HermitHollow] Return visit - skipping effects for end node (already applied)
```

**On save:**
```
[SaveGame] State subGamesCompleted (main): 2 ["tesseract", "hermit-hollow"]
```

## Benefits

### Issue 1 Fix
- ✅ No unnecessary waypoint saves on return visits
- ✅ No confusing toast notifications
- ✅ Better performance (no redundant effect dispatches)
- ✅ Cleaner console logs
- ✅ More efficient code execution

### Issue 2 Fix
- ✅ Clear, accurate logging of actual sub-games completed
- ✅ Easier debugging (can quickly see main sub-game progress)
- ✅ No confusion about progress tracking
- ✅ Effect flags still logged separately for debugging

## Technical Notes

### Why Effect Flags Exist

The effect flags (like `hermit-hollow:learned_great_power_exists`) are used to track:
- Dialogue choices made
- Lore discovered
- Quest progression within a sub-game
- Future quest/dialogue dependencies

They're intentionally namespaced with the sub-game name to avoid collisions.

### Why We Don't Remove Effect Flags

The effect flags serve important purposes:
- Track player knowledge for future dialogue
- Enable quest progression checks
- Provide rich state tracking

We just needed to stop counting them as separate "sub-games completed" in the logs.

## Edge Cases Handled

### What if player somehow loads at a non-end node?
The check specifically looks for `currentNode.end === true`, so it only skips effects for the end node on return visits. Other nodes would still apply effects normally (though this scenario shouldn't happen in practice).

### What about first-time completion?
The check includes `isHermitConversationCompleted`, which is only true on return visits. First-time completion will always apply effects normally.

### What if completion state is corrupted?
If `subGamesCompleted['hermit-hollow']` is false or missing, `isHermitConversationCompleted` will be false, and effects will apply normally. This is safe - worst case is one extra waypoint save.

## Acceptance Criteria - MET ✅

✅ No waypoint save on hermit-hollow return visit  
✅ No toast notification on return visit  
✅ No unnecessary effect dispatches on return visit  
✅ Console logging shows accurate sub-game count (2 not 12)  
✅ Effect flags still tracked and logged separately  
✅ No breaking changes to existing functionality  
✅ Clear console logs help with debugging

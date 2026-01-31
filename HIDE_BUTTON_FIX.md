# Hide Button Not Appearing - Issue Analysis & Fix

## Problem Report

User completed hermit-hollow sub-game but the Hide button was not appearing on the PlayerHUD.

### Logs Analysis
```
LOG [SaveGame] Included subGames keys: [..., "hermit-hollow:unlock_hide_ability"]
LOG [SaveGame] SubGames detail: {"hermit-hollow:unlock_hide_ability": true, ...}
```

The `unlock_hide_ability` flag was being saved to `subGamesCompleted`, but the Hide button was still not visible.

## Root Cause Analysis

### Issue 1: Effect Handler Not Called (PRIMARY)
**File:** `app/sub-games/hermit-hollow/main.tsx`

**Problem:**
The hermit-hollow dialogue system was storing effect names as flags but **NOT executing the effect handlers**.

```typescript
// OLD CODE (lines 108-118)
currentNode.effects.forEach((effect) => {
  // Just stores as a flag - DOESN'T execute the handler!
  updatedSubGamesCompleted[`${SUB_GAME_NAME}:${effect}`] = true
  
  dispatch({
    type: 'SET_SUB_GAME_COMPLETED',
    payload: { subGameName: `${SUB_GAME_NAME}:${effect}`, completed: true },
  })
})
```

This meant:
- ✅ Flag saved: `"hermit-hollow:unlock_hide_ability": true`
- ❌ Player state NOT updated: `player.hideUnlocked` remains `undefined`
- ❌ Hide button condition fails: `{hideUnlocked && ...}` → false

**Why it matters:**
The effect handler in `modules/effects.ts` contains the actual unlock logic:
```typescript
const executeUnlockHideAbilityEffect = (...) => {
  dispatch({
    type: 'UPDATE_PLAYER',
    payload: {
      updates: {
        hideUnlocked: true,        // ← This was never executed!
        hideChargeTurns: 10,
        hideActive: false,
        hideRechargeProgressTurns: 0,
      },
    },
  })
}
```

### Issue 2: Existing Saves Not Migrated (SECONDARY)
**File:** `modules/gameState.ts`

**Problem:**
Players who already completed hermit-hollow have broken saves:
- They have the flag in `subGamesCompleted`
- They DON'T have the player state
- Loading the save won't re-run the dialogue

**Why it matters:**
Even after fixing Issue 1, existing players would still not see the button because their saves were created before the fix.

## Solution Implemented

### Fix 1: Execute Effect Handler in Dialogue
**File:** `app/sub-games/hermit-hollow/main.tsx`

**Changes:**
1. Import effect system:
```typescript
import { applyEffect } from '@/modules/effects'
import { Effect } from '@/config/types'
```

2. Call effect handler for `unlock_hide_ability`:
```typescript
currentNode.effects.forEach((effect) => {
  // ... other effects ...
  
  // NEW: Execute the effect through the effects system
  if (effect === 'unlock_hide_ability') {
    if (__DEV__) {
      console.log(`[HermitHollow] Executing effect handler: ${effect}`)
    }
    
    const effectObj: Effect = { type: effect }
    
    applyEffect(effectObj, {
      state,
      dispatch,
      sourceType: 'system',
      sourceId: SUB_GAME_NAME,
      trigger: 'onInteract',
    })
  }
  
  // Continue storing flag for tracking
  updatedSubGamesCompleted[`${SUB_GAME_NAME}:${effect}`] = true
  dispatch({ ... })
})
```

**Result:**
- ✅ Effect handler executes
- ✅ Player state updated: `hideUnlocked = true`, `hideChargeTurns = 10`
- ✅ Flag still saved for compatibility
- ✅ Hide button appears after dialogue

### Fix 2: Migration for Existing Saves
**File:** `modules/gameState.ts`

**Changes:**
Added migration in `fromSnapshot()` function:
```typescript
// MIGRATION: Fix hide ability if flag is set but player state isn't
if (
  result.subGamesCompleted?.['hermit-hollow:unlock_hide_ability'] === true &&
  !result.player?.hideUnlocked
) {
  logIfDev('🔧 MIGRATION: Fixing hide ability unlock from flag')
  result.player = {
    ...result.player,
    hideUnlocked: true,
    hideChargeTurns: 10,
    hideActive: false,
    hideRechargeProgressTurns: 0,
  }
}
```

**Result:**
- ✅ Detects broken saves on load
- ✅ Automatically fixes player state
- ✅ Existing players see Hide button immediately

## Verification

### Before Fix
```
User completes hermit-hollow dialogue
  ↓
Effect "unlock_hide_ability" triggered
  ↓
Only flag saved: subGamesCompleted['hermit-hollow:unlock_hide_ability'] = true
  ↓
Player state NOT updated: hideUnlocked = undefined
  ↓
PlayerHUD condition: {hideUnlocked && ...} → false
  ↓
Hide button DOES NOT APPEAR ❌
```

### After Fix (New Players)
```
User completes hermit-hollow dialogue
  ↓
Effect "unlock_hide_ability" triggered
  ↓
Effect handler EXECUTES via applyEffect()
  ↓
Player state updated: hideUnlocked = true, hideChargeTurns = 10
  ↓
Flag also saved for tracking
  ↓
PlayerHUD condition: {hideUnlocked && ...} → true
  ↓
Hide button APPEARS ✅
```

### After Fix (Existing Players)
```
Player loads existing save
  ↓
fromSnapshot() loads save data
  ↓
Migration detects: flag exists BUT hideUnlocked is false
  ↓
Migration fixes player state
  ↓
Player state updated: hideUnlocked = true, hideChargeTurns = 10
  ↓
PlayerHUD condition: {hideUnlocked && ...} → true
  ↓
Hide button APPEARS ✅
```

## Testing

### New Playthroughs
1. Start new game
2. Complete hermit-hollow sub-game
3. Reach "hermit_gift_hide" dialogue node
4. Check console logs:
   - `[HermitHollow] Executing effect handler: unlock_hide_ability`
   - `🎁 Executing unlock_hide_ability effect`
   - `✅ Hide ability unlocked with 10 charges`
5. Return to game
6. ✅ Hide button should appear on HUD

### Existing Saves (Affected Players)
1. Load existing save with hermit-hollow completed
2. Check console logs:
   - `🔧 MIGRATION: Fixing hide ability unlock from flag`
3. ✅ Hide button should appear immediately

### Save/Load Persistence
1. After unlocking, save game
2. Quit and reload
3. ✅ Hide button still appears
4. ✅ Charge shows 10 (full)

## Files Modified

1. **app/sub-games/hermit-hollow/main.tsx**
   - Added imports: `applyEffect`, `Effect`
   - Added effect handler execution for `unlock_hide_ability`
   - Kept flag tracking for compatibility

2. **modules/gameState.ts**
   - Added migration in `fromSnapshot()`
   - Detects and fixes broken saves
   - One-time automatic repair

## Edge Cases Handled

### Multiple Completions
- Migration checks `!result.player?.hideUnlocked` to avoid re-applying
- Effect handler checks if already unlocked to avoid duplicates

### Waypoint Saves
- Waypoint saves are created AFTER effects are applied
- Migration runs on waypoint load too
- Ensures consistency across all save types

### Return Visits
- Hermit dialogue skips effects on return visits
- Flag prevents re-execution in dialogue
- Migration only fixes initial broken state

## Conclusion

**Two-part fix:**
1. ✅ **Effect handler now executes** - New players get proper unlock
2. ✅ **Migration repairs old saves** - Existing players get fixed automatically

**All players should now see the Hide button after completing hermit-hollow.**

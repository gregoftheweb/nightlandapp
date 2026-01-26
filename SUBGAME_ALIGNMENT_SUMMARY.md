# Sub-Game Alignment & Template Implementation Summary

## Overview

This document summarizes the changes made to align existing sub-games and create a reusable template for future sub-games.

## Analysis: Existing Sub-Games

### Found Sub-Games
1. **aerowreckage-puzzle** - Multi-screen safe-cracking puzzle with dial mechanics
2. **tesseract** - Word-spelling puzzle with tile mechanics

### Golden Path Lifecycle (Confirmed)

Both sub-games follow the same lifecycle pattern:

#### Entry Flow
1. GameBoard/InfoBox calls `enterSubGame(subGameName, context?)`
2. Routes to `/sub-games/{subGameName}/index.tsx`
3. Index routes to main/entry screen using `router.replace()`

#### Exit Flow (Success)
1. Dispatch `SET_SUB_GAME_COMPLETED` action
2. Call `signalRpgResume()` to trigger RPG refresh
3. Call `exitSubGame({ completed: true })`
4. Navigate to `/game` route (NOT using router.back)

#### Exit Flow (Early Exit/Failure)
1. Call `exitSubGame({ completed: false })`
2. Navigate to `/game` route

### Key Differences Found

| Aspect | AeroWreckage | Tesseract | Resolution |
|--------|--------------|-----------|------------|
| **Logging** | 4 bare `console.log` calls in success.tsx without `__DEV__` guards | All logs properly wrapped in `if (__DEV__)` | ✅ Wrapped all aerowreckage logs in `__DEV__` |
| **Modal Mounting** | Conditional mount: `{showModal && <Modal>}` | Always mounted: `<Modal visible={showModal}>` | ✅ Changed tesseract to conditional mount |
| **Navigation** | Uses `router.push()` for forward, `router.replace()` for index | Same pattern | ✅ Already aligned |
| **Exit Pattern** | Dispatch → Signal → Exit | Same pattern | ✅ Already aligned |

## Changes Made

### 1. Aligned Existing Sub-Games

#### aerowreckage-puzzle/success.tsx
- Wrapped 4 console.log calls in `if (__DEV__)` checks:
  - Line 33: onLayout debug log
  - Lines 61-64: Render count tracking
  - Lines 68-76: State change effects

#### tesseract/screen4.tsx
- Changed modal to conditional mounting pattern:
  - From: `<Modal visible={showScrollModal}>`
  - To: `{showScrollModal && <Modal visible>`
- Matches aerowreckage pattern for performance

### 2. Created Sub-Game Template

Created `/app/sub-games/_subgame-template/` with:

#### Files Created
1. **index.tsx** (16 lines)
   - Entry point that routes to main screen
   - Minimal, clean routing logic

2. **main.tsx** (118 lines)
   - Intro/starting screen
   - Two action buttons: "Leave" and "Investigate"
   - Demonstrates early exit pattern
   - Uses BackgroundImage and BottomActionBar

3. **puzzle.tsx** (144 lines)
   - Gameplay/puzzle screen
   - Placeholder puzzle UI
   - "Give up" button for early exit
   - Example solve logic with navigation

4. **success.tsx** (252 lines)
   - Success screen with reward logic
   - Demonstrates proper exit flow:
     - Dispatch SET_SUB_GAME_COMPLETED
     - Call signalRpgResume()
     - Call exitSubGame({ completed: true })
   - Modal for reward claim
   - TODO comments for reward implementation

5. **README.md** (288 lines)
   - Comprehensive cloning instructions
   - Rename checklist (7 items)
   - File structure documentation
   - Golden path lifecycle explanation
   - Registration instructions
   - Common pitfalls
   - Development tips

#### Template Features

**Proper Wiring:**
- ✅ BackgroundImage component usage
- ✅ BottomActionBar component usage
- ✅ subGameTheme color scheme
- ✅ Correct exitSubGame() calls
- ✅ Proper completion dispatch
- ✅ signalRpgResume() integration
- ✅ Conditional modal mounting
- ✅ DEV-guarded logging

**Clear TODOs:**
- 7 background image requires
- Sub-game name constant (3 files)
- Route paths (3 navigation calls)
- Reward item ID
- Reward dispatch logic
- Intro/success text
- Puzzle UI implementation

**Best Practices:**
- All console.log wrapped in `if (__DEV__)`
- Consistent code style matching existing sub-games
- TypeScript types preserved
- Uses absolute paths for routes
- Follows Expo Router conventions

## Verification

### TypeScript Compilation
- No unique TypeScript errors in template files
- Template errors match pre-existing repo-wide type config issues
- All patterns match existing sub-games

### Code Style
- Prettier check passed (no formatting issues)
- Consistent with aerowreckage-puzzle and tesseract styles
- Proper import organization

### Navigation Pattern
```typescript
// Entry (index.tsx)
router.replace('/sub-games/{name}/main')

// Forward navigation (main.tsx → puzzle.tsx)
router.push('/sub-games/{name}/puzzle')

// Exit (success.tsx or early exit)
exitSubGame({ completed: boolean })
// → navigates to '/game' via router.replace
```

## Golden Path Summary

### Enter Sub-Game
```typescript
// From GameBoard
enterSubGame('my-puzzle', { objectId: 'building-123' })
// → router.replace('/sub-games/my-puzzle')
// → index.tsx → router.replace('/sub-games/my-puzzle/main')
```

### During Sub-Game
```typescript
// Forward navigation
router.push('/sub-games/my-puzzle/next-screen')

// Access game state
const { state, dispatch } = useGameContext()
```

### Exit Sub-Game (Success)
```typescript
// 1. Mark completion
dispatch({
  type: 'SET_SUB_GAME_COMPLETED',
  payload: { subGameName: 'my-puzzle', completed: true }
})

// 2. Signal RPG to refresh
signalRpgResume()

// 3. Exit and navigate back
exitSubGame({ completed: true })
// → router.replace('/game')
```

### Exit Sub-Game (Early/Failure)
```typescript
// Direct exit
exitSubGame({ completed: false })
// → router.replace('/game')
```

## Usage

To create a new sub-game:

1. Copy the template directory:
   ```bash
   cp -r app/sub-games/_subgame-template app/sub-games/my-puzzle
   ```

2. Follow the rename checklist in the template README.md

3. Implement puzzle logic in TODO areas

4. Register in level config with `subGame` property

5. Test full flow: enter → solve → exit

## Files Changed

### Modified Files (2)
- `app/sub-games/aerowreckage-puzzle/success.tsx` - Added DEV guards to logs
- `app/sub-games/tesseract/screen4.tsx` - Changed to conditional modal mount

### Created Files (5)
- `app/sub-games/_subgame-template/index.tsx` - Entry routing
- `app/sub-games/_subgame-template/main.tsx` - Intro screen
- `app/sub-games/_subgame-template/puzzle.tsx` - Gameplay screen
- `app/sub-games/_subgame-template/success.tsx` - Success/reward screen
- `app/sub-games/_subgame-template/README.md` - Complete documentation

## Next Steps

Future sub-game developers can:
1. Clone the template directory
2. Follow the comprehensive README checklist
3. Implement their puzzle logic
4. Register the sub-game in the appropriate level
5. Test and deploy

The template ensures consistency across all sub-games while providing clear guidance for customization.

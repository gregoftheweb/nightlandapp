# Implementation Summary: Dynamic Sub-Game Launch Feature

## What Was Implemented

This PR implements a fully dynamic sub-game launch system for the NightLand RPG, with `aeroWreckage` as the proof-of-concept object.

## Key Features

### 1. Config-Driven Sub-Game Metadata
- Objects can now define sub-game launch parameters directly in their config
- Example (aeroWreckage):
  ```typescript
  subGame: {
    subGameName: "aerowreckage-puzzle",
    ctaLabel: "Investigate",
    requiresPlayerOnObject: true,
  }
  ```

### 2. Position-Based CTA Gating
- CTA button only appears when player is standing ON the object
- Uses new `isPlayerOnObject()` utility to check position overlap
- When player taps from a distance: InfoBox shows description only (no button)
- When player taps while on object: InfoBox shows description + "Investigate" button

### 3. Sub-Game Navigation & State Access
- Sub-games are full-screen Expo Router routes: `/app/sub-games/<name>/index.tsx`
- Navigation helpers: `enterSubGame()`, `exitSubGame()`
- Sub-games have full read/write access to shared `gamestate` via `useGameContext()`
- Returning from sub-game preserves RPG state (player position, HP, inventory, etc.)

### 4. Board Refresh Signal
- GameContext now includes `rpgResumeNonce` counter
- Sub-games call `signalRpgResume()` before exiting
- RPG board can watch nonce to trigger re-render without state reset

### 5. Enhanced InfoBox Component
- Accepts optional `ctaLabel` and `onCtaPress` props
- Remains presentational (no navigation logic inside)
- Styled red CTA button appears below description when provided

## Files Changed

### Type Definitions
- **config/types.ts**
  - Added `SubGameLaunch` interface (subGameName, ctaLabel, requiresPlayerOnObject)
  - Added `SubGameResult` interface (for return data)
  - Extended `GameObject` with optional `subGame?: SubGameLaunch`
  - Extended `GameState` with `subGamesCompleted?: Record<string, boolean>`

### Configuration
- **config/objects.ts**
  - Updated `aeroWreckage` object with sub-game metadata

### State Management
- **context/GameContext.tsx**
  - Added `rpgResumeNonce` state (number counter)
  - Added `signalRpgResume()` function to increment nonce
  - Extended `GameContextType` interface

- **modules/gameState.ts**
  - Initialized `subGamesCompleted: {}` in initial state

- **modules/reducers.ts**
  - Added `SET_SUB_GAME_COMPLETED` action case
  - Updates `state.subGamesCompleted[subGameName]` flag

### Utilities
- **modules/utils.ts**
  - Added `isPlayerOnObject()` function
  - Checks if player position falls within object bounds (row/col + width/height)

### Components
- **components/InfoBox.tsx**
  - Extended props interface (ctaLabel?, onCtaPress?)
  - Added conditional CTA button rendering
  - Added button styles (red theme matching game aesthetic)

- **components/GameBoard.tsx**
  - Imported `isPlayerOnObject` and `enterSubGame`
  - Extended `infoData` state to include CTA props
  - Updated `showInfo()` signature to accept CTA params
  - Rewrote `handleBuildingTap()` to:
    - Extract `building.subGame` config
    - Check player position with `isPlayerOnObject()`
    - Compute `canLaunch` flag
    - Pass CTA to InfoBox only when `canLaunch === true`
  - Updated InfoBox render to pass `ctaLabel` and `onCtaPress`

### Navigation
- **lib/subGames.ts** (new file)
  - `enterSubGame(subGameName, context?)` - Navigate to sub-game route
  - `exitSubGame(result?)` - Navigate back to RPG
  - `signalRpgResume()` - Trigger resume (placeholder, actual call in GameContext)

### Sub-Game Screen
- **app/sub-games/aerowreckage-puzzle/index.tsx** (new file)
  - Full-screen sub-game component
  - Uses `useGameContext()` to access state/dispatch
  - "I Win" button that:
    - Dispatches `SET_SUB_GAME_COMPLETED` action
    - Calls `signalRpgResume()`
    - Calls `exitSubGame({ completed: true })`
  - Black background, red text theme

### Documentation
- **SUBGAME_DESIGN.md** (new file)
  - Architecture decisions and rationale
  - Scalability analysis
  - Trade-offs and alternatives considered

- **TEST_PLAN.md** (new file)
  - Manual test cases
  - Expected behaviors
  - Verification checklist

## How to Add a New Sub-Game

1. **Update object config** in `config/objects.ts`:
   ```typescript
   myObject: {
     // ... existing fields
     subGame: {
       subGameName: "my-puzzle",
       ctaLabel: "Examine",
       requiresPlayerOnObject: true,
     },
   }
   ```

2. **Create screen** at `app/sub-games/my-puzzle/index.tsx`:
   ```typescript
   export default function MyPuzzle() {
     const { state, dispatch, signalRpgResume } = useGameContext();
     
     const handleComplete = () => {
       dispatch({ type: 'MY_ACTION', payload: { ... } });
       signalRpgResume();
       exitSubGame({ completed: true });
     };
     
     return <View>...</View>;
   }
   ```

3. **Done!** No changes to InfoBox, GameBoard, or navigation code required.

## Acceptance Criteria Met

✅ CTA label and target come only from object config (no hardcoding)  
✅ CTA only appears when player is standing ON aeroWreckage AND it is tapped  
✅ Sub-game can read/write shared gamestate via `useGameContext()`  
✅ "I Win" returns to RPG with gamestate preserved  
✅ Board can refresh via resume nonce  
✅ Architecture supports adding many sub-games easily  

## Testing

See `TEST_PLAN.md` for detailed manual test cases. The implementation requires:
1. Moving player to aeroWreckage location (row: 340, col: 298)
2. Tapping object when not on it (no CTA)
3. Tapping object when on it (CTA appears)
4. Pressing CTA to navigate to sub-game
5. Pressing "I Win" to return (state preserved)

## Next Steps (Future Enhancements)

- Add actual puzzle logic to aerowreckage-puzzle screen
- Implement item rewards for sub-game completion
- Add visual feedback for completed sub-games (e.g., object appearance change)
- Support sub-games that DON'T require player on object (set `requiresPlayerOnObject: false`)
- Add sound effects for sub-game entry/exit
- Create shared puzzle UI components for reuse across sub-games

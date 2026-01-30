# Sub-Game Template

This directory contains a minimal, copy-pasteable template for creating new sub-games in the Night Land RPG.

## Quick Start

To create a new sub-game from this template:

1. **Copy the entire `_subgame-template` directory** to a new folder with your sub-game's name:

   ```bash
   cp -r app/sub-games/_subgame-template app/sub-games/my-new-puzzle
   ```

2. **Follow the rename checklist below** to customize the template for your sub-game.

3. **Implement your puzzle logic** in the placeholder areas marked with `TODO` comments.

4. **Register your sub-game** in the game (see "Registering Your Sub-Game" section).

---

## Rename Checklist

When cloning this template, you **must** rename/replace the following:

### 1. Folder Name

- **Current**: `_subgame-template`
- **Action**: Rename to your sub-game name in kebab-case (e.g., `crystal-maze`, `ancient-library`)

### 2. Sub-Game Name Constant

In all `.tsx` files (`index.tsx`, `main.tsx`, `puzzle.tsx`, `success.tsx`):

- **Find**: `const SUB_GAME_NAME = '_subgame-template'`
- **Replace with**: Your sub-game name in kebab-case (e.g., `'crystal-maze'`)
- **Used in**: Logging and completion tracking

### 3. Route Paths

In all navigation calls (`router.replace`, `router.push`):

- **Find**: `/sub-games/_subgame-template/...`
- **Replace with**: `/sub-games/your-subgame-name/...`
- **Files to update**:
  - `index.tsx` (line 12): `router.replace('/sub-games/YOUR-NAME/main' as any)`
  - `main.tsx` (line 32): `router.push('/sub-games/YOUR-NAME/puzzle' as any)`
  - `puzzle.tsx` (line 38): `router.push('/sub-games/YOUR-NAME/success' as any)`

### 4. Background Images

Replace the placeholder image `require()` statements with your own assets:

- **main.tsx** (line 11): `const bgMain = require('@/assets/images/YOUR-IMAGE.png')`
- **puzzle.tsx** (line 11): `const bgPuzzle = require('@/assets/images/YOUR-IMAGE.png')`
- **success.tsx** (line 13): `const bgSuccess = require('@/assets/images/YOUR-IMAGE.png')`

Add your background images to `/assets/images/` before updating these paths.

### 5. Reward Item ID

In `success.tsx`:

- **Find** (line 18): `const REWARD_ITEM_ID = 'template-reward-item'`
- **Replace with**: Your unique reward item ID (e.g., `'crystal-shard'`, `'ancient-tome'`)

### 6. Reward Grant Logic

In `success.tsx` (lines 28-60):

- Uncomment and customize the reward dispatch logic
- Choose the appropriate action type:
  - `ADD_TO_INVENTORY` for collectibles/items
  - `ADD_RANGED_WEAPON` for ranged weapons
  - `ADD_MELEE_WEAPON` for melee weapons (check existing patterns)
- Define your reward item properties (name, description, effects, etc.)

### 7. Placeholder Text

Replace all TODO placeholder content:

- **main.tsx** (line 40): Intro text describing the sub-game scenario
- **puzzle.tsx** (lines 44-48): Puzzle UI and interaction logic
- **success.tsx** (lines 101, 104): Success message and reward description

---

## File Structure

```
_subgame-template/
├── index.tsx       # Entry point - routes to main screen
├── main.tsx        # Screen 1: Intro/starting screen
├── puzzle.tsx      # Screen 2: Puzzle/gameplay screen
├── success.tsx     # Screen 3: Success/reward screen
└── README.md       # This file
```

### Screen Flow

```
index.tsx → main.tsx → puzzle.tsx → success.tsx → exit
     ↓          ↓          ↓            ↓
  (routes)  (start or  (solve or   (claim reward
            leave)      give up)    & return)
```

---

## Registering Your Sub-Game

After creating your sub-game, you need to register it so players can access it from the main game:

### 1. Add to a Level Object

Edit the level configuration where you want the sub-game to appear (e.g., `/config/objects.ts` or level-specific configs):

```typescript
{
  id: 'building-my-puzzle',
  name: 'Mysterious Structure',
  description: 'An ancient structure that beckons exploration...',
  // ... other object properties ...
  subGame: {
    subGameName: 'my-new-puzzle',  // Your folder name
    ctaLabel: 'Investigate',       // Button text in InfoBox
    requiresPlayerOnObject: true   // Player must be standing on object
  }
}
```

### 2. Object Interaction

When the player interacts with this object, the game will:

1. Show an InfoBox with the description and CTA button
2. When clicked, call `enterSubGame('my-new-puzzle')`
3. Navigate to `/sub-games/my-new-puzzle/index.tsx`

---

## Golden Path Lifecycle

This template follows the established sub-game lifecycle pattern:

### Entry

1. Player interacts with a game object that has a `subGame` property
2. `enterSubGame(subGameName)` is called from GameBoard/InfoBox
3. Routes to `/sub-games/{subGameName}/index.tsx`
4. Index routes to the main screen

### During Gameplay

- Use `router.push()` for forward navigation between screens
- Access `useGameContext()` for shared game state
- Use `BackgroundImage` and `BottomActionBar` components for consistent UI

### Exit

1. Call `dispatch({ type: 'SET_SUB_GAME_COMPLETED', payload: { subGameName, completed: true/false } })`
2. Call `signalRpgResume()` to trigger RPG refresh
3. Call `exitSubGame({ completed: boolean })` to navigate back to `/game`
4. **Never** use `router.back()` - always use `exitSubGame()`

---

## Shared Components

The template uses these shared components from `/app/sub-games/_shared/`:

- **BackgroundImage**: Handles background image rendering with proper sizing
- **BottomActionBar**: Consistent bottom action bar with safe area insets
- **subGameTheme**: Shared color scheme (red, blue, black)

Import them like this:

```typescript
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
```

---

## Development Tips

### Logging

- Always wrap `console.log` in `if (__DEV__)` checks
- Use descriptive prefixes: `[YourSubGameName] Message`

### Navigation

- Use absolute paths: `/sub-games/your-name/screen`
- Always use `router.replace()` for index routing
- Use `router.push()` for forward navigation within the sub-game
- Use `exitSubGame()` to return to the main game

### State Management

- Access global game state via `useGameContext()`
- Dispatch actions to update inventory, completion status, etc.
- Local screen state can use `useState()` as needed

### Testing

1. Add your sub-game to a test object in a level
2. Run the app and navigate to that object
3. Test the full flow: enter → solve → claim reward → exit
4. Verify completion state persists (check `state.subGamesCompleted`)

---

## Common Pitfalls

1. **Forgetting to update route paths** - Search for `_subgame-template` in all files
2. **Not wrapping logs in `__DEV__`** - Production builds will have noisy logs
3. **Using `router.back()`** - Always use `exitSubGame()` instead
4. **Not calling `signalRpgResume()`** - RPG won't know to refresh when you return
5. **Typos in `SUB_GAME_NAME`** - Must match your folder name exactly

---

## Need Help?

- Check existing sub-games for examples: `aerowreckage-puzzle`, `tesseract`
- Review `/modules/subGames.ts` for helper functions
- See `SUBGAME_FEATURE_README.md` for architecture details
- Look at `/app/sub-games/_shared/` for shared components

---

## Example: Cloning for a New Sub-Game

```bash
# 1. Copy the template
cp -r app/sub-games/_subgame-template app/sub-games/crystal-maze

# 2. Update all files
# - Replace '_subgame-template' with 'crystal-maze'
# - Replace route paths
# - Update background image requires
# - Implement puzzle logic

# 3. Add to a level object in config
# - Add subGame property with subGameName: 'crystal-maze'

# 4. Test in-game
npm start
```

Happy puzzle building! 🎮

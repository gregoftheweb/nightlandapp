# Aerowreckage Puzzle - Screen Flow Summary

## Implementation Summary

Created 6 new route files and updated the main index.tsx to implement a multi-screen exploration and puzzle experience.

## Route Files Created

### New Screens

1. **entry.tsx** - Screen [1]: Main fuselage interior (NEW entry point)
   - Route: `/sub-games/aerowreckage-puzzle/entry`
   - Background: `aerowreck-safe4.png`
   - Purpose: 3-way choice screen for exploration

2. **cockpit.tsx** - Screen [2]: Cockpit overview
   - Route: `/sub-games/aerowreckage-puzzle/cockpit`
   - Background: `aerowreck-safe5.png`
   - Purpose: Cockpit exploration

3. **cockpit-closeup.tsx** - Screen [3]: Cockpit closeup with combo
   - Route: `/sub-games/aerowreckage-puzzle/cockpit-closeup`
   - Background: `aerowreck-safe6.png`
   - Purpose: Shows the safe combination "28-15-7"

### Existing Screens (Split from original index.tsx)

4. **rear-entry.tsx** - Screen [A]: Rear section with safe
   - Route: `/sub-games/aerowreckage-puzzle/rear-entry`
   - Background: `aerowreck-safe1.png`
   - Purpose: Safe discovery screen
   - **CHANGE**: "Leave it untouched" now goes back to entry instead of exiting to RPG

5. **safe.tsx** - Screen [B]: Safe-cracking puzzle
   - Route: `/sub-games/aerowreckage-puzzle/safe`
   - Background: `aerowreck-safe2.png`
   - Purpose: Interactive dial puzzle
   - No changes to logic

6. **success.tsx** - Screen [C]: Success screen
   - Route: `/sub-games/aerowreckage-puzzle/success`
   - Background: `aerowreck-safe3.png`
   - Purpose: Completion screen
   - No changes to logic

### Router

7. **index.tsx** - Main entry router (UPDATED)
   - Route: `/sub-games/aerowreckage-puzzle`
   - Purpose: Routes to entry.tsx or success.tsx based on puzzle completion state

## Navigation Changes

### Before

```
InfoBox → index.tsx (single file with 3 pages)
           ├─ intro page (safe1)
           ├─ puzzle page (safe2)
           └─ success page (safe3)
```

### After

```
InfoBox → index.tsx (router)
           ├─ [Not completed] → entry.tsx
           │                      ├─ cockpit.tsx → cockpit-closeup.tsx
           │                      └─ rear-entry.tsx → safe.tsx → success.tsx
           │
           └─ [Completed] → success.tsx
```

## Key Navigation Behaviors

### Entry Points

- From RPG InfoBox: Always goes to `index.tsx`, which routes based on completion state
- First time: Routes to `entry.tsx` (Screen [1])
- After completion: Routes to `success.tsx` (Screen [C])

### Exit Points (Return to RPG)

- From `entry.tsx`: "Exit without exploring" button
- From `safe.tsx`: "Leave Without Unlocking" button
- From `success.tsx`: "Return to Quest" button (marks puzzle as completed)

### Internal Navigation

- `entry.tsx` → `cockpit.tsx` (explore cockpit path)
- `entry.tsx` → `rear-entry.tsx` (explore rear path)
- `cockpit.tsx` → `cockpit-closeup.tsx` (look closer)
- `cockpit-closeup.tsx` → `cockpit.tsx` (back)
- `cockpit.tsx` → `entry.tsx` (return to entrance)
- `rear-entry.tsx` → `entry.tsx` (leave it untouched - CHANGED)
- `rear-entry.tsx` → `safe.tsx` (attempt to open)
- `safe.tsx` → `success.tsx` (on successful unlock)

### Reset Button Behavior (Dev Only)

- From `entry.tsx`: Resets and stays on entry
- From `rear-entry.tsx`: Resets and navigates to entry
- From `success.tsx`: Resets and navigates to entry

## File Organization

All files use:

- Expo Router file-based routing
- Shared `BackgroundImage` component
- Shared `BottomActionBar` component
- Shared `subGameTheme` for consistent button styling
- Existing `usePuzzleState` hook for state management

## Testing Checklist

- [ ] Navigation from InfoBox to entry screen works
- [ ] All 3 buttons on entry screen navigate correctly
- [ ] Cockpit exploration path works (entry → cockpit → closeup → back)
- [ ] Rear exploration path works (entry → rear-entry → safe → success)
- [ ] "Leave it untouched" returns to entry (not RPG)
- [ ] Exit buttons return to RPG from appropriate screens
- [ ] State persistence works across navigation
- [ ] Reset button navigates correctly
- [ ] Already-completed puzzle routes to success screen
- [ ] Puzzle completion marks sub-game as completed

# Hide Ability Implementation Summary

## Overview

This document describes the complete implementation of the Hide ability feature for Nightland, a toggleable player ability granted by the Hermit in the hermit-hollow sub-game.

## Feature Specification

### Core Mechanics

- **Max Charge**: 10 turns
- **Recharge Rate**: 1 charge per 3 Christos turns (incremental)
- **Full Recharge Time**: 30 turns from empty
- **Toggle**: Player can activate/deactivate at will
- **Auto-Disable**: Automatically disabled when charge reaches 0

### State Tracking

The following fields are persisted in GameState and SaveGame:

- `hideUnlocked: boolean` - Whether ability has been granted
- `hideChargeTurns: number` - Current charge (0-10)
- `hideActive: boolean` - Whether hide is currently active
- `hideRechargeProgressTurns: number` - Progress toward next charge (0-2)

## Implementation Details

### 1. Type Definitions (`config/types.ts`)

```typescript
export interface Player {
  // ... existing fields ...
  hideUnlocked: boolean
  hideChargeTurns: number
  hideActive: boolean
  hideRechargeProgressTurns: number
}
```

### 2. Player Config (`config/player.ts`)

Default values set to:

```typescript
hideUnlocked: false,
hideChargeTurns: 0,
hideActive: false,
hideRechargeProgressTurns: 0,
```

### 3. Hermit Hollow Dialogue (`app/sub-games/hermit-hollow/dialogue.ts`)

Modified flow:

```
too_much → hermit_gift_hide → silence_end
```

New node:

```typescript
{
  id: 'hermit_gift_hide',
  npcText: 'But before you go, I bestow upon you a portion of my peace and calm.\n\nUsed wisely, it can hide or obscure you from the creatures of the dark.\n\nChristos feels the new power within him.',
  choices: [{ text: 'Thank you.', next: 'silence_end' }],
  effects: ['unlock_hide_ability'],
}
```

### 4. Effects System (`modules/effects.ts`)

New effect handler:

```typescript
const executeUnlockHideAbilityEffect = (effect: Effect, context: EffectContext): EffectResult => {
  // Checks if already unlocked
  // Grants full charge (10 turns)
  // Sets hideUnlocked to true
}
```

Registered in `EFFECT_HANDLERS`:

```typescript
unlock_hide_ability: executeUnlockHideAbilityEffect,
```

### 5. Reducers (`modules/reducers.ts`)

#### TOGGLE_HIDE Action

Handles button press:

- Validates unlock status
- Toggles OFF: Always allowed
- Toggles ON: Requires charge > 0
- Logs state changes in DEV mode

#### UPDATE_HIDE_STATE Action

Called each turn:

1. **Charge Consumption** (if active):
   - Deduct 1 charge
   - Auto-disable if charge reaches 0
2. **Recharge Logic** (always, if not at max):
   - Increment progress counter
   - When progress reaches 3:
     - Add 1 charge (cap at 10)
     - Reset progress to 0

### 6. Turn Manager (`modules/turnManager.ts`)

Integrated in `doTurnCleanup()`:

```typescript
if (currentGameState.player.hideUnlocked) {
  gameDispatch({ type: 'UPDATE_HIDE_STATE' })
}
```

### 7. Monster Movement (`modules/movement.ts`)

Updated `calculateMonsterMovement()`:

```typescript
if (state.player.isHidden || state.player.hideActive) {
  return moveAway(monster, playerPos, state.gridWidth, state.gridHeight)
}
```

Reuses existing `moveAway()` logic from zone-based hide effects.

### 8. Visual Indicator (`components/GameBoard.tsx`)

Modified `getCellBorderColor()`:

```typescript
const getCellBorderColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  _hasGreatPower: GreatPower | undefined,
  _inCombat: boolean,
  hideActive: boolean
) => {
  if (isPlayer && hideActive) return '#00aa00' // Green border
  if (isPlayer) return 'rgba(84, 124, 255, 0.7)' // Normal blue
  // ...
}
```

Call site updated to pass `hideActive`:

```typescript
borderColor: getCellBorderColor(
  isPlayer,
  monsterAtPosition,
  greatPowerAtPosition,
  !!state.inCombat,
  !!state.player?.hideActive
)
```

### 9. PlayerHUD Component (`components/PlayerHUD.tsx`)

#### Props Interface

```typescript
interface PlayerHUDProps {
  // ... existing props ...
  onHidePress?: () => void
  hideUnlocked?: boolean
  hideChargeTurns?: number
  hideActive?: boolean
}
```

#### Hide Button JSX

```tsx
{
  hideUnlocked && (
    <View style={styles.hideButtonContainer}>
      <TouchableOpacity
        style={[
          styles.hideButton,
          hideActive && styles.hideButtonActive,
          hideChargeTurns === 0 && styles.hideButtonDepleted,
        ]}
        onPress={handleHidePress}
        activeOpacity={0.7}
        disabled={hideChargeTurns === 0 && !hideActive}
      >
        <Image
          source={hideButtonIMG}
          style={[styles.hideButtonImage, hideChargeTurns === 0 && styles.hideButtonImageDepleted]}
        />
      </TouchableOpacity>
      {/* Charge meter */}
      <View style={styles.chargeMeter}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={[styles.chargeTick, i < hideChargeTurns && styles.chargeTickFilled]}
          />
        ))}
      </View>
    </View>
  )
}
```

#### Button Positioning

- **Position**: Left side, between Turn/Attack and Zap buttons
- **Left offset**: 40px
- **Bottom**: 15px

#### Visual States

1. **Normal** (charge > 0, not active): Standard appearance
2. **Active** (hideActive === true): Green border (#00aa00)
3. **Depleted** (charge === 0): Dimmed (opacity 0.4), disabled

#### Charge Meter

- 10 segmented ticks below button
- Empty ticks: `rgba(255, 255, 255, 0.2)`
- Filled ticks: `#00aa00` (green)

### 10. Game Context (`app/game/index.tsx`)

#### Handler Function

```typescript
const handleHidePress = useCallback(() => {
  if (!state.player.hideUnlocked) {
    return
  }
  dispatch({ type: 'TOGGLE_HIDE' })
}, [state.player.hideUnlocked, state.player.hideActive, state.player.hideChargeTurns, dispatch])
```

#### Props Passed to PlayerHUD

```tsx
<PlayerHUD
  hp={state.player.hp}
  maxHP={state.player.maxHP}
  onGearPress={handleGearPress}
  onTurnPress={handleTurnPress}
  onAttackPress={handleAttackPress}
  onInventoryPress={handleInventoryPress}
  onZapPress={handleZapPress}
  onHidePress={handleHidePress}
  hideUnlocked={state.player.hideUnlocked}
  hideChargeTurns={state.player.hideChargeTurns}
  hideActive={state.player.hideActive}
  inCombat={state.inCombat}
/>
```

## Save/Load Integration

All hide ability state is automatically persisted through existing save/load infrastructure:

- Auto-save (current game)
- Waypoint saves
- Death resets (ability state preserved if sub-game completed)

The state is serialized via `toSnapshot()` and deserialized via `fromSnapshot()` in `modules/gameState.ts`.

## DEV Logging

The following logs help track hide ability behavior in development:

- `[Hide] activated, charge=X`
- `[Hide] deactivated, charge=Y`
- `[Hide] depleted`
- `[Hide] recharge tick: charge=X`
- `[Hide] Cannot toggle - ability not unlocked`
- `[Hide] Cannot activate - no charge remaining`

## Testing Checklist

### Basic Functionality

- [ ] Complete Hermit Hollow sub-game
- [ ] Verify hide button appears after receiving gift
- [ ] Button shows 10 charge ticks initially
- [ ] Toggle hide ON successfully
- [ ] Christos border turns green when active
- [ ] Monsters move away while hidden

### Charge Mechanics

- [ ] Charge depletes 1 per turn while active
- [ ] Hide auto-disables at 0 charge
- [ ] Recharge occurs at 1 charge per 3 turns
- [ ] Full recharge from 0 to 10 takes 30 turns
- [ ] Early deactivation preserves remaining charge

### Save/Load

- [ ] Hide unlock persists through save/load
- [ ] Current charge persists
- [ ] Active state persists
- [ ] Recharge progress persists
- [ ] Hermit sub-game completion prevents re-grant

### Edge Cases

- [ ] Button hidden when ability not unlocked
- [ ] Button disabled when charge = 0
- [ ] Cannot activate when depleted
- [ ] Minimum 3 turns before recharge from 0
- [ ] Visual indicator clears on deactivation

## Files Modified

1. `config/types.ts` - Player interface fields
2. `config/player.ts` - Default values
3. `app/sub-games/hermit-hollow/dialogue.ts` - Gift dialogue
4. `modules/effects.ts` - Unlock effect handler
5. `modules/reducers.ts` - TOGGLE_HIDE and UPDATE_HIDE_STATE actions
6. `modules/turnManager.ts` - Turn cleanup integration
7. `modules/movement.ts` - Monster movement logic
8. `components/GameBoard.tsx` - Border color indicator
9. `components/PlayerHUD.tsx` - Hide button UI
10. `app/game/index.tsx` - Event handler wiring

## Architecture Notes

### Design Decisions

1. **Reused Existing Hide Logic**: The `moveAway()` function from zone-based effects is reused for consistency
2. **Turn-Based System**: Integrated into existing turn cleanup flow
3. **State-Driven UI**: All visual changes driven by GameState, not HUD-local state
4. **Incremental Recharge**: Progress counter ensures precise 1-per-3-turns recharge
5. **Auto-Disable**: Prevents player confusion when charge runs out mid-use

### Future Enhancements

- Sound effects for hide activation/deactivation
- Particle effects or glow on Christos when hidden
- Cooldown period after depletion
- Upgradeable charge capacity
- Different hide levels (visual vs detection)

## Credits

Implementation completed according to specifications in original problem statement.

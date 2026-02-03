# PlayerHUD.tsx - Hide Button Implementation Summary

## What Was Added to PlayerHUD.tsx

### 1. Import Statement

```typescript
import hideButtonIMG from '@assets/images/buttonHide.png'
```

### 2. Props Interface Extension

```typescript
interface PlayerHUDProps {
  // ... existing props ...
  onHidePress?: () => void // NEW: Hide button callback
  // Hide ability state
  hideUnlocked?: boolean // NEW: Whether ability is unlocked
  hideChargeTurns?: number // NEW: Current charge (0-10)
  hideActive?: boolean // NEW: Whether hide is active
}
```

### 3. Component Props Destructuring

```typescript
const PlayerHUD: React.FC<PlayerHUDProps> = ({
  hp,
  maxHP,
  inCombat,
  onGearPress,
  onTurnPress,
  onAttackPress,
  onInventoryPress,
  onZapPress,
  onHidePress,          // NEW
  hideUnlocked = false, // NEW with default
  hideChargeTurns = 0,  // NEW with default
  hideActive = false,   // NEW with default
}) => {
```

### 4. Event Handler

```typescript
const handleHidePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
  event.stopPropagation()
  onHidePress?.()
}
```

### 5. JSX - Hide Button Component

Added between Zap Button and Turn/Attack Button:

```tsx
{
  /* Hide Button - only show if unlocked */
}
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

### 6. Styles Added

```typescript
// Hide button (between Turn and Zap)
hideButtonContainer: {
  position: 'absolute',
  bottom: 15,
  left: 40,
  zIndex: 20,
  alignItems: 'center',
},

hideButton: {
  width: 40,
  height: 40,
},

hideButtonActive: {
  borderWidth: 2,
  borderColor: '#00aa00',
  borderRadius: 20,
},

hideButtonDepleted: {
  opacity: 0.4,
},

hideButtonImage: {
  width: 40,
  height: 40,
  resizeMode: 'contain',
},

hideButtonImageDepleted: {
  opacity: 0.5,
},

// Charge meter below hide button
chargeMeter: {
  flexDirection: 'row',
  marginTop: 2,
  gap: 1,
},

chargeTick: {
  width: 3,
  height: 6,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 1,
},

chargeTickFilled: {
  backgroundColor: '#00aa00',
},
```

## Key Features

### Conditional Rendering

- Button only appears AFTER the Hermit grants the ability (hideUnlocked === true)
- Before ability is unlocked, no Hide button is visible

### Visual States

1. **Normal** (charge > 0, not active)
   - Standard appearance
   - Button enabled
   - Charge meter shows current charge

2. **Active** (hideActive === true)
   - Green border around button
   - Charge meter shows remaining charge
   - Can tap to deactivate

3. **Depleted** (charge === 0)
   - Dimmed appearance (opacity 0.4)
   - Button disabled
   - Cannot activate until recharged

### Charge Meter

- 10 segmented ticks below the button
- Dynamically updates based on hideChargeTurns
- Empty ticks: semi-transparent white
- Filled ticks: green (#00aa00)
- Visual countdown as charge depletes

### Button Position

- **Left**: 40px from left edge
- **Bottom**: 15px from bottom
- **Between**: Turn/Attack button (center) and Zap button (80px left)
- **Z-Index**: 20 (same as other action buttons)

## Integration with Game

The PlayerHUD component receives hide state from GameState via props in `app/game/index.tsx`:

```tsx
<PlayerHUD
  hp={state.player.hp}
  maxHP={state.player.maxHP}
  // ... other props ...
  onHidePress={handleHidePress}
  hideUnlocked={state.player.hideUnlocked}
  hideChargeTurns={state.player.hideChargeTurns}
  hideActive={state.player.hideActive}
  inCombat={state.inCombat}
/>
```

The `handleHidePress` callback in game/index.tsx dispatches the TOGGLE_HIDE action:

```typescript
const handleHidePress = useCallback(() => {
  if (!state.player.hideUnlocked) {
    return
  }
  dispatch({ type: 'TOGGLE_HIDE' })
}, [state.player.hideUnlocked, state.player.hideActive, state.player.hideChargeTurns, dispatch])
```

## Result

The Hide button will:

1. Not appear initially (ability not unlocked)
2. Appear after completing Hermit Hollow sub-game
3. Show full charge (10 ticks)
4. Toggle hide on/off when tapped
5. Show green border when active
6. Display real-time charge countdown
7. Become disabled when depleted
8. Automatically recharge over time

This creates a seamless, intuitive interface for the Hide ability that integrates perfectly with the existing HUD layout.

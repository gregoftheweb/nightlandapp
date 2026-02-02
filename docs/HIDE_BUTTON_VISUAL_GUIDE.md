# Hide Button UI Changes - Visual Guide

## Change 1: Wider HUD Bar

### Before (Hide Locked)
```
┌────────────────────────────────────┐
│  HP: 100              [GEAR]       │  Width: 350px
└────────────────────────────────────┘

    [ZAP]  [TURN/ATTACK]  [INVENTORY]
```

### After (Hide Unlocked)
```
┌──────────────────────────────────────────────┐
│  HP: 100                    [GEAR]           │  Width: 420px ✨
└──────────────────────────────────────────────┘

  [HIDE]  [ZAP]  [TURN/ATTACK]  [INVENTORY]
  ██████
  (meter)
```

**Key Points:**
- Bar automatically expands when hide ability is unlocked
- Provides 70px additional space (350 → 420)
- Room for future buttons
- Smooth visual transition

---

## Change 2: Gray Progress Dots

### Before
```
Hide Button
[🥷]
████████░░  (10 bright green dots)
  ^^^^^^^
  Green (#00aa00)
```

### After
```
Hide Button
[🥷]
████████░░  (10 gray dots) ✨
  ^^^^^^^
  Gray (#888888)
```

**Key Points:**
- Less bright and distracting
- Better contrast with green active indicator
- More subtle appearance
- Professional look

---

## Change 3: Background Indicator

### Before (Active State)
```
┌────────┐
│ ┌────┐ │  Green border around button
│ │ 🥷 │ │
│ └────┘ │
└────────┘
```

### After (Active State)
```
     ●       Green circle BEHIND button ✨
    ┌─┐      Shows through transparent areas
    │🥷│      Especially visible through "H"
    └─┘
```

**Visual Layers (z-index):**
```
Layer 21: Button Image (PNG with transparency)
            ┌───┐
            │ H │  <- Transparent areas
            └───┘

Layer 19: Green Circle (when active)
            ●●●●●
            ●●●●●  <- Shows through above
            ●●●●●
```

**States:**
- **Inactive:** No background, just button image
- **Active:** Green circle visible behind button
- **Depleted:** Dimmed (opacity 0.4), no background

---

## Change 4: Recharge Rate

### Before
```
Turn Progression:
Turn 1:  ░░░░░░░░░░  (0 charge, progress 1/3)
Turn 2:  ░░░░░░░░░░  (0 charge, progress 2/3)
Turn 3:  █░░░░░░░░░  (1 charge, progress 0/3) ✓
Turn 6:  ██░░░░░░░░  (2 charge)
Turn 9:  ███░░░░░░░  (3 charge)
...
Turn 30: ██████████  (10 charge - FULL)
```

### After
```
Turn Progression:
Turn 1:  ░░░░░░░░░░  (0 charge, progress 1/5)
Turn 2:  ░░░░░░░░░░  (0 charge, progress 2/5)
Turn 3:  ░░░░░░░░░░  (0 charge, progress 3/5)
Turn 4:  ░░░░░░░░░░  (0 charge, progress 4/5)
Turn 5:  █░░░░░░░░░  (1 charge, progress 0/5) ✓ ✨
Turn 10: ██░░░░░░░░  (2 charge)
Turn 15: ███░░░░░░░  (3 charge)
...
Turn 50: ██████████  (10 charge - FULL)
```

**Comparison:**
| Metric | Before | After |
|--------|--------|-------|
| Turns per charge | 3 | 5 ✨ |
| Full recharge time | 30 turns | 50 turns |
| Recharge speed | Fast | Slower (more strategic) |

---

## Complete Visual Example

### Hide Ability Unlocked, Active, 6/10 Charge

```
┌──────────────────────────────────────────────┐
│  HP: 100                    [GEAR]           │
└──────────────────────────────────────────────┘
        ↑ 420px wide (expanded)

     ●                    Active indicator
    ┌─┐                   (green shows through H)
    │🥷│ [⚡] [⚔️] [🎒]
    └─┘
  ██████░░░░              6 gray dots filled
     ↑ Gray (#888888), not green
```

### Hide Ability Unlocked, Inactive, 6/10 Charge

```
┌──────────────────────────────────────────────┐
│  HP: 100                    [GEAR]           │
└──────────────────────────────────────────────┘

    ┌─┐                   No green background
    │🥷│ [⚡] [⚔️] [🎒]
    └─┘
  ██████░░░░              6 gray dots filled
```

### Hide Ability Unlocked, Depleted (0 charge)

```
┌──────────────────────────────────────────────┐
│  HP: 100                    [GEAR]           │
└──────────────────────────────────────────────┘

    ┌─┐                   Dimmed (opacity 0.4)
    │🥷│ [⚡] [⚔️] [🎒]   Button disabled
    └─┘
  ░░░░░░░░░░              0 dots filled
  
  Recharge in 5 turns → 1 dot
  Recharge in 50 turns → 10 dots (full)
```

---

## Code Structure

### PlayerHUD.tsx - Dynamic Width
```typescript
// Constants
const HUD_WIDTH = 350
const HUD_WIDTH_EXPANDED = 420

// Conditional styles
<View style={hideUnlocked ? styles.hudFrameExpanded : styles.hudFrame}>
  <View style={hideUnlocked ? styles.statusBarExpanded : styles.statusBar}>
    {/* HUD content */}
  </View>
</View>
```

### PlayerHUD.tsx - Background Indicator
```typescript
{hideUnlocked && (
  <View style={styles.hideButtonContainer}>
    {/* Background only shows when active */}
    {hideActive && <View style={styles.hideActiveBackground} />}
    
    {/* Button image on top */}
    <TouchableOpacity style={styles.hideButton}>
      <Image source={hideButtonIMG} />
    </TouchableOpacity>
    
    {/* Charge meter below */}
    <View style={styles.chargeMeter}>...</View>
  </View>
)}
```

### reducers.ts - Recharge Logic
```typescript
case 'UPDATE_HIDE_STATE': {
  // ...
  if (!hideActive && newCharge < 10) {
    newProgress = hideRechargeProgressTurns + 1
    if (newProgress >= 5) {  // Changed from >= 3
      newCharge = Math.min(10, newCharge + 1)
      newProgress = 0
    }
  }
  // ...
}
```

---

## Implementation Summary

All changes are **backward compatible**:
- Old saves work correctly
- HUD width adjusts automatically
- No data migration needed
- Visual changes only

All changes are **user-visible**:
- Wider HUD is immediately noticeable
- Gray dots are more subtle
- Green background clearly indicates active state
- Slower recharge affects gameplay strategy

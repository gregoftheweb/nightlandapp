# Hide Button UI Improvements - Implementation Summary

## Overview

Implemented 4 key UI improvements to the Hide button and PlayerHUD based on user feedback.

## Changes Implemented

### 1. Widened PlayerHUD Bar ✅

**Problem:** HUD bar was too narrow when hide button was added, and will need to accommodate more buttons later.

**Solution:**

- Created dynamic width system that expands when hide button is unlocked
- Standard width: `350px`
- Expanded width: `420px` (70px wider)

**Implementation:**

```typescript
// PlayerHUD.tsx
const HUD_WIDTH = 350 // Standard bar width
const HUD_WIDTH_EXPANDED = 420 // Expanded bar width when hide button is unlocked

// Separate styles for expanded mode
hudFrameExpanded: {
  width: HUD_WIDTH_EXPANDED,
  // ... other styles
},

statusBarExpanded: {
  width: HUD_WIDTH_EXPANDED,
  // ... other styles
},

// Dynamic style application in JSX
<View style={hideUnlocked ? styles.hudFrameExpanded : styles.hudFrame}>
  <View style={hideUnlocked ? styles.statusBarExpanded : styles.statusBar}>
```

**Result:**

- HUD automatically widens when hide ability is unlocked
- Provides room for current buttons plus future additions
- Smooth visual transition

---

### 2. Changed Progress Dot Colors ✅

**Problem:** Bright green progress dots (`#00aa00`) were too bright and distracting.

**Solution:**
Changed charge meter filled dot color to a subtle gray.

**Implementation:**

```typescript
// PlayerHUD.tsx - Before
chargeTickFilled: {
  backgroundColor: '#00aa00', // Bright green
},

// PlayerHUD.tsx - After
chargeTickFilled: {
  backgroundColor: '#888888', // Gray
},
```

**Visual:**

```
Before: ██████████ (bright green)
After:  ██████████ (subtle gray)
```

**Result:**

- Less visually distracting
- Better contrast with active state indicator
- More professional appearance

---

### 3. Solid Color Background Indicator ✅

**Problem:** Green border around button when active was requested to be replaced with a background that shows through the "H".

**Solution:**

- Removed green border styling (`hideButtonActive`)
- Added new background div that sits behind the button image
- Background only visible when hide is active
- Green color shows through transparent areas of the button PNG (especially the "H")

**Implementation:**

```typescript
// PlayerHUD.tsx - JSX
{hideUnlocked && (
  <View style={styles.hideButtonContainer}>
    {/* Background indicator - shows through the H */}
    {hideActive && <View style={styles.hideActiveBackground} />}
    <TouchableOpacity style={[styles.hideButton, ...]}>
      <Image source={hideButtonIMG} ... />
    </TouchableOpacity>
    {/* Charge meter */}
  </View>
)}

// PlayerHUD.tsx - Styles
hideActiveBackground: {
  position: 'absolute',
  width: 40,
  height: 40,
  backgroundColor: '#00aa00', // Green
  borderRadius: 20,
  zIndex: 19, // Behind the button image
},

hideButton: {
  width: 40,
  height: 40,
  zIndex: 21, // In front of background
},
```

**Visual Layers:**

```
Layer 21: Button Image (PNG with transparency)
Layer 19: Green Background Circle (only when active)
```

**Result:**

- Green background visible through transparent parts of button image
- Especially visible through the "H" letter
- Clear visual indicator when hide is active
- Cleaner design than border approach

---

### 4. Recharge Rate Changed to 5 Turns ✅

**Problem:** Recharge was too fast at 3 turns per charge point.

**Solution:**
Updated the recharge logic in the reducer to require 5 turns per charge point instead of 3.

**Implementation:**

```typescript
// state/reducer.ts - UPDATE_HIDE_STATE case

// Before
if (newProgress >= 3) {
  newCharge = Math.min(10, newCharge + 1)
  newProgress = 0
}

// After
if (newProgress >= 5) {
  newCharge = Math.min(10, newCharge + 1)
  newProgress = 0
}
```

**Math:**

- Old rate: 1 charge per 3 turns
  - Full recharge (0→10): 30 turns
- New rate: 1 charge per 5 turns
  - Full recharge (0→10): 50 turns

**Result:**

- Slower, more strategic recharge rate
- Encourages careful use of the hide ability
- Full recharge takes 50 turns instead of 30

---

## Files Modified

### 1. `components/PlayerHUD.tsx`

- Added `HUD_WIDTH_EXPANDED` constant (420px)
- Added `hudFrameExpanded` style
- Added `statusBarExpanded` style
- Added `hideActiveBackground` style
- Modified charge meter color: green → gray
- Removed `hideButtonActive` border style
- Updated JSX to conditionally use expanded styles
- Added background indicator div in hide button container

### 2. `state/reducer.ts`

- Modified `UPDATE_HIDE_STATE` case
- Changed recharge threshold from `>= 3` to `>= 5`

---

## Testing Checklist

### Visual Tests

- [ ] HUD bar is 350px wide when hide ability is locked
- [ ] HUD bar expands to 420px when hide ability unlocks
- [ ] Charge meter dots are gray (#888888) not green
- [ ] Green background appears behind hide button when active
- [ ] Green shows through the "H" in the button image
- [ ] No green background when hide is inactive

### Functional Tests

- [ ] Recharge rate is 5 turns per charge point
- [ ] Full recharge (0→10) takes 50 turns
- [ ] Hide button still toggles on/off correctly
- [ ] Charge consumption still 1 per turn when active
- [ ] Button still disables when charge reaches 0

### Edge Cases

- [ ] Loading old saves still works correctly
- [ ] HUD width persists through save/load
- [ ] Background indicator state persists
- [ ] Recharge progress resets correctly at max charge

---

## Before vs After Summary

| Aspect             | Before                 | After                              |
| ------------------ | ---------------------- | ---------------------------------- |
| HUD Width          | Always 350px           | 350px → 420px when unlocked        |
| Progress Dots      | Bright Green (#00aa00) | Gray (#888888)                     |
| Active Indicator   | Green Border           | Green Background (shows through H) |
| Recharge Rate      | 3 turns/charge         | 5 turns/charge                     |
| Full Recharge Time | 30 turns               | 50 turns                           |

---

## Future Improvements

The expanded HUD width (420px) provides room for:

- Current buttons: Turn/Attack, Hide, Zap, Inventory
- Future button mentioned by user
- Additional abilities or features

The modular style system makes it easy to add more expansion states if needed (e.g., `HUD_WIDTH_EXTRA_EXPANDED` for 3+ additional buttons).

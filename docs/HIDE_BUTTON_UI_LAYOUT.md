# PlayerHUD Layout with Hide Button

```
┌────────────────────────────────────────────────────────┐
│                    Status Bar (350px)                   │
│  HP: 100                                      [GEAR]   │
└────────────────────────────────────────────────────────┘

                   Below Status Bar:

     [HIDE]         [TURN/ATTACK]         [ZAP]      [INVENTORY]
    (40px left)       (center)         (80px left)  (72px right)
       │                 │                 │            │
       v                 v                 v            v
    ┌─────┐           ┌─────┐           ┌─────┐      ┌─────┐
    │     │           │     │           │     │      │     │
    │  🥷  │           │  ⚔️  │           │  ⚡  │      │  🎒  │
    │     │           │     │           │     │      │     │
    └─────┘           └─────┘           └─────┘      └─────┘
    ████████          (65x65px)          (40x40px)   (40x40px)
   (Charge Meter)
   10 ticks showing
   current charge


Hide Button States:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LOCKED (not unlocked)
   - Button hidden/not shown

2. NORMAL (charge > 0, not active)
   ┌─────┐
   │     │
   │  🥷  │  Normal opacity
   │     │
   └─────┘
   ██████████  (10 of 10 ticks filled)

3. ACTIVE (hideActive === true)
   ┌─────┐
   │▓▓▓▓▓│
   ▓  🥷  ▓  Green border (#00aa00)
   │▓▓▓▓▓│
   └─────┘
   ██████░░░░  (6 of 10 ticks filled)

   + Christos has GREEN border on gameboard

4. DEPLETED (charge === 0)
   ┌─────┐
   │     │
   │  🥷  │  Dimmed (opacity 0.4)
   │     │  DISABLED
   └─────┘
   ░░░░░░░░░░  (0 of 10 ticks filled)


Charge Meter Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each tick: 3px wide × 6px tall
Gap between ticks: 1px
Total width: ~40px (fits under button)

Empty tick:  ░  rgba(255, 255, 255, 0.2)
Filled tick: █  #00aa00 (green)

Example with 7 charge:
███████░░░


Visual Flow on Gameboard:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NORMAL STATE:
┌─────┐
│     │  Christos cell
│  C  │  Blue border: rgba(84, 124, 255, 0.7)
│     │
└─────┘

HIDE ACTIVE:
┌─────┐
│▓▓▓▓▓│  Christos cell
▓  C  ▓  GREEN border: #00aa00
│▓▓▓▓▓│  Monsters move away!
└─────┘


Button Interaction:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tap Hide Button:
  ├─ If NOT unlocked → No-op
  ├─ If active → Deactivate (always allowed)
  ├─ If charge = 0 → No-op (button disabled)
  └─ If charge > 0 → Activate hide

Each Turn While Active:
  ├─ Consume 1 charge
  └─ If charge reaches 0 → Auto-deactivate

Each Turn (always):
  ├─ Increment recharge progress
  └─ If progress = 3
      ├─ Add 1 charge (max 10)
      └─ Reset progress to 0


Positioning Coordinates:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HUD_WIDTH = 350px

Hide Button Container:
  position: absolute
  bottom: 15px
  left: 40px
  zIndex: 20

Turn/Attack Button:
  position: absolute
  bottom: 2px
  left: 50% (centered)
  marginLeft: -30px

Zap Button:
  position: absolute
  bottom: 15px
  left: 80px

Inventory Button:
  position: absolute
  bottom: 15px
  right: 72px


Technical Implementation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Component: PlayerHUD.tsx
Image: /assets/images/buttonHide.png (4.1KB)
Props: hideUnlocked, hideChargeTurns, hideActive, onHidePress

Conditional Rendering:
{hideUnlocked && (
  // Hide button JSX only renders if ability unlocked
)}

Disabled State:
disabled={hideChargeTurns === 0 && !hideActive}
// Can't activate if no charge
// Can always deactivate

Style Composition:
[
  styles.hideButton,                          // Base style
  hideActive && styles.hideButtonActive,       // Green border
  hideChargeTurns === 0 && styles.hideButtonDepleted  // Dimmed
]
```

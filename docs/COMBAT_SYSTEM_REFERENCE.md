# Combat System Reference

**Status:** Reflects the weapon-stat overhaul implemented and merged this session.
**Scope:** Main-loop (overworld) combat, weapon catalog, range, hide mechanics, and Jaunt Cave's separate combat system.

---

## 1. Core combat formula (main-loop melee + ranged)

Both melee and ranged attacks in the overworld now share one formula, driven by real weapon stats — previously main-loop combat ignored weapon damage/accuracy entirely.

**Accuracy (hit check):**

```
d20 + player.attack + weapon.hitBonus + upgrade.hitBonusAdd  >=  target.ac
```

**Damage (on hit):**

```
(d6 + floor(player.attack / 2) + weapon.damageMod) × upgrade.damageMultiplier
```

- `player.attack` — currently a fixed starting value (8); no content in the game currently increases it.
- `weapon.hitBonus` / `weapon.damageMod` — static per-weapon modifiers from the catalog (§3).
- `upgrade.hitBonusAdd` / `upgrade.damageMultiplier` — from `GameState.weaponUpgrades` (§4), default identity (0 / ×1) if the weapon has never been upgraded.

**Discos baseline is intentionally unchanged:** at `damageMod: 0, hitBonus: 0`, with no upgrade applied, this formula produces byte-for-byte identical output to the pre-overhaul formula (`d6 + floor(attack/2)`, avg 7.5 at attack=8). This was a deliberate design constraint — melee combat should feel exactly as it did before until the player actually earns an upgrade.

---

## 2. Range enforcement (new mechanic)

Prior to this overhaul, **no weapon had any maximum range** — auto-targeting, manual retargeting, and firing all had zero distance checks, despite a misleading "No enemies in range" message.

Now, every ranged weapon has a real `range` value (tiles), enforced using Euclidean world-grid tile distance, at every stage:

- Automatic nearest-target selection (only considers in-range monsters)
- Automatic retargeting after a target is lost
- Manual tap-to-retarget
- Fire validation
- Projectile impact validation

Melee (Discos) has no range restriction beyond existing adjacency/combat-state rules.

---

## 3. Weapon catalog

| Weapon                   | Type   | Damage mod | Hit bonus | Range          | Breaks Hide  |
| ------------------------ | ------ | ---------- | --------- | -------------- | ------------ |
| **Discos**               | Melee  | 0          | 0         | n/a (adjacent) | n/a          |
| **Shurikens**            | Ranged | -1         | +3        | 12             | Never        |
| **Valkyrie's Bow**       | Ranged | +1         | -1        | 22             | Always       |
| **Lazer Pistol**         | Ranged | +3         | +2        | 30             | Always       |
| **Earth-Current Bolter** | Ranged | +5         | +3        | 36             | Always       |
| **Voidglass Needler**    | Ranged | +6         | +5        | 40             | 50% per shot |
| **Cinder-Wrought Torch** | Ranged | +9         | -1        | 24             | Always       |

The three newest weapons (Bolter, Needler, Torch) are fully defined in the catalog with real stats, projectile visuals, and descriptions, but are **not yet obtainable anywhere in the game** — reserved for future reward encounters.

### Descriptions (in-game flavor text)

**Discos** — _Every boy of the Pyramid is given a Discos upon his naming day, wrought by a process the artisans themselves no longer fully understand — the knowledge is old, and much of it has been lost to the slow dying of the world. Each weapon is bound to its bearer alone, tempered in some archaic rite until it seems almost to think. It is why a boy scarce grown can stand against the horrors of the Night Land bare-handed but for this — the Discos knows its wielder, and does not let him fall easily._

**Valkyrie's Bow** — _Named for the Valkyries, a company of women warriors now near-legend, who broke the siege of the Pyramid in an age few living souls remember. This bow is one of the last relics of that war, kept within the Last Redoubt as a thing half weapon, half memory. Its string and shaft are infused with the Earth Current itself, and every arrow it looses burns a pale, unmistakable blue as it flies._

**Shurikens** — _Small, flat blades of honed grey steel, favored by those who move through the dark places close to the Redoubt's walls — scouts, watchers, and those who would rather not be seen at all. They carry no great story, only a practiced hand and a short, certain throw. What they lack in reach, they make up in how rarely they miss._

**Lazer Pistol** — _A strange and gaudy thing to find in the Night Land — sleek, chromed, utterly unlike the hand-wrought weapons of the Pyramid. No one can say where it came from or what hand shaped it. It fires searing blasts of hot orange light with a sound like a held breath released, and whatever its origin, it means business._

**Earth-Current Bolter** — _A channeling rod of the old science, built to draw the Earth Current up through its length and loose it as a bolt of raw, humming force. Those who carry one speak of a faint warmth in the grip, as though the world's last living pulse ran through the weapon and, for a moment, through the one who holds it._

**Voidglass Needler** — _Its ammunition is grown, not forged — thin needles of a black glass said to have cooled somewhere beyond the light of any redoubt, in the true dark between the stars the Night Land has long since swallowed. It is a precise, patient weapon, better suited to a steady hand than a desperate one, and it rarely wastes what little Earth Current it is given._

**Cinder-Wrought Torch** — _Forged in fires that are said to answer to the Salamander himself, this weapon does not so much fire as unleash — a gout of searing cinder-light that scorches whatever stands in its path. It is a brute's tool, ill-suited to careful aim, but nothing struck true by the Torch stands back up._

### Removed

**Short Sword** (`weapon-shortsword-002`) was removed entirely — it had no grant, pickup, or ownership path anywhere in the game and would never have been used.

---

## 4. Weapon upgrade system

`GameState.weaponUpgrades: Record<weaponId, { damageMultiplier: number; hitBonusAdd: number }>`

Supports **repeatable** upgrades to the same weapon — a second upgrade applied to an already-upgraded weapon composes correctly:

- `damageMultiplier`s multiply together
- `hitBonusAdd`s add together

This is the mechanism Deep Silo's ending (in progress) will use to double Discos's effective damage and add +2 hit bonus (+10% accuracy) — and it's designed to support Discos being upgraded again later in the game, not just once.

Persisted in saves; participates in autosave change detection; older saves default to `{}` on load (no upgrades).

---

## 5. Hide / stealth interaction

There are **two separate hide systems** in the game — this section covers only the one weapons interact with.

- `player.hideActive` — the Hermit Hollow-unlocked ability (charge-based, toggled on/off). **This is what weapon fire interacts with.**
- `player.isHidden` — environmental cloaking from safe objects/effects. Unaffected by combat entirely; not covered by anything below.

**Per-weapon rule on firing a ranged weapon:**

- **Shurikens** — never breaks `hideActive`. You can fire from stealth and remain hidden.
- **Voidglass Needler** — 50% independent chance per shot to break `hideActive`.
- **Everything else** (Bow, Lazer Pistol, Bolter, Torch) — always breaks `hideActive`, same as before this system existed.

This does **not** apply inside Jaunt Cave — that encounter is self-contained and has no hide interaction at all, by design.

---

## 6. Jaunt Cave (separate combat system)

Jaunt Cave does **not** use the main-loop d20/AC formula. It has its own hit mechanism and, as of this overhaul, uses the shared damage formula for its numbers.

**Hit determination (unchanged):** a shot only hits if the daemon is in the `LANDED` state at the exact position the player targeted (left/center/right). This is a timing/position match, not a roll — `player.attack` and `weapon.hitBonus` play no role here.

**Damage (updated this session):** now uses the same shared `weaponStats` formula as main-loop combat, replacing the old ad hoc `±20% of catalog damage` math and a hardcoded `3×` Lazer Pistol multiplier.

**Real pacing consequence, playtested and confirmed as a positive change:** the Lazer Pistol's average damage in Jaunt Cave dropped from ~21 to ~10.5 per hit (removing the old hardcoded 3× bonus) — roughly double the hits needed to win with that weapon. Playtested afterward: the fight is **more tense**, still winnable with good play, not broken (no ammo/shot limit exists).

| Weapon               | Jaunt Cave damage (before) | Jaunt Cave damage (after) |
| -------------------- | -------------------------- | ------------------------- |
| Shurikens            | 4–8 (avg 6)                | 4–9 (avg 6.5)             |
| Valkyrie's Bow       | 6–10 (avg 8)               | 6–11 (avg 8.5)            |
| Lazer Pistol         | 15–27 (avg 21)             | 8–13 (avg 10.5)           |
| Earth-Current Bolter | n/a                        | 10–15 (avg 12.5)          |
| Voidglass Needler    | n/a                        | 11–16 (avg 13.5)          |
| Cinder-Wrought Torch | n/a                        | 14–19 (avg 16.5)          |

---

## 7. Known related open items (not part of this system, found incidentally)

These were discovered while investigating hide mechanics and are logged separately, not fixed:

- `modules/combat.ts`'s direct collision guard checks only `isHidden`, not `hideActive` — an existing inconsistency between how the two hide systems are treated by different code paths.
- `DECREMENT_CLOAKING_TURNS` (environmental `isHidden`/`hideTurns` timed expiration) is fully implemented in the reducer but never actually dispatched anywhere — cloaking's documented turn-based expiration currently doesn't run in real gameplay.

See the gameboard system checklist for full tracking of these and other unrelated known issues.

---

_This document reflects the system as merged. Update it if weapon stats, formulas, or mechanics change further._

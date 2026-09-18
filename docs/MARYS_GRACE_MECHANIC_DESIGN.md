# Mary's Grace — Mechanic Design (First Pass)

**Status:** draft, first pass — grounded in the current codebase's existing ability patterns, not
yet built.
**Scope note:** covers the *grant* side (the Pool of Mary encounter, player-state changes, the
unlock effect) in enough detail to build now, and sketches the *consumption* side (the
heartbeat-tap sequence inside House of Silence) as a forward-looking shape, not a committed spec —
that piece is still genuinely open. See
`docs/HOUSE_OF_SILENCE_STORY_DESIGN.md` for the narrative this is mechanizing, and
[[project_nightland_story_bible]] in memory for the wider decisions this sits inside.

## 1. What it is

A third permanent ability, alongside Hide (Hermit) and the charged Discos (Deep Silo) — distinct
from both in kind, not just in source. Hide conceals; the charged Discos harms; this protects
Christos's own heart from being stopped, which is specifically how the Silent Ones kill (per the
source-material research this session: "can destroy or kill by freezing the heart"). It has no
combat application and no use anywhere else in the game — its only purpose is surviving House of
Silence.

**Proposed in-game name: "Grace."** Short, fits the same UI real estate as "Hide" and "Jaunt,"
and is the literal word the prose scene uses ("the Grace of God"). Open to a different name —
flagging it as a real decision, not assuming it's settled just because it's convenient.

## 2. Where it's granted — the Pool of Mary

A new, unique, non-repeatable authored location, architecturally closest to Deep Silo (a single
linear sequence with its own screens/state, not a repeatable manifest-driven shape like
word-grid or Current-Loom — no second instance of this ever exists).

- **Placement:** physically in the shadow of House of Silence, per the prose — meaning on the
  board it should sit on the final approach trail, between the last Current-Loom/Deep Silo
  content and the House of Silence entrance itself. Not reachable before that point; nothing
  gates the player *out* of it once they arrive there (no puzzle to solve — the water simply
  answers his approach, per the story).
- **Gate condition:** should almost certainly require the Deep-Silo-charged Discos already in
  hand — narratively, Christos already went below and came back charged before this final leg.
  Mechanically this can reuse the same `active`/`initialActive`-boolean-on-entrance pattern
  already used for the Current-Loom → Deep Silo hard gate (see `GAMEBOARD_SYSTEM_CHECKLIST.md`),
  keyed off Deep Silo's completion flag instead of Current-Loom count.
- **Interior:** a short, non-puzzle scene — approach, pool fills, waking-dream vision plays (text/
  dialogue in the same register as Hermit Hollow's dialogue tree or the Persius/Salamander
  letters), grace is granted, player exits toward House of Silence. No fail state, no combat, no
  branching choices — this is a guaranteed story beat once reached, the way Persius's notes are
  guaranteed reads, not a challenge.

## 3. Player state

Following the exact shape already used for Hide (`hideUnlocked`/`hideChargeTurns`/`hideActive`/
`hideRechargeProgressTurns`) and the simpler boolean-only shape used for `runeCipherLearned`:

```ts
// Grace ability state (granted by Mary at the pool, shadow of House of Silence)
graceUnlocked: boolean // Whether Mary's grace has been granted
```

A single boolean is very likely sufficient, unlike Hide. Hide is a repeatable, rechargeable
combat/stealth resource used across the whole back half of the game — it needs charge-tracking
because the player can run out and must manage it. Grace, by contrast, is granted once, near the
very end, for a single subsequent sequence that (as currently scoped) the player enters once. If
the heartbeat-tap sequence design below ends up needing its own resource (a "warmth meter," see
§5), that resource likely belongs to House of Silence's own screen state — the same way Deep
Silo's `discosOnTable`/`weaponCharged` live in `deep-silo/puzzleState.ts`, not on `player` — not
back on the global player object. Keep `graceUnlocked` itself minimal; let the consuming screen
own its own runtime state, matching how every other one-off location in this codebase already
works.

## 4. The unlock effect

New effect type, `unlock_grace_ability`, directly mirroring `executeUnlockHideAbilityEffect` /
`executeUnlockRuneCipherEffect` in `modules/effects.ts`:

```ts
const executeUnlockGraceAbilityEffect: EffectHandler<'unlock_grace_ability'> = (effect, context) => {
  const { state, dispatch, showDialog } = context

  if (state.player.graceUnlocked) {
    return { success: false, message: 'You already carry her grace.', consumeItem: false }
  }

  dispatch({
    type: 'UPDATE_PLAYER',
    payload: { updates: { graceUnlocked: true } },
  })

  const message = 'Man is not forsaken.'
  showDialog?.(message, 4000)

  return { success: true, message, consumeItem: true }
}
```

Register it in `EffectByType`/`EFFECT_HANDLERS` alongside the other two unlock effects. Triggered
at the end of the Pool of Mary's scene, the same way Hermit Hollow's dialogue tree ends in
`hermit_enters_trance`/`tesseract_lore_partial`-style effects.

## 5. Consuming it — the heartbeat-tap sequence (sketch, not committed)

This is House of Silence's own interior, which is separately-scoped, deferred work — the shape
below is a starting point for whoever specs that properly, not a spec itself.

- **Core loop:** a pulse/heartbeat indicator on screen with a rhythm; the player taps in time.
  Each missed or mistimed tap drains a warmth/heart-state meter; the meter reaching zero is the
  fail state (echoing "freezing the heart" directly — the meter is losing warmth, not losing an
  abstract HP bar).
- **Why Grace matters here specifically:** without `graceUnlocked`, this sequence — and House of
  Silence generally — should not be enterable at all, matching both the source material (no one
  before Christos returns) and the story's own logic (Mary's gift is what makes the attempt
  survivable in the first place, not an optional buff). The gate check is almost certainly just
  `state.player.graceUnlocked`, reusing the same hard-gate pattern noted in §2.
- **Genre/tech note (carried over from this session's earlier discussion, not re-litigated here):**
  scripted first-person reaction beats, not a true 3D engine — full-bleed images/short animations
  with timed taps is the cheap, high-impact version; no 3D pipeline exists in this Expo/React
  Native codebase and building one for a single sequence isn't worth it.

## 6. Journal surfacing

`modules/expeditionJournal.ts` already has a `discoveries` list keyed off ability flags
(`state.player.jauntUnlocked`, `state.player.runeCipherLearned`). Add a matching entry:

```ts
if (state.player.graceUnlocked) {
  discoveries.push({
    id: 'grace',
    title: 'Her Grace',
    text: 'Man is not forsaken. Something sits where the cold cannot reach it.',
  })
}
```

Keeps the wording consistent with the rest of the journal's non-spoiler, evocative register —
doesn't explain the mechanic, just acknowledges it exists, same as every other discovery entry.

## 7. Open / explicitly not decided in this pass

- Final name for the ability (`graceUnlocked` field name and "Grace" as display text are both
  proposals).
- Any UI treatment for Grace outside the journal — Hide and Jaunt both have dedicated HUD buttons;
  does Grace need one, or is it purely passive/narrative until House of Silence, with no board-level
  UI at all? Leaning toward the latter (nothing to toggle, nothing to spend, until the one place it
  matters) but not decided.
- The heartbeat-tap sequence's actual numbers, screens, and fail/retry behavior — §5 is a shape,
  not a build-ready spec.
- Persius's exact state on discovery and the forced-choice mechanic itself — both still open per
  [[project_nightland_story_bible]], out of scope here too.

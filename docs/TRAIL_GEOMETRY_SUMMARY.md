# Trail Geometry — What It Actually Does

**A plain-language companion to `TRAIL_GEOMETRY_SPEC.md`.** That document is the precise technical contract for implementation; this one explains the same system in terms of what happens in the game, without types and function signatures.

---

## The problem this solves

Right now, every new game places Jaunt Cave, Deep Silo, Aero-Wreckage, Hermit Hollow, and the word-grid puzzles along a completely straight, invisible line — you can see this clearly on the debug minimap. It works, but it's not a real trail. This system replaces that straight line with an actual winding path, generated fresh every time you start a new game.

## The two kinds of path

**The main trail (the "trunk").** This is the one continuous road from where you spawn to where the House of Silence sits, at the end of the game. It's generated to wind — real S-curves and detours, not a straight shot — and it's deliberately long: at least three times longer than a straight line would be between those two points. The intent is a genuinely long, dangerous journey where the player is meant to die and restart several times before reaching the end, not a quick stroll.

The trail always ends at the top of the map, in one of the two top corners — which corner is picked randomly each new game, so you don't know in advance which way the journey leans.

All of the major story encounters — Jaunt Cave, Aero-Wreckage, Deep Silo, and eventually House of Silence itself — sit only on this main trunk. They're the fixed beats of the story, so they never get relegated to some optional side path.

**Branches — optional dead-end detours.** A few times along the main trail (2 to 4 times, randomly), a short side path splits off and dead-ends somewhere nearby. These are never required — you can walk straight past every branch and finish the game just fine. But some of them lead somewhere worth finding: a word-grid puzzle can sit at the very end of a branch, rewarding a player who's curious enough to wander off the main road. Not every branch will have something at the end of it (there are only a couple of word-grid puzzles today), but when there's content available to place, at least one branch will actually have it.

## What you'll actually see

**Footsteps.** The existing hand-placed blue footsteps you see today are completely untouched — they stay exactly as they are. This system adds a second, separate trail of _red_ footsteps that traces the newly generated path — both the main trunk and any branches — so there's a real visual thread to follow, the same way the blue ones already work today, just generated automatically instead of hand-placed.

**The minimap.** Once this is built, generating a new game and opening the debug minimap should show a real winding path with visible branches, instead of today's straight line.

## The safety net

Generating a good, winding, obstacle-free path is naturally a little unpredictable — sometimes the algorithm might try a route that would cross through a building or double back on itself, and it needs to try again. This system builds in real limits on how many times it'll retry before giving up. If it somehow can't produce a good path after many tries (which should be extremely rare), the game doesn't break or refuse to start — it quietly falls back to the old straight-line behavior for that one game, so you're never stuck. You'd probably never actually see this happen in practice.

## What stays the same each time you play

Once a game is generated, its trail is locked in for that playthrough — if you save and come back later, you'll see the exact same path, not a new random one. The game doesn't "re-roll" your trail every time you load; it remembers the one you got.

## What this doesn't do (yet)

- It doesn't change the actual monster spawn rates or difficulty — the danger comes purely from the journey being long and winding, not from making enemies tougher. If that alone doesn't feel dangerous enough once you've played it, that's a separate future tuning pass.
- House of Silence itself doesn't exist as real content yet — this system only guarantees there's a good, clear spot reserved for it once it's built.
- Branches only ever hold one piece of content at their end, not several strung along the way.

## Why this took so long to design

This spec went through four rounds of technical review before implementation, because it touches a lot of existing, already-working systems at once — how saves work, how the game knows what's a wall versus empty space, how footsteps get drawn, how new games get built. Every round found real, specific problems (not nitpicks) that would have caused bugs if built as first proposed — things like: generated footsteps accidentally getting saved in three different places at once, or loading a save accidentally generating and throwing away a brand-new random trail before applying your real one. All of those are fixed now. The final version is considered genuinely ready to build.

---

_For the exact technical contract — interfaces, function signatures, algorithms — see `TRAIL_GEOMETRY_SPEC.md`._
